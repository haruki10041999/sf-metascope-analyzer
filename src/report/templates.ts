import type { ReportProviderName } from '../analyzer/report/registry';

import type { ReportDocument } from './document';

// 用途ごとのレポートの文書の雛形 (docs/implementation-roadmap.md 4.5 のプロンプト)。
// 雛形は例・出発点で、形は固定しない (利用者が自分で書く・AI に組ませる・雛形を直す、のどれでもよい)。
// 第一の目的はドキュメントとコードの理解なので、ドキュメントの雛形 (1 時点。すべてを出す) を主にし、
// 差分の雛形 (diff: true) は補助にする。
// MCP のプロンプトが、雛形と書き方の指示を組み立てて AI に渡す。AI は Narrative の文章を書き、要らないブロックを消す。
// provider の名前は ReportProviderName で型を確かめる。テストで、雛形がそのまま検証を通ることを確かめる

type Element = ReportDocument['spec']['elements'][string];
type DataSource = { provider: ReportProviderName; args?: Record<string, unknown> };

const el = (type: string, props: Record<string, unknown>, children: string[] = []): Element => ({
    type,
    props,
    children,
});

const narrative = (title: string | null, markdown: string) => el('Narrative', { title, markdown });

const card = (title: string, description: string | null, children: string[]) =>
    el('Card', { title, description, maxWidth: 'full', centered: null, className: null }, children);

const summary = (data: string) =>
    el('StatusSummary', { rows: { $state: `/data/${data}` }, title: null });

const table = (data: string, columns: [key: string, label: string][] | null, onlyChanged = true) =>
    el('DataTable', {
        rows: { $state: `/data/${data}` },
        columns: columns ? columns.map(([key, label]) => ({ key, label })) : null,
        caption: null,
        onlyChanged,
    });

const stack = (children: string[]) =>
    el(
        'Stack',
        { direction: 'vertical', gap: 'lg', align: null, justify: null, className: null },
        children,
    );

const matrix = (data: string) =>
    el('Matrix', { data: { $state: `/data/${data}` }, onlyChanged: null });

/** 雛形の文書 (data の provider は型で確かめる)。diff なら保存した基準と作業ツリーを比べる */
const documentOf = (
    title: string,
    data: Record<string, DataSource>,
    elements: Record<string, Element>,
    root: string,
    options: { diff?: true } = {},
): ReportDocument => ({ title, ...options, data, spec: { root, elements } });

/**
 * オブジェクト定義書 (ドキュメント): 一覧・ER 図・項目・選択リスト値・入力規則・レコードタイプ。
 * objects を渡すと、そのオブジェクトだけにする (ER 図は 1 段先まで)
 */
export const objectDefinitionTemplate = (objects?: string[]): ReportDocument => {
    const args = objects && objects.length ? { objects } : undefined;
    const source = (
        provider: DataSource['provider'],
        extra?: Record<string, unknown>,
    ): DataSource => (args || extra ? { provider, args: { ...args, ...extra } } : { provider });
    return documentOf(
        objects && objects.length
            ? `オブジェクト定義書: ${objects.join('・')}`
            : 'オブジェクト定義書',
        {
            objects: source('object.list'),
            diagram: source('object.diagram'),
            // 標準項目 (Id・CreatedDate など) はどのオブジェクトにもあるので、定義書には出さない
            fields: source('object.fields', { includeImplicit: false }),
            picklists: source('object.picklists'),
            validationRules: source('object.validationRules'),
            recordTypes: source('object.recordTypePicklists'),
        },
        {
            page: stack([
                'summary',
                'objectsCard',
                'diagramCard',
                'fieldsCard',
                'picklistsCard',
                'validationRulesCard',
                'recordTypesCard',
            ]),
            summary: narrative(
                '概要',
                '(ここに概要を書く: 各オブジェクトが何を表すか、主なオブジェクトのつながり、気をつける項目・入力規則)',
            ),
            objectsCard: card('オブジェクトの一覧', null, ['objectsTable']),
            objectsTable: table(
                'objects',
                [
                    ['object', 'API 名'],
                    ['label', 'ラベル'],
                    ['objectType', '種類'],
                    ['sharingModel', '共有設定'],
                    ['fieldCount', '項目'],
                    ['validationRuleCount', '入力規則'],
                    ['recordTypeCount', 'レコードタイプ'],
                    ['description', '説明'],
                ],
                false,
            ),
            diagramCard: card('ER 図', '参照関係・主従関係 (主従は太線)', ['diagramView']),
            diagramView: el('ObjectDiagram', {
                data: { $state: '/data/diagram' },
                showAllFields: null,
            }),
            fieldsCard: card(
                '項目',
                'メタデータで定義した項目 (標準項目 Id・CreatedDate などは省いた)',
                ['fieldsTable'],
            ),
            fieldsTable: table(
                'fields',
                [
                    ['object', 'オブジェクト'],
                    ['field', 'API 名'],
                    ['label', 'ラベル'],
                    ['type', '型'],
                    ['required', '必須'],
                    ['length', '長さ'],
                    ['referenceTo', '参照先'],
                    ['formula', '数式'],
                    ['helpText', 'ヘルプ'],
                ],
                false,
            ),
            picklistsCard: card('選択リスト値', '定義の順', ['picklistsTable']),
            picklistsTable: table(
                'picklists',
                [
                    ['object', 'オブジェクト'],
                    ['field', '項目'],
                    ['order', '順'],
                    ['value', '値'],
                    ['label', 'ラベル'],
                    ['isDefault', '既定'],
                    ['isActive', '有効'],
                    ['valueSetName', 'グローバル値セット'],
                ],
                false,
            ),
            validationRulesCard: card('入力規則', null, ['validationRulesTable']),
            validationRulesTable: table(
                'validationRules',
                [
                    ['object', 'オブジェクト'],
                    ['rule', '名前'],
                    ['active', '有効'],
                    ['condition', 'エラー条件'],
                    ['errorMessage', 'エラーメッセージ'],
                    ['errorDisplayField', '表示する項目'],
                ],
                false,
            ),
            recordTypesCard: card('レコードタイプと選択リスト値', null, ['recordTypesTable']),
            recordTypesTable: table(
                'recordTypes',
                [
                    ['object', 'オブジェクト'],
                    ['recordType', 'レコードタイプ'],
                    ['picklist', '選択リスト'],
                    ['values', '選べる値'],
                    ['defaultValue', '既定'],
                ],
                false,
            ),
        },
        'page',
    );
};

/**
 * Apex クラスの仕様書 (ドキュメント): クラス・メンバーの一覧 (private・テストも)、データアクセス (SOQL・SOSL・DML)、
 * 外から使えるもの。classes を渡すと、そのクラス・トリガーだけにする
 */
export const apexSpecificationTemplate = (classes?: string[]): ReportDocument => {
    const args = classes && classes.length ? { classes } : undefined;
    const source = (provider: DataSource['provider']): DataSource =>
        args ? { provider, args } : { provider };
    return documentOf(
        classes && classes.length ? `Apex の仕様書: ${classes.join('・')}` : 'Apex の仕様書',
        {
            outline: source('apex.outline'),
            dataAccess: source('apex.dataAccess'),
            ...(args ? {} : { publicApi: { provider: 'apex.interface' } }),
        },
        {
            page: stack([
                'summary',
                'outlineCard',
                'dataAccessCard',
                ...(args ? [] : ['publicApiCard']),
            ]),
            summary: narrative(
                '概要',
                '(ここに概要を書く: 各クラス・トリガーの役割、主な処理の流れ、読み書きするオブジェクト、気をつけること (ループの中の SOQL / DML など))',
            ),
            outlineCard: card('クラス・メンバー', 'private・テストのクラスも含む', [
                'outlineTable',
            ]),
            outlineTable: table(
                'outline',
                [
                    ['owner', '型'],
                    ['memberType', '種類'],
                    ['name', '名前'],
                    ['access', 'アクセス'],
                    ['static', 'static'],
                    ['params', '引数'],
                    ['type', '型・戻り値・対象'],
                    ['annotations', 'アノテーション'],
                    ['events', 'イベント'],
                ],
                false,
            ),
            dataAccessCard: card(
                'データアクセス',
                'どこで、どのオブジェクト・項目を読み書きするか (SOQL・SOSL・DML)',
                ['dataAccessTable'],
            ),
            dataAccessTable: table(
                'dataAccess',
                [
                    ['member', 'メソッド'],
                    ['operation', '操作'],
                    ['object', 'オブジェクト'],
                    ['fields', '項目'],
                    ['inLoop', 'ループの中'],
                    ['inTest', 'テスト'],
                    ['accessLevel', 'アクセスレベル'],
                ],
                false,
            ),
            ...(args
                ? {}
                : {
                      publicApiCard: card('外から使えるもの', 'global・public・@AuraEnabled など', [
                          'publicApiTable',
                      ]),
                      publicApiTable: table(
                          'publicApi',
                          [
                              ['owner', '型'],
                              ['memberType', '種類'],
                              ['name', '名前'],
                              ['params', '引数'],
                              ['type', '型・戻り値'],
                              ['access', 'アクセス'],
                          ],
                          false,
                      ),
                  }),
        },
        'page',
    );
};

/**
 * LWC のコンポーネント一覧 (ドキュメント): 一覧・置かれている Lightning ページ・コンポーネントごとの中身
 * (親から使えるもの・@wire・Apex・使うコンポーネント・オブジェクトと項目)。components を渡すと、そのコンポーネントだけにする
 */
export const lwcOverviewTemplate = (components?: string[]): ReportDocument => {
    const args = components && components.length ? { components } : undefined;
    return documentOf(
        components && components.length
            ? `LWC のコンポーネント: ${components.join('・')}`
            : 'LWC のコンポーネント一覧',
        {
            components: args
                ? { provider: 'lwc.components', args }
                : { provider: 'lwc.components' },
            placements: args
                ? { provider: 'lwc.placements', args: { lwc: components } }
                : { provider: 'lwc.placements' },
            detail: args ? { provider: 'lwc.detail', args } : { provider: 'lwc.detail' },
            wireframe: args ? { provider: 'lwc.wireframe', args } : { provider: 'lwc.wireframe' },
        },
        {
            page: stack([
                'summary',
                'componentsCard',
                'wireframeCard',
                'placementsCard',
                'detailCard',
            ]),
            summary: narrative(
                '概要',
                '(ここに概要を書く: 各コンポーネントの役割、親子関係とイベントの流れ、使う Apex とデータ、気をつけること (突き合わせの指摘など))',
            ),
            componentsCard: card('コンポーネント', null, ['componentsTable']),
            componentsTable: table(
                'components',
                [
                    ['component', 'コンポーネント'],
                    ['label', 'ラベル'],
                    ['isExposed', '公開'],
                    ['targets', '置ける場所'],
                    ['apiProperties', '@api'],
                    ['events', 'イベント'],
                    ['childComponents', '子コンポーネント'],
                    ['apexMethods', 'Apex'],
                    ['objects', 'オブジェクト'],
                ],
                false,
            ),
            wireframeCard: card(
                '画面の骨組み',
                'テンプレートから描いたワイヤーフレーム (JS は実行しない。分岐はタブ、繰り返しは 1 件分)',
                ['wireframeView'],
            ),
            wireframeView: el('LwcWireframe', {
                data: { $state: '/data/wireframe' },
                component: null,
            }),
            placementsCard: card('置かれている Lightning ページ', null, ['placementsTable']),
            placementsTable: table(
                'placements',
                [
                    ['lwc', 'コンポーネント'],
                    ['flexiPage', 'Lightning ページ'],
                    ['pageType', 'ページの種類'],
                    ['sobjectType', 'オブジェクト'],
                    ['region', 'リージョン'],
                    ['properties', 'プロパティ'],
                ],
                false,
            ),
            detailCard: card(
                'コンポーネントの中身',
                '親から使えるもの・@wire・Apex・使うコンポーネント・オブジェクトと項目・指摘',
                ['detailTable'],
            ),
            detailTable: table(
                'detail',
                [
                    ['component', 'コンポーネント'],
                    ['category', '種類'],
                    ['name', '名前'],
                    ['detail', '詳しく'],
                ],
                false,
            ),
        },
        'page',
    );
};

/**
 * 翻訳の状況 (ドキュメント): オブジェクト × 言語の網羅と、訳が足りない項目 (未訳・翻訳元と同じ・対象がない)。
 * languages を渡すと、その言語だけにする
 */
export const translationOverviewTemplate = (languages?: string[]): ReportDocument => {
    const filter = languages && languages.length ? { languages } : {};
    return documentOf(
        languages && languages.length ? `翻訳の状況: ${languages.join('・')}` : '翻訳の状況',
        {
            coverage: {
                provider: 'translation.coverage',
                ...(languages?.length ? { args: filter } : {}),
            },
            gaps: {
                provider: 'translation.items',
                args: { ...filter, statuses: ['missing', 'sameAsSource', 'orphan', 'outdated'] },
            },
            items: {
                provider: 'translation.items',
                ...(languages?.length ? { args: filter } : {}),
            },
        },
        {
            page: stack(['summary', 'coverageCard', 'gapsCard', 'itemsCard']),
            summary: narrative(
                '概要',
                '(ここに概要を書く: どの言語に訳があるか、網羅の低いオブジェクト、優先して訳すもの)',
            ),
            coverageCard: card('網羅', 'オブジェクト × 言語ごとの件数と割合 (%)', [
                'coverageTable',
            ]),
            coverageTable: table(
                'coverage',
                [
                    ['object', 'オブジェクト'],
                    ['language', '言語'],
                    ['coverage', '網羅 (%)'],
                    ['total', '対象'],
                    ['translated', '訳あり'],
                    ['missing', '未訳'],
                    ['sameAsSource', '翻訳元と同じ'],
                    ['orphan', '対象がない'],
                ],
                false,
            ),
            gapsCard: card('訳が足りない項目', '未訳・翻訳元と同じ・対象がない (・古い)', [
                'gapsTable',
            ]),
            gapsTable: table(
                'gaps',
                [
                    ['object', 'オブジェクト'],
                    ['language', '言語'],
                    ['kind', '種類'],
                    ['name', '名前'],
                    ['source', '翻訳元'],
                    ['translation', '訳'],
                    ['translationStatus', '状態'],
                ],
                false,
            ),
            itemsCard: card('すべての項目', null, ['itemsTable']),
            itemsTable: table(
                'items',
                [
                    ['object', 'オブジェクト'],
                    ['language', '言語'],
                    ['kind', '種類'],
                    ['name', '名前'],
                    ['source', '翻訳元'],
                    ['translation', '訳'],
                    ['translationStatus', '状態'],
                ],
                false,
            ),
        },
        'page',
    );
};

/** システムの構成 (ドキュメント): オブジェクトの関係・コードの公開の形・LWC の置き場所・Flow・自動化・権限・依存関係の図 */
export const systemOverviewTemplate = (): ReportDocument =>
    documentOf(
        'システムの構成',
        {
            apex: { provider: 'apex.interface' },
            lwc: { provider: 'lwc.interface' },
            placements: { provider: 'lwc.placements' },
            flows: { provider: 'flow.list' },
            flowInterface: { provider: 'flow.interface' },
            automation: { provider: 'automation.byObject' },
            objectAccess: { provider: 'permission.objectAccess' },
            graph: { provider: 'dependency.graph', args: { format: 'mermaid' } },
            objects: { provider: 'object.diagram' },
        },
        {
            page: stack([
                'summary',
                'objectsCard',
                'apexCard',
                'lwcCard',
                'flowCard',
                'automationCard',
                'permissionCard',
                'graphCard',
            ]),
            summary: narrative(
                '概要',
                '(ここに概要を書く: このシステムが何をするか、主なオブジェクト・画面・処理の流れ)',
            ),
            objectsCard: card('オブジェクトの関係', 'ER 図 (詳しくはオブジェクト定義書)', [
                'objectsDiagram',
            ]),
            objectsDiagram: el('ObjectDiagram', {
                data: { $state: '/data/objects' },
                showAllFields: null,
            }),
            apexCard: card('Apex の公開メソッド・プロパティ', 'ほかから呼べるもの', ['apexTable']),
            apexTable: table(
                'apex',
                [
                    ['owner', '型'],
                    ['memberType', '種類'],
                    ['name', '名前'],
                    ['params', '引数'],
                    ['type', '型・戻り値'],
                ],
                false,
            ),
            lwcCard: card('LWC', '@api・イベント・slot と、置かれている Lightning ページ', [
                'lwcTable',
                'placementsTable',
            ]),
            lwcTable: table(
                'lwc',
                [
                    ['component', 'コンポーネント'],
                    ['memberType', '種類'],
                    ['name', '名前'],
                ],
                false,
            ),
            placementsTable: table(
                'placements',
                [
                    ['lwc', 'コンポーネント'],
                    ['flexiPage', 'Lightning ページ'],
                    ['pageType', 'ページの種類'],
                    ['sobjectType', 'オブジェクト'],
                    ['region', 'リージョン'],
                    ['properties', 'プロパティ'],
                ],
                false,
            ),
            flowCard: card('Flow', '一覧と入出力の変数', ['flowsTable', 'flowInterfaceTable']),
            flowsTable: table('flows', null, false),
            flowInterfaceTable: table(
                'flowInterface',
                [
                    ['flow', 'Flow'],
                    ['variable', '入出力の変数'],
                    ['direction', '向き'],
                    ['dataType', '型'],
                ],
                false,
            ),
            automationCard: card(
                'オブジェクトごとの自動化',
                'レコードトリガーフロー・Apex トリガー・入力規則と順序',
                ['automationView'],
            ),
            automationView: el('AutomationView', { data: { $state: '/data/automation' } }),
            permissionCard: card(
                'オブジェクトの権限',
                '権限セット・プロファイル × オブジェクトの CRUD',
                ['objectAccessMatrix'],
            ),
            objectAccessMatrix: matrix('objectAccess'),
            graphCard: card('依存関係の図', null, ['graphText']),
            graphText: el('DiagramText', { data: { $state: '/data/graph' }, title: null }),
        },
        'page',
    );

/** 権限の一覧 (ドキュメント): オブジェクト・項目の権限の行列、Apex・Visualforce、権限セットグループが与える権限 */
export const permissionOverviewTemplate = (): ReportDocument =>
    documentOf(
        '権限の一覧',
        {
            objectAccess: { provider: 'permission.objectAccess' },
            fieldAccess: { provider: 'permission.fieldAccess' },
            apexAccess: { provider: 'permission.apexAccess' },
            effective: { provider: 'permission.effective' },
        },
        {
            page: stack(['summary', 'objectCard', 'fieldCard', 'apexCard', 'effectiveCard']),
            summary: narrative(
                '概要',
                '(ここに概要を書く: 権限セット・プロファイルの役割、強い権限を持つもの、気をつけること)',
            ),
            objectCard: card('オブジェクトの権限', 'CRUD・すべて参照・すべて変更', [
                'objectMatrix',
            ]),
            objectMatrix: matrix('objectAccess'),
            fieldCard: card('項目の権限', '参照・編集', ['fieldMatrix']),
            fieldMatrix: matrix('fieldAccess'),
            apexCard: card('Apex クラス・Visualforce ページ', null, ['apexTable']),
            apexTable: table('apexAccess', null, false),
            effectiveCard: card('権限セットグループが与える権限', 'ミュートを除いた実際の権限', [
                'effectiveTable',
            ]),
            effectiveTable: table('effective', null, false),
        },
        'page',
    );

/** リリース前のレビュー (差分): 指摘・権限・公開の形・Flow・依存の変化。保存した基準と作業ツリーを比べる */
export const releaseReviewTemplate = (): ReportDocument =>
    documentOf(
        'リリース前のレビュー',
        {
            findings: { provider: 'metadata.findings' },
            permissions: { provider: 'permission.diffs' },
            apex: { provider: 'apex.interface', args: { onlyChanged: true } },
            lwc: { provider: 'lwc.interface', args: { onlyChanged: true } },
            flow: { provider: 'flow.interface', args: { onlyChanged: true } },
            flowDiffs: { provider: 'flow.diffs' },
            dependencies: { provider: 'dependency.changes' },
        },
        {
            page: stack([
                'summary',
                'findingsCard',
                'permissionsCard',
                'apexCard',
                'lwcCard',
                'flowCard',
                'dependenciesCard',
            ]),
            summary: narrative(
                '要約',
                '(ここに要約を書く: 変更の全体像、リスクの高い変更、確かめてほしいこと)',
            ),
            findingsCard: card('解析の指摘', '前回から新しく出た指摘・なくなった指摘', [
                'findingsSummary',
                'findingsTable',
            ]),
            findingsSummary: summary('findings'),
            findingsTable: table('findings', [
                ['status', '変化'],
                ['severity', '重さ'],
                ['unit', '単位'],
                ['target', '対象'],
                ['message', '内容'],
            ]),
            permissionsCard: card('権限の変更', null, ['permissionsTable']),
            permissionsTable: table('permissions', [
                ['status', '変化'],
                ['holder', '権限セット・プロファイル'],
                ['category', '種類'],
                ['target', '対象'],
                ['changes', '変わった値'],
            ]),
            apexCard: card('Apex の公開メソッド・プロパティ', null, ['apexTable']),
            apexTable: table('apex', [
                ['status', '変化'],
                ['owner', '型'],
                ['memberType', '種類'],
                ['name', '名前'],
                ['params', '引数'],
                ['type', '型・戻り値'],
            ]),
            lwcCard: card('LWC の @api・イベント・slot', null, ['lwcTable']),
            lwcTable: table('lwc', [
                ['status', '変化'],
                ['component', 'コンポーネント'],
                ['memberType', '種類'],
                ['name', '名前'],
            ]),
            flowCard: card('Flow の変更', null, ['flowTable', 'flowDiffsTable']),
            flowTable: table('flow', [
                ['status', '変化'],
                ['flow', 'Flow'],
                ['variable', '入出力の変数'],
                ['direction', '向き'],
                ['dataType', '型'],
            ]),
            flowDiffsTable: table('flowDiffs', [
                ['status', '変化'],
                ['flow', 'Flow'],
                ['element', '要素'],
                ['kind', '種類'],
                ['changedProperties', '変わったもの'],
            ]),
            dependenciesCard: card('依存の増減', 'メンバーの細かさの参照の変化', [
                'dependenciesTable',
            ]),
            dependenciesTable: table('dependencies', [
                ['status', '変化'],
                ['from', '参照元'],
                ['to', '参照先'],
                ['kind', '種類'],
            ]),
        },
        'page',
        { diff: true },
    );

/** 変更の影響: 対象 (項目・クラスなど) を使っているもの・使っているもの側 */
export const impactAnalysisTemplate = (target: string): ReportDocument =>
    documentOf(
        `影響の調査: ${target}`,
        {
            dependents: { provider: 'dependency.dependents', args: { target, depth: 2 } },
            dependencies: { provider: 'dependency.dependencies', args: { target } },
        },
        {
            page: stack(['summary', 'dependentsCard', 'dependenciesCard']),
            summary: narrative(
                '要約',
                '(ここに要約を書く: 変えると影響を受けるもの、確かめる順番、リスク)',
            ),
            dependentsCard: card(`${target} を使っているもの`, '2 段までたどった被依存', [
                'dependentsTable',
            ]),
            dependentsTable: table(
                'dependents',
                [
                    ['depth', '段'],
                    ['type', '種類'],
                    ['name', '名前'],
                    ['id', 'id'],
                ],
                false,
            ),
            dependenciesCard: card(`${target} が使っているもの`, null, ['dependenciesTable']),
            dependenciesTable: table(
                'dependencies',
                [
                    ['type', '種類'],
                    ['name', '名前'],
                    ['id', 'id'],
                ],
                false,
            ),
        },
        'page',
    );
