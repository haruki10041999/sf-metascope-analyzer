import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { ReportDocument } from '../report/document';
import {
    apexSpecificationTemplate,
    impactAnalysisTemplate,
    lwcOverviewTemplate,
    metadataInventoryTemplate,
    objectDefinitionTemplate,
    permissionOverviewTemplate,
    releaseReviewTemplate,
    systemOverviewTemplate,
    translationOverviewTemplate,
} from '../report/templates';
import {
    analyticsOverviewTemplate,
    automationOverviewTemplate,
    featureOverviewTemplate,
    integrationOverviewTemplate,
    securityOverviewTemplate,
    uiOverviewTemplate,
} from '../report/domainTemplates';

// 用途ごとのプロンプト (docs/implementation-roadmap.md 4.5)。
// 使うツールの流れ・書き方の指示・文書の雛形 (src/report/templates.ts) を組み立てて返す。skill と同じ内容をプロンプトでも出す。
// 雛形は出発点で、利用者の求めに合わせて自由に組み替えてよい (形は固定しない)

const STEPS = [
    '1. list_report_components で、書き方の決まりと部品・provider の一覧を読む。',
    '2. 雛形の data にある provider を get_report_data で呼び、内容を読む (レポートの材料。数値・一覧は文書に書き写さない)。既定は今の状態のすべて。差分を見る文書 (diff: true) なら get_report_data にも diff: true を、ブランチの変更を見るなら compare ({ "from": "main" } など) を付ける。',
    '3. 雛形の Narrative の markdown を、読んだ内容から書く。雛形は出発点なので、利用者の求めに合わせてカード・データ・部品を足したり消したりしてよい (list_report_providers・list_report_components で選ぶ)。行が 0 件のカードは消してよい。文書に個々のデータの名前 (クラス名・オブジェクト名など) を書かない (1 つずつ見せるときは for でデータの行を回し、件数が多ければ page で 1 件 1 ページに分ける)。雛形に for (行ごとの繰り返し) と { "$note": キー } があれば、文書の notes (キー → markdown) にキーごとの文章を書く (キーは for の行の値。get_report_data で行を読んで作る。書かなかったキーは「(未記入)」になり、validate_report_spec の warnings に出る)。',
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

/** 領域ごとの雛形 (引数なし。docs/todo.md 2.4) */
const DOMAIN_PROMPTS: {
    name: string;
    title: string;
    description: string;
    goal: string;
    document: () => ReportDocument;
    notes: string[];
}[] = [
    {
        name: 'automation_overview',
        title: '自動化',
        description:
            'オブジェクトごとの自動化と実行順・Flow・ワークフロー・承認・各種ルール・トリガーをまとめたドキュメントを作る',
        goal: '自動化のドキュメントを作ってください。',
        document: automationOverviewTemplate,
        notes: [
            '読み手は、レコードを保存したときに何が起きるかを知りたい開発者・管理者。概要には、オブジェクトごとの実行の順 (入力規則 → before トリガー → Flow → after トリガーなど) と、主な Flow の役割を書く。',
            '同じ項目を複数の自動化が更新している、Flow とトリガーが同じオブジェクトで両方動く、などは気をつけることとして書く。',
            'Flow が多いときは、flow.diagram・flow.elements の flows で主な Flow に絞る。',
        ],
    },
    {
        name: 'security_overview',
        title: 'セキュリティと共有',
        description:
            '権限 (権限セット・プロファイル・権限セットグループ)・共有設定・共有ルール・ロール・グループ・キュー・カスタム権限をまとめたドキュメントを作る',
        goal: 'セキュリティと共有のドキュメントを作ってください。',
        document: securityOverviewTemplate,
        notes: [
            '読み手は、誰が何を見て・変えられるかを確かめたい管理者・監査の担当者。概要には、権限の与え方の方針と、強い権限 (すべて変更・削除) や広い共有を持つものを書く。',
            '項目の権限の行列が大きいときは、permission.fieldAccess の rows で主なオブジェクトの項目に絞る。',
        ],
    },
    {
        name: 'ui_overview',
        title: '画面',
        description:
            'アプリ・タブ・Lightning ページ・ページレイアウト・LWC の置き場所・クイックアクション・パスをまとめたドキュメントを作る',
        goal: '画面のドキュメントを作ってください。',
        document: uiOverviewTemplate,
        notes: [
            '読み手は、利用者の画面の作りを知りたい開発者・管理者。概要には、アプリとタブの構成、主な画面 (Lightning ページ・ページレイアウト) で何を表示・入力するかを書く。',
            'LWC の中身は lwc_overview (ワイヤーフレームを含む) で詳しく書ける。',
        ],
    },
    {
        name: 'integration_overview',
        title: '連携',
        description:
            '外部への接続 (指定ログイン情報・外部ログイン情報・リモートサイトなど)・プラットフォームイベント・メッセージチャネルをまとめたドキュメントを作る',
        goal: '連携のドキュメントを作ってください。',
        document: integrationOverviewTemplate,
        notes: [
            '読み手は、外部システムとのつながりを把握したい開発者・運用の担当者。概要には、接続先ごとの役割と、使っているコード・Flow を書く。',
            'URL・パラメーターなどの機密になりうる値は伏せてある (***)。値を推測して書かない。',
            '接続を使っている Apex は get_dependents (namedCredential:<名前> など) で調べられる。',
        ],
    },
    {
        name: 'analytics_overview',
        title: '分析',
        description: 'レポート・レポートタイプ・ダッシュボードをまとめたドキュメントを作る',
        goal: '分析 (レポート・ダッシュボード) のドキュメントを作ってください。',
        document: analyticsOverviewTemplate,
        notes: [
            '読み手は、どんなレポート・ダッシュボードがあるかを知りたい利用者・管理者。概要には、主なダッシュボードと、使っているレポートタイプ (オブジェクト) を書く。',
        ],
    },
];

export const registerReportPrompts = (server: McpServer): void => {
    for (const prompt of DOMAIN_PROMPTS) {
        server.registerPrompt(
            prompt.name,
            { title: prompt.title, description: prompt.description, argsSchema: {} },
            async () => messageOf(prompt.goal, prompt.document(), prompt.notes),
        );
    }

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
                    .describe(
                        '特に説明してほしい観点 (データの流れ・画面・権限・連携など)。省略可',
                    ),
            },
        },
        async ({ focus }) =>
            messageOf(
                'このシステムの構成を説明するドキュメントを作ってください。',
                systemOverviewTemplate(),
                [
                    ...(focus ? [`特に「${focus}」の観点で詳しく説明する。`] : []),
                    '読み手はこのシステムを初めて見る開発者。概要には、主なオブジェクト・画面・処理の流れと、それらのつながりを書く。',
                ],
            ),
    );

    server.registerPrompt(
        'object_definition',
        {
            title: 'オブジェクト定義書',
            description:
                'オブジェクトの一覧・ER 図と、すべてのオブジェクトの項目・選択リスト値・入力規則・レコードタイプ (1 件 1 ページ) をまとめたドキュメントを作る',
            argsSchema: {},
        },
        async () =>
            messageOf('オブジェクト定義書を作ってください。', objectDefinitionTemplate(), [
                '読み手は、このシステムのデータの持ち方を知りたい開発者・管理者。概要には、各オブジェクトが何を表すかと、主なつながり (参照・主従) を書く。',
                'オブジェクトごとに 1 ページになる。notes のキーはオブジェクトの API 名 (object.list の行の object) で、そのオブジェクトが何を表し、どう使われるかを書く。',
                '項目の数式・入力規則の条件は、読んだ内容を要約して文章に書いてよい (表の値は書き写さない)。',
            ]),
    );

    server.registerPrompt(
        'apex_specification',
        {
            title: 'Apex の仕様書',
            description:
                'すべての Apex のクラス・トリガー (1 件 1 ページ) の、メンバー・メソッドごとの処理フローと説明・データアクセス・呼び出しをまとめたドキュメントを作る',
            argsSchema: {},
        },
        async () =>
            messageOf('Apex の仕様書を作ってください。', apexSpecificationTemplate(), [
                '読み手は、このコードを読んで直す開発者。概要には、クラスどうしの関係と主な処理の流れを書く。',
                'クラス・トリガーごとに 1 ページ、その中にメソッドごとのカード (左に処理フロー・右に説明、下にデータアクセスと呼び出し) になる。notes のキーは、クラス・トリガーは名前 (metadata.units の行の name)、メソッドは <owner>.<name>(<引数の型>) (apex.outline の行の owner・name と、params を , でつないだもの)。',
                'メソッドの説明には、何をするか・前提・結果・気をつけること (ループの中の SOQL / DML など) を書く。処理の順は図にあるので書き写さない。',
                '呼び出し元を知りたいときは get_dependents (apexClass:<名前> や apexMethod:<クラス>.<メソッド>) で調べる。',
            ]),
    );

    server.registerPrompt(
        'lwc_overview',
        {
            title: 'LWC のコンポーネント',
            description:
                'LWC の置かれている場所と、すべてのコンポーネント (1 件 1 ページ) の画面の骨組み・イベントの流れ・関数ごとの処理フローをまとめたドキュメントを作る',
            argsSchema: {},
        },
        async () =>
            messageOf(
                'LWC のコンポーネントのドキュメントを作ってください。',
                lwcOverviewTemplate(),
                [
                    '読み手は、画面の作りを知りたい開発者。概要には、コンポーネントの親子関係と、利用者の操作からデータまでの流れを書く。',
                    'コンポーネントごとに 1 ページになる。notes のキーは、コンポーネントは lwc.components の行の component (c/<名前>)、関数は lwc.methodFlow の行の member (<Owner>.<name>)。',
                    'Apex の中身は apex_specification で書ける。',
                ],
            ),
    );

    server.registerPrompt(
        'translation_overview',
        {
            title: '翻訳の状況',
            description:
                'すべての言語の、オブジェクトの翻訳の網羅と、訳が足りない項目をまとめたドキュメントを作る',
            argsSchema: {},
        },
        async () =>
            messageOf(
                '翻訳の状況をまとめたドキュメントを作ってください。',
                translationOverviewTemplate(),
                [
                    '読み手は、翻訳を進める担当者。概要には、言語ごとの網羅と、網羅の低いオブジェクト、優先して訳すもの (画面に出る項目のラベル・選択リスト値) を書く。',
                    '翻訳元と同じ (sameAsSource) は、訳し忘れの候補として書く。対象がない (orphan) は、消し忘れた翻訳として書く。',
                    '古い翻訳 (outdated) は比べるときだけ分かる。前回からの変化を見るなら、文書に diff: true を足す。',
                ],
            ),
    );

    server.registerPrompt(
        'metadata_inventory',
        {
            title: 'メタデータの棚卸し',
            description:
                'リポジトリのメタデータの種類ごとの数・単位の一覧・設定値をまとめたドキュメントを作る (専用の雛形がない種類も含む)',
            argsSchema: {
                types: z
                    .string()
                    .optional()
                    .describe(
                        '対象の単位の種類 (customTab, role などをカンマ区切り)。省略するとすべて',
                    ),
            },
        },
        async ({ types }) => {
            const names = types
                ?.split(',')
                .map((name) => name.trim())
                .filter(Boolean);
            return messageOf(
                'メタデータの棚卸しのドキュメントを作ってください。',
                metadataInventoryTemplate(names),
                [
                    '読み手は、このリポジトリに何があるかを把握したい開発者・管理者。概要には、主な種類とその数、読めなかったもの・エラーのあるもの、気になる設定 (共有・権限・連携など) を書く。',
                    '設定値 (metadata.properties) は行が多い。大きいリポジトリでは、種類ごとに 1 ページに分ける (metadata.types を for で回し、page を付ける)。',
                    '専用の雛形がある種類 (object・apexClass・lwc・翻訳・権限) は、object_definition・apex_specification などで詳しく書ける。',
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
                    .describe('特に見てほしい観点 (権限・公開の形・自動化など)。省略可'),
            },
        },
        async ({ focus }) =>
            messageOf('リリース前のレビューのレポートを作ってください。', releaseReviewTemplate(), [
                ...(focus ? [`特に「${focus}」の観点で変更を詳しく見る。`] : []),
                '指摘 (metadata.findings) の added は新しく出た問題。重さ (severity) の高いものから要約に書く。',
                '公開メソッド・@api・Flow の入出力の removed / changed は、呼び出し元を壊しうる。get_dependents で使っている所を確かめて要約に書く。',
            ]),
    );

    server.registerPrompt(
        'impact_analysis',
        {
            title: '変更の影響の調査',
            description:
                '前回保存した時点から変わった単位と、それを使っているため影響を受けるものを調べるレポートを作る (差分。文書は diff: true。起点は変わった単位から自動で決まる)',
            argsSchema: {},
        },
        async () =>
            messageOf('変更の影響を調べるレポートを作ってください。', impactAnalysisTemplate(), [
                '変わった単位 (changed) ごとに、影響を受けるもの (impacted) を種類ごと (権限・画面・Apex・Flow) に分けて要約に書く。',
                'git の範囲で比べるときは、文書の diff の代わりに compare ({ "from": "main" } など) を書く。',
            ]),
    );

    server.registerPrompt(
        'feature_overview',
        {
            title: '機能のまとまり',
            description:
                'カスタムオブジェクトごとに、依存関係をたどって関わるオブジェクト・コード・画面・自動化をまとめたドキュメントを作る (1 件 1 ページ。起点は自動で決まる)',
            argsSchema: {},
        },
        async () =>
            messageOf('機能のまとまりのドキュメントを作ってください。', featureOverviewTemplate(), [
                '読み手は、業務の機能を初めて触る開発者・管理者。カスタムオブジェクトごとに 1 ページで、そのオブジェクトが表す機能が何をするかと、利用者の操作から画面・コード・自動化・データまでの流れを書く。',
                'notes のキーは起点のオブジェクトの API 名 (object.list の行の object)。',
                '範囲が広すぎる・狭すぎるときは、feature.scope の depth・direction・excludeTypes を雛形の引数で変える。',
            ]),
    );
};
