import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { ReportDocument } from '../report/document';
import {
    apexSpecificationTemplate,
    impactAnalysisTemplate,
    lwcOverviewTemplate,
    objectDefinitionTemplate,
    permissionOverviewTemplate,
    releaseReviewTemplate,
    systemOverviewTemplate,
    translationOverviewTemplate,
} from '../report/templates';

// 用途ごとのプロンプト (docs/implementation-roadmap.md 4.5)。
// 使うツールの流れ・書き方の指示・文書の雛形 (src/report/templates.ts) を組み立てて返す。skill と同じ内容をプロンプトでも出す。
// 雛形は出発点で、利用者の求めに合わせて自由に組み替えてよい (形は固定しない)

const STEPS = [
    '1. list_report_components で、書き方の決まりと部品・provider の一覧を読む。',
    '2. 雛形の data にある provider を get_report_data で呼び、内容を読む (レポートの材料。数値・一覧は文書に書き写さない)。既定は今の状態のすべて。差分を見る文書 (diff: true) なら get_report_data にも diff: true を、ブランチの変更を見るなら compare ({ "from": "main" } など) を付ける。',
    '3. 雛形の Narrative の markdown を、読んだ内容から書く。雛形は出発点なので、利用者の求めに合わせてカード・データ・部品を足したり消したりしてよい (list_report_providers・list_report_components で選ぶ)。行が 0 件のカードは消してよい。',
    '4. validate_report_spec で文書を確かめ、問題があれば直す。',
    '5. build_report で HTML を作り、書いたファイルのパスと要約を伝える。',
];

const messageOf = (goal: string, document: ReportDocument, extra: string[] = []) => ({
    messages: [
        {
            role: 'user' as const,
            content: {
                type: 'text' as const,
                text: [
                    goal,
                    '',
                    '## 手順',
                    '',
                    ...STEPS,
                    ...(extra.length
                        ? ['', '## 注意', '', ...extra.map((line) => `- ${line}`)]
                        : []),
                    '',
                    '## 文書の雛形',
                    '',
                    '```json',
                    JSON.stringify(document, null, 2),
                    '```',
                ].join('\n'),
            },
        },
    ],
});

export const registerReportPrompts = (server: McpServer): void => {
    server.registerPrompt(
        'system_overview',
        {
            title: 'システムの構成の説明',
            description:
                '今のリポジトリの構成 (Apex・LWC・Flow・自動化・権限・依存関係) を説明するドキュメントを作る',
            argsSchema: {
                focus: z
                    .string()
                    .optional()
                    .describe('特に説明してほしいこと (オブジェクト名・機能など)。省略可'),
            },
        },
        async ({ focus }) =>
            messageOf(
                'このシステムの構成を説明するドキュメントを作ってください。',
                systemOverviewTemplate(),
                [
                    ...(focus
                        ? [
                              `特に「${focus}」に関係するものを詳しく説明する (provider の引数で絞ってよい)。`,
                          ]
                        : []),
                    '読み手はこのシステムを初めて見る開発者。概要には、主なオブジェクト・画面・処理の流れと、それらのつながりを書く。',
                    '依存関係の図が大きすぎるときは、dependency.graph の targets で主なものに絞る。',
                ],
            ),
    );

    server.registerPrompt(
        'object_definition',
        {
            title: 'オブジェクト定義書',
            description:
                'オブジェクトの一覧・ER 図・項目・選択リスト値・入力規則・レコードタイプをまとめたドキュメントを作る',
            argsSchema: {
                objects: z
                    .string()
                    .optional()
                    .describe('対象のオブジェクトの API 名 (カンマ区切り)。省略するとすべて'),
            },
        },
        async ({ objects }) => {
            const names = objects
                ?.split(',')
                .map((name) => name.trim())
                .filter(Boolean);
            return messageOf(
                'オブジェクト定義書を作ってください。',
                objectDefinitionTemplate(names),
                [
                    '読み手は、このシステムのデータの持ち方を知りたい開発者・管理者。概要には、各オブジェクトが何を表すかと、主なつながり (参照・主従) を書く。',
                    'オブジェクトが多いときは、まとまり (業務) ごとに objects で絞った文書に分けてよい。',
                    '項目の数式・入力規則の条件は、読んだ内容を要約して概要に書いてよい (表の値は書き写さない)。',
                ],
            );
        },
    );

    server.registerPrompt(
        'apex_specification',
        {
            title: 'Apex の仕様書',
            description:
                'Apex のクラス・トリガーのメンバー・データアクセス (SOQL・SOSL・DML)・外から使えるものをまとめたドキュメントを作る',
            argsSchema: {
                classes: z
                    .string()
                    .optional()
                    .describe('対象のクラス・トリガーの名前 (カンマ区切り)。省略するとすべて'),
            },
        },
        async ({ classes }) => {
            const names = classes
                ?.split(',')
                .map((name) => name.trim())
                .filter(Boolean);
            return messageOf('Apex の仕様書を作ってください。', apexSpecificationTemplate(names), [
                '読み手は、このコードを読んで直す開発者。概要には、各クラス・トリガーの役割と、主な処理の流れ (どのメソッドがどのオブジェクトを読み書きするか) を書く。',
                'ループの中の SOQL / DML (inLoop) は、ガバナ制限の原因になりやすいので概要に書く。',
                '呼び出し元を知りたいときは get_dependents (apexClass:<名前> や apexMethod:<クラス>.<メソッド>) で調べる。',
            ]);
        },
    );

    server.registerPrompt(
        'lwc_overview',
        {
            title: 'LWC のコンポーネント一覧',
            description:
                'LWC のコンポーネントの一覧・置かれている場所・中身 (@api・イベント・@wire・Apex・使うコンポーネント・データ) をまとめたドキュメントを作る',
            argsSchema: {
                components: z
                    .string()
                    .optional()
                    .describe('対象のコンポーネントの名前 (カンマ区切り)。省略するとすべて'),
            },
        },
        async ({ components }) => {
            const names = components
                ?.split(',')
                .map((name) => name.trim())
                .filter(Boolean);
            return messageOf(
                'LWC のコンポーネント一覧を作ってください。',
                lwcOverviewTemplate(names),
                [
                    '読み手は、画面の作りを知りたい開発者。概要には、各コンポーネントの役割と、親子関係 (どの親がどの子に何を渡し、どのイベントを受け取るか) を書く。',
                    'Apex の呼び出し (@wire・呼び出し) と、使うオブジェクト・項目は、データの流れとして概要に書く。Apex の中身は apex_specification で調べられる。',
                    '突き合わせの指摘 (category: finding) は誤検出がありうるので、確かめてほしいこととして書く。',
                ],
            );
        },
    );

    server.registerPrompt(
        'translation_overview',
        {
            title: '翻訳の状況',
            description: 'オブジェクトの翻訳の網羅と、訳が足りない項目をまとめたドキュメントを作る',
            argsSchema: {
                languages: z
                    .string()
                    .optional()
                    .describe('対象の言語 (ja, en_US などをカンマ区切り)。省略するとすべて'),
            },
        },
        async ({ languages }) => {
            const names = languages
                ?.split(',')
                .map((name) => name.trim())
                .filter(Boolean);
            return messageOf(
                '翻訳の状況をまとめたドキュメントを作ってください。',
                translationOverviewTemplate(names),
                [
                    '読み手は、翻訳を進める担当者。概要には、言語ごとの網羅と、網羅の低いオブジェクト、優先して訳すもの (画面に出る項目のラベル・選択リスト値) を書く。',
                    '翻訳元と同じ (sameAsSource) は、訳し忘れの候補として書く。対象がない (orphan) は、消し忘れた翻訳として書く。',
                    '古い翻訳 (outdated) は比べるときだけ分かる。前回からの変化を見るなら、文書に diff: true を足す。',
                ],
            );
        },
    );

    server.registerPrompt(
        'permission_overview',
        {
            title: '権限の一覧',
            description: '権限セット・プロファイルが与える権限をまとめたドキュメントを作る',
            argsSchema: {},
        },
        async () =>
            messageOf(
                '権限セット・プロファイルの権限をまとめたドキュメントを作ってください。',
                permissionOverviewTemplate(),
                [
                    '概要には、権限セット・プロファイルごとの役割 (誰に何を許すか) と、強い権限 (すべて変更・削除など) を持つものを書く。',
                    '項目の行列が大きすぎるときは、permission.fieldAccess の rows で主なオブジェクトの項目に絞る。',
                ],
            ),
    );

    server.registerPrompt(
        'release_review',
        {
            title: 'リリース前のレビュー',
            description:
                '前回保存した時点からの変更 (指摘・権限・公開の形・Flow・依存) をまとめたレビューのレポートを作る (差分。文書は diff: true)',
            argsSchema: {
                focus: z
                    .string()
                    .optional()
                    .describe('特に見てほしいこと (オブジェクト名・機能など)。省略可'),
            },
        },
        async ({ focus }) =>
            messageOf('リリース前のレビューのレポートを作ってください。', releaseReviewTemplate(), [
                ...(focus ? [`特に「${focus}」に関係する変更を詳しく見る。`] : []),
                '指摘 (metadata.findings) の added は新しく出た問題。重さ (severity) の高いものから要約に書く。',
                '公開メソッド・@api・Flow の入出力の removed / changed は、呼び出し元を壊しうる。get_dependents で使っている所を確かめて要約に書く。',
            ]),
    );

    server.registerPrompt(
        'impact_analysis',
        {
            title: '変更の影響の調査',
            description: '項目・クラスなどを変えたときに影響を受けるものを調べるレポートを作る',
            argsSchema: {
                target: z
                    .string()
                    .min(1)
                    .describe(
                        '調べる対象のノード (field:Invoice__c.Amount__c・apexClass:AccountService など)',
                    ),
            },
        },
        async ({ target }) =>
            messageOf(
                `「${target}」を変えたときの影響を調べるレポートを作ってください。`,
                impactAnalysisTemplate(target),
                [
                    'ノードの id が分からなければ list_units・get_dependents で探す (id は <種類>:<名前>)。',
                    '使っているものが多いときは、種類ごと (権限・画面・Apex・Flow) に分けて要約に書く。',
                ],
            ),
    );
};
