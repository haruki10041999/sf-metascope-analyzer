import type { ReportProviderName, ReportProviderSource } from '../analyzer/report/registry';

import { featureOverviewDetail } from './detailTemplates';
import type { ReportDocument } from './document';

// 領域ごとのドキュメントの雛形 (docs/todo.md 2.4・3.1): 自動化・セキュリティと共有・画面・連携・分析。
// 専用の provider がない種類は、すべての種類の土台の provider (metadata.units・metadata.properties) で見せる。
// 雛形は出発点で、形は固定しない (利用者が自分で書く・AI に組ませる・雛形を直す、のどれでもよい)

type Element = ReportDocument['spec']['elements'][string];
/** データの宣言 (provider ごとに引数の名前と型を確かめる) */
type DataSource = ReportProviderSource;
type Column = [key: string, label: string];

const el = (type: string, props: Record<string, unknown>, children: string[] = []): Element => ({
    type,
    props,
    children,
});

const bound = (data: string) => ({ $state: `/data/${data}` });

const UNIT_COLUMNS: Column[] = [
    ['unitType', '種類'],
    ['name', '名前'],
    ['label', 'ラベル'],
    ['description', '説明'],
    ['filePath', 'ファイル'],
];

const PROPERTY_COLUMNS: Column[] = [
    ['unitType', '種類'],
    ['name', '名前'],
    ['path', '場所'],
    ['value', '値'],
];

/** 雛形の部品を組み立てる (カードの順に並べる) */
class Builder {
    readonly data: Record<string, DataSource> = {};
    readonly elements: Record<string, Element> = {};
    private readonly cards: string[] = [];

    constructor(summary: string) {
        this.elements.summary = el('Narrative', { title: '概要', markdown: summary });
    }

    private card(key: string, title: string, description: string | null, children: string[]) {
        this.elements[`${key}Card`] = el(
            'Card',
            { title, description, maxWidth: 'full', centered: null, className: null },
            children,
        );
        this.cards.push(`${key}Card`);
    }

    table(
        key: string,
        title: string,
        description: string | null,
        source: DataSource,
        columns: Column[] | null,
    ): this {
        this.data[key] = source;
        this.elements[`${key}Table`] = el('DataTable', {
            rows: bound(key),
            columns: columns ? columns.map(([k, label]) => ({ key: k, label })) : null,
            caption: null,
            onlyChanged: false,
        });
        this.card(key, title, description, [`${key}Table`]);
        return this;
    }

    view(
        key: string,
        title: string,
        description: string | null,
        source: DataSource,
        type: string,
        props: Record<string, unknown> = {},
    ): this {
        this.data[key] = source;
        this.elements[`${key}View`] = el(type, { data: bound(key), ...props });
        this.card(key, title, description, [`${key}View`]);
        return this;
    }

    /** 単位の一覧と設定値 (汎用の provider)。types の種類だけ */
    units(key: string, title: string, description: string | null, types: string[]): this {
        this.table(
            `${key}Units`,
            title,
            description,
            { provider: 'metadata.units', args: { types } },
            UNIT_COLUMNS,
        );
        return this.table(
            `${key}Properties`,
            `${title}の設定`,
            '場所 → 値 (機密になりうる値は伏せた)',
            { provider: 'metadata.properties', args: { types } },
            PROPERTY_COLUMNS,
        );
    }

    build(title: string): ReportDocument {
        this.elements.page = el(
            'Stack',
            { direction: 'vertical', gap: 'lg', align: null, justify: null, className: null },
            ['summary', ...this.cards],
        );
        return { title, data: this.data, spec: { root: 'page', elements: this.elements } };
    }
}

/** 自動化の種類 (Flow・Apex 以外) */
export const AUTOMATION_TYPES = [
    'workflow',
    'approvalProcess',
    'assignmentRules',
    'autoResponseRules',
    'escalationRules',
    'duplicateRule',
    'matchingRules',
];

/** 自動化 (ドキュメント): オブジェクトごとの自動化と順序・Flow・ワークフローと各種ルール・トリガー */
export const automationOverviewTemplate = (): ReportDocument =>
    new Builder(
        '(ここに概要を書く: オブジェクトごとに、レコードの保存で何がどの順に動くか (入力規則・Flow・トリガー・ワークフロー)、主な Flow の役割、気をつけること (同じ項目を複数の自動化が更新しているなど))',
    )
        .view(
            'automation',
            'オブジェクトごとの自動化',
            'レコードトリガーフロー (順序)・Apex トリガー・入力規則',
            { provider: 'automation.byObject' },
            'AutomationView',
        )
        .table('flows', 'Flow の一覧', null, { provider: 'flow.list' }, [
            ['name', 'Flow'],
            ['label', 'ラベル'],
            ['processType', '種類'],
            ['triggerType', '起動'],
            ['object', 'オブジェクト'],
            ['flowStatus', '状態'],
            ['elementCount', '要素'],
        ])
        .view('diagrams', 'Flow の図', '要素と接続', { provider: 'flow.diagram' }, 'FlowDiagram', {
            flow: null,
        })
        .table(
            'elements',
            'Flow の要素',
            '条件・割り当て・レコードの操作・画面の項目・アクションの引数',
            { provider: 'flow.elements' },
            [
                ['flow', 'Flow'],
                ['element', '要素'],
                ['kind', '種類'],
                ['label', 'ラベル'],
                ['object', 'オブジェクト'],
                ['details', '中身'],
            ],
        )
        .table('interfaces', 'Flow の入出力の変数', null, { provider: 'flow.interface' }, [
            ['flow', 'Flow'],
            ['variable', '変数'],
            ['direction', '向き'],
            ['dataType', '型'],
        ])
        .table(
            'triggers',
            'Apex トリガー',
            '対象のオブジェクトとイベント',
            { provider: 'metadata.units', args: { types: ['apexTrigger'] } },
            UNIT_COLUMNS,
        )
        .units(
            'rules',
            'ワークフロー・承認・各種ルール',
            'ワークフロー・承認プロセス・割り当て / 自動応答 / エスカレーション / 重複 / 一致ルール',
            AUTOMATION_TYPES,
        )
        .build('自動化');

/** セキュリティと共有 (ドキュメント): 権限・共有設定・共有ルール・ロール・グループ・キュー・カスタム権限 */
export const securityOverviewTemplate = (): ReportDocument =>
    new Builder(
        '(ここに概要を書く: 誰が何を見て・変えられるか (権限セット・プロファイル・権限セットグループ)、オブジェクトの共有設定と共有ルール、ロールの階層、強い権限・広い共有など気をつけること)',
    )
        .view(
            'objectAccess',
            'オブジェクトの権限',
            '権限セット・プロファイル × オブジェクトの CRUD',
            { provider: 'permission.objectAccess' },
            'Matrix',
            { onlyChanged: null },
        )
        .view(
            'fieldAccess',
            '項目の権限',
            '参照・編集',
            { provider: 'permission.fieldAccess' },
            'Matrix',
            { onlyChanged: null },
        )
        .table(
            'effective',
            '権限セットグループが与える権限',
            'ミュートを除いた実際の権限',
            { provider: 'permission.effective' },
            null,
        )
        .table(
            'apexAccess',
            'Apex クラス・Visualforce ページの実行権限',
            null,
            { provider: 'permission.apexAccess' },
            null,
        )
        .table('sharingModels', 'オブジェクトの共有設定', null, { provider: 'object.list' }, [
            ['object', 'オブジェクト'],
            ['label', 'ラベル'],
            ['sharingModel', '組織の共有設定'],
        ])
        .units('sharing', '共有ルール・ロール・グループ・キュー', null, [
            'sharingRules',
            'role',
            'group',
            'queue',
        ])
        .units('permissions', 'カスタム権限', null, ['customPermission'])
        .build('セキュリティと共有');

/** 画面 (ドキュメント): アプリ・タブ・Lightning ページ・ページレイアウト・LWC の置き場所・クイックアクション・パス */
export const uiOverviewTemplate = (): ReportDocument =>
    new Builder(
        '(ここに概要を書く: どのアプリにどのタブがあり、どの画面 (Lightning ページ・ページレイアウト) で何を表示・入力するか、画面に置いた LWC・クイックアクション・パス)',
    )
        .units('apps', 'アプリとタブ', null, ['customApplication', 'customTab'])
        .view(
            'pages',
            'Lightning ページ',
            'リージョンと部品',
            { provider: 'flexiPage.detail' },
            'FlexiPageView',
        )
        .view(
            'layouts',
            'ページレイアウト',
            'セクションと項目・関連リスト・アクション',
            { provider: 'layout.detail' },
            'LayoutView',
        )
        .table('placements', 'LWC の置き場所', null, { provider: 'lwc.placements' }, [
            ['lwc', 'コンポーネント'],
            ['flexiPage', 'Lightning ページ'],
            ['pageType', 'ページの種類'],
            ['sobjectType', 'オブジェクト'],
            ['region', 'リージョン'],
        ])
        .units('actions', 'クイックアクションとパス', null, ['quickAction', 'pathAssistant'])
        .build('画面');

/** 連携の種類 */
export const INTEGRATION_TYPES = [
    'namedCredential',
    'externalCredential',
    'remoteSiteSetting',
    'cspTrustedSite',
    'externalDataSource',
    'platformEventChannel',
    'platformEventChannelMember',
    'platformEventSubscriberConfig',
    'messageChannel',
];

/** 連携 (ドキュメント): 外部への接続 (指定ログイン情報など)・プラットフォームイベント・メッセージチャネル */
export const integrationOverviewTemplate = (): ReportDocument =>
    new Builder(
        '(ここに概要を書く: どの外部システムとどう接続するか (指定ログイン情報・外部ログイン情報・リモートサイト)、プラットフォームイベントとメッセージチャネルの発行・購読、使っている Apex・Flow。URL などの機密の値は伏せてある)',
    )
        .units(
            'integrations',
            '連携の設定',
            '指定ログイン情報・外部ログイン情報・リモートサイト・CSP・外部データソース・イベント・メッセージチャネル',
            INTEGRATION_TYPES,
        )
        .table(
            'users',
            '連携を使っているもの',
            '指定ログイン情報・メッセージチャネルなどを参照しているコード・メタデータ',
            { provider: 'crossRef.references', args: { refTypes: INTEGRATION_TYPES } },
            null,
        )
        .build('連携');

/** 分析 (ドキュメント): レポート・レポートタイプ・ダッシュボード */
export const analyticsOverviewTemplate = (): ReportDocument =>
    new Builder(
        '(ここに概要を書く: どんなレポート・ダッシュボードがあり、どのレポートタイプ (オブジェクトと項目) を使っているか)',
    )
        .units('analytics', 'レポート・レポートタイプ・ダッシュボード', null, [
            'report',
            'reportType',
            'dashboard',
        ])
        .build('分析');

/**
 * 機能のまとまり (ドキュメント。docs/todo.md 2.5): カスタムオブジェクトごと (起点) に 1 ページ。
 * 起点は利用者が指定せず、カスタムオブジェクトから自動で決める (detailTemplates.ts)
 */
export const featureOverviewTemplate = (): ReportDocument => featureOverviewDetail();
