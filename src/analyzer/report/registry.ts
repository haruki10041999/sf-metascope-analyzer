import { z } from 'zod';

import { getApexDataAccess, getApexOutline } from './apex';
import { getLwcComponents, getLwcDetail, getLwcWireframe } from './lwc';
import { getTranslationCoverage, getTranslationItems } from './translation';
import { getApexInterface, getLwcInterface } from './code';
import { getLabelUsages, getMetadataFindings, getReferenceUsages } from './crossRef';
import {
    getDependencyChanges,
    getDependencyDiagram,
    getDependencyRows,
    getDependentRows,
    getImpactRows,
    getMissingRows,
    getUnusedRows,
} from './dependency';
import {
    getAutomationByObject,
    getFlowDiagrams,
    getFlowDiffs,
    getFlowInterface,
    getFlowList,
    getFlowReferences,
} from './flow';
import {
    getObjectDiagram,
    getObjectFields,
    getObjectList,
    getObjectPicklists,
    getObjectRecordTypePicklists,
    getObjectValidationRules,
} from './object';
import { getFlexiPageDetails, getLayoutDetails, getLwcPlacements } from './page';
import {
    getApexAccess,
    getEffectivePermissions,
    getFieldAccessMatrix,
    getObjectAccessMatrix,
    getPermissionDiffs,
} from './permission';
import * as schemas from './schemas';
import { snapshotInputOf } from './snapshot';
import type { ReportInput } from './types';

// レポートの data provider の登録表 (docs/implementation-roadmap.md 4.2)。
// 名前・説明 (LLM 向け)・分類・出力の形・引数と出力のスキーマ (zod)・例の引数・実行する関数を 1 か所に置く。
// MCP のツール・レポートの文書の検証・カタログ (src/report/llmCatalog.ts) は、すべてここから作る

/** 出力の形 (rows: 行の並び。DataTable・StatusSummary で描ける) */
export type ProviderShape = 'rows' | 'matrix' | 'diagram' | 'object';

export type ProviderCategory =
    'object' | 'permission' | 'flow' | 'code' | 'page' | 'crossRef' | 'dependency';

export type ProviderDefinition<A extends z.ZodType = z.ZodType, O extends z.ZodType = z.ZodType> = {
    description: string;
    category: ProviderCategory;
    shape: ProviderShape;
    args: A;
    output: O;
    /** カタログ・テストに使う例の引数 */
    example?: z.input<A>;
    /**
     * true なら、比べる 2 つの時点が要る (差分だけを返す provider)。文書の diff / compare がないと問題にする。
     * ほかの provider は 1 時点ならその時点のすべてを、比べるなら行に status を付けて返す
     */
    requiresComparison?: true;
    run: (input: ReportInput, args: z.output<A>) => z.output<O>;
};

const define = <A extends z.ZodType, O extends z.ZodType>(definition: ProviderDefinition<A, O>) =>
    definition;

const noArgs = z.object({});
const onlyChanged = z
    .boolean()
    .exactOptional()
    .describe('true returns only the changed rows (when comparing with diff / compare).');
const names = (what: string) =>
    z.array(z.string()).exactOptional().describe(`${what} to include. Omit for all.`);

const traverseArgs = z.object({
    target: z
        .string()
        .min(1)
        .describe('Start node id (field:Invoice__c.Amount__c, apexClass:AccountService etc.).'),
    depth: z
        .number()
        .int()
        .min(1)
        .exactOptional()
        .describe('How many steps to follow (default 1).'),
    level: z
        .enum(['unit', 'member', 'site'])
        .exactOptional()
        .describe('Granularity of the returned nodes.'),
});

const rows = <T extends z.ZodType>(row: T) => z.array(row);

const objectArgs = z.object({ objects: names('Object API names') });

export const PROVIDER_DEFINITIONS = {
    'object.list': define({
        description:
            'オブジェクトの一覧 (ラベル・種類・共有設定・項目・入力規則・レコードタイプの数)。オブジェクト定義書の目次。',
        category: 'object',
        shape: 'rows',
        args: objectArgs,
        output: rows(schemas.ObjectListRowSchema),
        run: (input, args) => getObjectList(snapshotInputOf(input), args),
    }),
    'object.fields': define({
        description:
            '項目の一覧 (型・必須・長さ・参照先・数式・積み上げ集計・選択リスト・ヘルプ)。暗黙の標準項目 (Id・CreatedDate など) も含む。比べるときは変わったプロパティの名前と、選択リスト値の並び順の変化を付ける。',
        category: 'object',
        shape: 'rows',
        args: z.object({
            objects: names('Object API names'),
            includeImplicit: z
                .boolean()
                .exactOptional()
                .describe(
                    'false hides implicit standard fields (Id, CreatedDate ...). Default true.',
                ),
        }),
        example: { objects: ['Invoice__c'] },
        output: rows(schemas.ObjectFieldRowSchema),
        run: (input, args) => getObjectFields(snapshotInputOf(input), args),
    }),
    'object.picklists': define({
        description:
            '選択リスト値 (定義の順・ラベル・既定・有効・色・連動する制御項目の値)。グローバル値セットを使う項目は値セットの名前。',
        category: 'object',
        shape: 'rows',
        args: z.object({
            objects: names('Object API names'),
            fields: names('Field API names'),
        }),
        output: rows(schemas.ObjectPicklistRowSchema),
        run: (input, args) => getObjectPicklists(snapshotInputOf(input), args),
    }),
    'object.validationRules': define({
        description: '入力規則 (有効・エラー条件の数式・エラーメッセージ・表示する項目)。',
        category: 'object',
        shape: 'rows',
        args: objectArgs,
        output: rows(schemas.ObjectValidationRuleRowSchema),
        run: (input, args) => getObjectValidationRules(snapshotInputOf(input), args),
    }),
    'object.recordTypePicklists': define({
        description: 'レコードタイプごとに選べる選択リスト値と既定値。',
        category: 'object',
        shape: 'rows',
        args: objectArgs,
        output: rows(schemas.ObjectRecordTypePicklistRowSchema),
        run: (input, args) => getObjectRecordTypePicklists(snapshotInputOf(input), args),
    }),
    'translation.coverage': define({
        description:
            'オブジェクトの翻訳の網羅 (オブジェクト × 言語ごとの、訳あり・未訳・翻訳元と同じ・対象がない・古い翻訳の件数と割合)。既定はすべての言語。',
        category: 'object',
        shape: 'rows',
        args: z.object({
            languages: names('Locales (ja, en_US ...)'),
            objects: names('Object API names'),
        }),
        output: rows(schemas.TranslationCoverageRowSchema),
        run: (input, args) => getTranslationCoverage(snapshotInputOf(input), args),
    }),
    'translation.items': define({
        description:
            '翻訳する項目ごとの翻訳元・訳・状態 (項目のラベル・ヘルプ・選択リスト値・入力規則のメッセージなど)。statuses で未訳 (missing) だけなどに絞れる。古い翻訳 (outdated) は比べるときだけ分かる。',
        category: 'object',
        shape: 'rows',
        args: z.object({
            languages: names('Locales (ja, en_US ...)'),
            objects: names('Object API names'),
            statuses: z
                .array(z.enum(['translated', 'missing', 'sameAsSource', 'orphan', 'outdated']))
                .exactOptional()
                .describe('Translation statuses to include. Omit for all.'),
        }),
        example: { statuses: ['missing', 'sameAsSource'] },
        output: rows(schemas.TranslationItemRowSchema),
        run: (input, args) => getTranslationItems(snapshotInputOf(input), args),
    }),
    'object.diagram': define({
        description:
            'オブジェクトの ER 図 (参照・主従関係と項目)。objects で起点を選ぶと、そこから depth 段 (両方向) にたどったものに絞る。',
        category: 'object',
        shape: 'diagram',
        args: z.object({
            objects: names('Start object API names'),
            depth: z
                .number()
                .int()
                .min(1)
                .exactOptional()
                .describe('How many relations to follow from objects (default 1).'),
        }),
        output: schemas.ObjectDiagramSchema,
        run: (input, args) => getObjectDiagram(snapshotInputOf(input), args),
    }),
    'permission.diffs': define({
        description:
            '権限セット・プロファイルの変更 (オブジェクト・項目・Apex・カスタム権限・システム権限の行ごとに、変わった値)。',
        category: 'permission',
        shape: 'rows',
        args: noArgs,
        output: rows(schemas.PermissionDiffRowSchema),
        requiresComparison: true,
        run: (input) => getPermissionDiffs(snapshotInputOf(input)),
    }),
    'permission.objectAccess': define({
        description: '権限セット・プロファイル × オブジェクトの CRUD の行列。',
        category: 'permission',
        shape: 'matrix',
        args: z.object({ onlyChanged, rows: names('Objects') }),
        output: schemas.ObjectAccessMatrixSchema,
        run: (input, args) => getObjectAccessMatrix(snapshotInputOf(input), args),
    }),
    'permission.fieldAccess': define({
        description: '権限セット・プロファイル × 項目の参照・編集の行列。',
        category: 'permission',
        shape: 'matrix',
        args: z.object({ onlyChanged, rows: names('Fields (Object.Field)') }),
        output: schemas.FieldAccessMatrixSchema,
        run: (input, args) => getFieldAccessMatrix(snapshotInputOf(input), args),
    }),
    'permission.apexAccess': define({
        description: '権限セット・プロファイルが実行できる Apex クラス・Visualforce ページ。',
        category: 'permission',
        shape: 'rows',
        args: noArgs,
        output: rows(schemas.ApexAccessRowSchema),
        run: (input) => getApexAccess(snapshotInputOf(input)),
    }),
    'permission.effective': define({
        description: '権限セットグループ (ミュートを含む) が実際に与える権限。',
        category: 'permission',
        shape: 'rows',
        args: noArgs,
        output: rows(schemas.EffectivePermissionRowSchema),
        run: (input) => getEffectivePermissions(snapshotInputOf(input)),
    }),
    'flow.list': define({
        description: 'Flow の一覧 (種類・起動条件・対象オブジェクト・状態・要素の数)。',
        category: 'flow',
        shape: 'rows',
        args: noArgs,
        output: rows(schemas.FlowListRowSchema),
        run: (input) => getFlowList(snapshotInputOf(input)),
    }),
    'flow.diagram': define({
        description: 'Flow の要素と接続の図 (差分の status 付き)。',
        category: 'flow',
        shape: 'diagram',
        args: z.object({ flows: names('Flow API names') }),
        output: z.array(schemas.FlowDiagramSchema),
        run: (input, args) => getFlowDiagrams(snapshotInputOf(input), args.flows),
    }),
    'flow.diffs': define({
        description: 'Flow の要素・資源・起動の変更 (変わったプロパティの名前)。',
        category: 'flow',
        shape: 'rows',
        args: noArgs,
        output: rows(schemas.FlowDiffRowSchema),
        requiresComparison: true,
        run: (input) => getFlowDiffs(snapshotInputOf(input)),
    }),
    'flow.references': define({
        description:
            'Flow が参照する項目・Apex・サブフロー・LWC・ラベル (参照先がなければ problem に指摘)。',
        category: 'flow',
        shape: 'rows',
        args: noArgs,
        output: rows(schemas.FlowReferenceRowSchema),
        run: (input) => getFlowReferences(snapshotInputOf(input)),
    }),
    'flow.interface': define({
        description:
            'Flow の入力・出力の変数。前回と比べると、増えた・減った・変わった入出力が分かる (サブフロー・Apex からの呼び出しへの影響)。',
        category: 'flow',
        shape: 'rows',
        args: z.object({ onlyChanged }),
        output: rows(schemas.FlowInterfaceRowSchema),
        run: (input, args) => getFlowInterface(snapshotInputOf(input), args),
    }),
    'apex.outline': define({
        description:
            'Apex のクラス・トリガーのすべてのクラス・メンバー (メソッド・コンストラクタ・プロパティ・項目・内側の型。private とテストも) と、トリガーの対象とイベント。コードの理解・クラスの仕様書のため。外から使えるものだけは apex.interface。',
        category: 'code',
        shape: 'rows',
        args: z.object({
            classes: names('Class or trigger names'),
            includeTests: z
                .boolean()
                .exactOptional()
                .describe('false hides test classes (@isTest). Default true.'),
        }),
        example: { classes: ['AccountService'] },
        output: rows(schemas.ApexOutlineRowSchema),
        run: (input, args) => getApexOutline(snapshotInputOf(input), args),
    }),
    'apex.dataAccess': define({
        description:
            'Apex がどこで (クラス・メソッド) どのオブジェクト・項目を読み書きするか (SOQL・SOSL・動的なクエリ・DML)。ループの中か (ガバナ制限の原因になりやすい)・テストの中かも出す。DML の項目は、同じメソッドで代入している項目。',
        category: 'code',
        shape: 'rows',
        args: z.object({
            classes: names('Class, trigger or anonymous Apex names'),
            objects: names('Object API names'),
            includeTests: z
                .boolean()
                .exactOptional()
                .describe('false hides queries and DML in tests. Default true.'),
        }),
        output: rows(schemas.ApexDataAccessRowSchema),
        run: (input, args) => getApexDataAccess(snapshotInputOf(input), args),
    }),
    'apex.interface': define({
        description:
            'Apex の外から使えるクラス・メンバー (global・public・@AuraEnabled など)。前回と比べると、公開メソッドの追加・削除・引数や戻り値の型の変化が分かる。',
        category: 'code',
        shape: 'rows',
        args: z.object({ onlyChanged }),
        output: rows(schemas.ApexInterfaceRowSchema),
        run: (input, args) => getApexInterface(snapshotInputOf(input), args),
    }),
    'lwc.components': define({
        description:
            'LWC のコンポーネントの一覧 (ラベル・公開先・@api・発行するイベント・使う子コンポーネントと基本コンポーネント・Apex・オブジェクト・突き合わせの指摘の数)。コンポーネント一覧のドキュメントのため。',
        category: 'code',
        shape: 'rows',
        args: z.object({ components: names('Component names (accountList or c/accountList)') }),
        output: rows(schemas.LwcComponentRowSchema),
        run: (input, args) => getLwcComponents(snapshotInputOf(input), args),
    }),
    'lwc.detail': define({
        description:
            'LWC のコンポーネントの中身 (親から使える @api・メソッド・イベント・slot、@wire とアダプター、Apex のメソッド、使うコンポーネント、オブジェクトと項目、ラベルなどの import、突き合わせの指摘)。1 行 1 項目。',
        category: 'code',
        shape: 'rows',
        args: z.object({
            components: names('Component names (accountList or c/accountList)'),
            categories: z
                .array(
                    z.enum([
                        'property',
                        'method',
                        'event',
                        'slot',
                        'wire',
                        'apex',
                        'child',
                        'baseComponent',
                        'object',
                        'field',
                        'label',
                        'customPermission',
                        'resource',
                        'messageChannel',
                        'finding',
                    ]),
                )
                .exactOptional()
                .describe('Categories to include. Omit for all.'),
        }),
        example: { components: ['accountList'] },
        output: rows(schemas.LwcDetailRowSchema),
        run: (input, args) => getLwcDetail(snapshotInputOf(input), args),
    }),
    'lwc.wireframe': define({
        description:
            'LWC の画面の骨組み (ワイヤーフレーム)。テンプレートから描き、JS は実行しない。分岐 (lwc:if など) はタブ、繰り返し (for:each) は 1 件分、子コンポーネントは展開して入れ子に描く。画面の仕様書のため。',
        category: 'code',
        shape: 'diagram',
        args: z.object({
            components: names('Component names (accountList or c/accountList)'),
            depth: z
                .number()
                .int()
                .min(0)
                .exactOptional()
                .describe(
                    'How many levels of child components to include for expanding (default 3).',
                ),
        }),
        example: { components: ['accountList'] },
        output: schemas.LwcWireframeSchema,
        run: (input, args) => getLwcWireframe(snapshotInputOf(input), args),
    }),
    'lwc.interface': define({
        description:
            'LWC の親から使えるもの (@api のプロパティ・メソッド、発行するイベント、slot)。前回と比べると、増えた・減ったものが分かる。',
        category: 'code',
        shape: 'rows',
        args: z.object({ onlyChanged }),
        output: rows(schemas.LwcInterfaceRowSchema),
        run: (input, args) => getLwcInterface(snapshotInputOf(input), args),
    }),
    'automation.byObject': define({
        description:
            'オブジェクトごとの自動化 (レコードトリガーフロー・Apex トリガー・入力規則) と順序。',
        category: 'flow',
        shape: 'object',
        args: noArgs,
        output: z.array(schemas.AutomationRowSchema),
        run: (input) => getAutomationByObject(snapshotInputOf(input)),
    }),
    'layout.detail': define({
        description: 'ページレイアウトのセクションと項目・関連リスト・アクション (差分付き)。',
        category: 'page',
        shape: 'object',
        args: z.object({ layouts: names('Layout names') }),
        output: z.array(schemas.LayoutDetailSchema),
        run: (input, args) => getLayoutDetails(snapshotInputOf(input), args.layouts),
    }),
    'flexiPage.detail': define({
        description: 'Lightning ページのリージョンと部品 (LWC・標準の部品) とプロパティ。',
        category: 'page',
        shape: 'object',
        args: z.object({ flexiPages: names('FlexiPage names') }),
        output: z.array(schemas.FlexiPageDetailSchema),
        run: (input, args) => getFlexiPageDetails(snapshotInputOf(input), args.flexiPages),
    }),
    'lwc.placements': define({
        description: 'LWC がどの Lightning ページのどのリージョンに置かれているか。',
        category: 'page',
        shape: 'rows',
        args: z.object({ lwc: names('LWC bundle names') }),
        output: rows(schemas.LwcPlacementRowSchema),
        run: (input, args) => getLwcPlacements(snapshotInputOf(input), args.lwc),
    }),
    'crossRef.labels': define({
        description:
            'カスタム表示ラベルの使われている場所 (Apex・LWC・Flow など) と未使用のラベル。',
        category: 'crossRef',
        shape: 'rows',
        args: noArgs,
        output: rows(schemas.LabelUsageRowSchema),
        run: (input) => getLabelUsages(input),
    }),
    'crossRef.references': define({
        description:
            '参照先 (項目・クラス・コンポーネントなど) ごとの、参照している単位 (逆引き)。',
        category: 'crossRef',
        shape: 'rows',
        args: noArgs,
        output: rows(schemas.ReferenceUsageRowSchema),
        run: (input) => getReferenceUsages(input),
    }),
    'metadata.findings': define({
        description:
            '解析の指摘 (権限・ラベル・Flow・画面・参照)。前回と比べると、新しく出た指摘は added、なくなった指摘は removed。',
        category: 'crossRef',
        shape: 'rows',
        args: noArgs,
        output: rows(schemas.FindingRowSchema),
        run: (input) => getMetadataFindings(input),
    }),
    'dependency.dependents': define({
        description: 'ノードを使っているもの (逆引き。「この項目を使っているもの」)。',
        category: 'dependency',
        shape: 'rows',
        args: traverseArgs,
        example: { target: 'field:Invoice__c.Amount__c' },
        output: rows(schemas.DependencyNodeRowSchema),
        run: (input, args) => getDependentRows(input, args),
    }),
    'dependency.dependencies': define({
        description: 'ノードが使っているもの。',
        category: 'dependency',
        shape: 'rows',
        args: traverseArgs,
        example: { target: 'apexClass:AccountService' },
        output: rows(schemas.DependencyNodeRowSchema),
        run: (input, args) => getDependencyRows(input, args),
    }),
    'dependency.impact': define({
        description: '前回から変わった単位と、それを使っているため影響を受ける単位。',
        category: 'dependency',
        shape: 'object',
        args: z.object({
            depth: z
                .number()
                .int()
                .min(1)
                .exactOptional()
                .describe('How many steps to follow (default 2).'),
        }),
        output: schemas.DependencyImpactSchema,
        requiresComparison: true,
        run: (input, args) => getImpactRows(input, args),
    }),
    'dependency.missing': define({
        description:
            'リポジトリにない参照先 (存在しない項目・クラス・コンポーネント・ラベルなど)。',
        category: 'dependency',
        shape: 'rows',
        args: noArgs,
        output: rows(schemas.DependencyMissingRowSchema),
        run: (input) => getMissingRows(input),
    }),
    'dependency.unused': define({
        description: 'ほかから使われていないもの (掃除の候補)。',
        category: 'dependency',
        shape: 'rows',
        args: noArgs,
        output: rows(schemas.DependencyNodeRowSchema),
        run: (input) => getUnusedRows(input),
    }),
    'dependency.changes': define({
        description: '前回と比べた、依存の増減 (メンバーの細かさ)。',
        category: 'dependency',
        shape: 'rows',
        args: noArgs,
        output: rows(schemas.DependencyChangeRowSchema),
        requiresComparison: true,
        run: (input) => getDependencyChanges(input),
    }),
    'dependency.graph': define({
        description: '依存関係の図 (Mermaid か DOT の文字列。単位の細かさ)。',
        category: 'dependency',
        shape: 'diagram',
        args: z.object({
            targets: names('Start node ids'),
            depth: z.number().int().min(1).exactOptional(),
            format: z.enum(['mermaid', 'dot']).exactOptional(),
        }),
        output: schemas.DependencyDiagramSchema,
        run: (input, args) => getDependencyDiagram(input, args),
    }),
};

export type ReportProviderName = keyof typeof PROVIDER_DEFINITIONS;

type Definitions = typeof PROVIDER_DEFINITIONS;

/** provider の関数 (引数を zod で確かめてから実行する。引数を省けば既定) */
export type ReportProviderFunctions = {
    [K in ReportProviderName]: (
        input: ReportInput,
        args?: z.input<Definitions[K]['args']>,
    ) => ReturnType<Definitions[K]['run']>;
};

export const REPORT_PROVIDERS = Object.fromEntries(
    Object.entries(PROVIDER_DEFINITIONS).map(([name, definition]) => {
        const def = definition as ProviderDefinition;
        return [
            name,
            (input: ReportInput, args?: unknown) => def.run(input, def.args.parse(args ?? {})),
        ];
    }),
) as ReportProviderFunctions;

export const isReportProviderName = (name: string): name is ReportProviderName =>
    Object.hasOwn(PROVIDER_DEFINITIONS, name);

/** provider の定義 (名前で引く) */
export const providerDefinitionOf = (name: ReportProviderName): ProviderDefinition =>
    PROVIDER_DEFINITIONS[name] as ProviderDefinition;

/** 比べる 2 つの時点がないと使えない provider か */
export const requiresComparison = (name: ReportProviderName): boolean =>
    providerDefinitionOf(name).requiresComparison === true;

/** 比べる時点がないのに、比べる時点が要る provider を使ったときの説明 */
export const comparisonRequiredMessage = (name: string): string =>
    `Provider ${name} returns only changes and needs two points to compare: set "diff": true (saved baseline -> working tree; save_baseline saves the baseline) or "compare" (git range).`;
