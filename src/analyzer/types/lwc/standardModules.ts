import type { LwcImportCategory } from './import';

// LWC が import する標準のモジュール (lwc・lightning/*・@salesforce/*) の一覧 (Salesforce の公式情報。リリースのたびに
// .claude/skills/salesforce-release-update で見直す)。パーサー (import の分類) と解析 (呼び出しの種類) で共通に使う。
// lightning/* は、Salesforce が公開している LWC の言語サーバー (@salesforce/lwc-language-server) の
// transformed-lwc-standard.json (モジュールを lightning-ui-record-api のように持つ) で照合した (2026-11-26、4.12.13)。
// @salesforce/* は自動で取れる公式資料がないので未照合。解析で名前を見るものだけを持つ (全件ではない)

/** lightning/* のモジュールを照合した言語サーバーの版 (@salesforce/* は未照合) */
export const LIGHTNING_MODULES_REFERENCE_SOURCE = '@salesforce/lwc-language-server 4.12.13';

/** LWC の基本のモジュール */
export const LWC_MODULE = 'lwc';

/** @salesforce のスコープ付きモジュールの接頭辞 → import の分類 */
export const SALESFORCE_SCOPED_MODULES: readonly (readonly [string, LwcImportCategory])[] = [
    ['@salesforce/apex/', 'apex'],
    ['@salesforce/apexContinuation/', 'apex'],
    ['@salesforce/schema/', 'schema'],
    ['@salesforce/label/', 'label'],
    ['@salesforce/customPermission/', 'customPermission'],
    ['@salesforce/resourceUrl/', 'resourceUrl'],
    ['@salesforce/contentAssetUrl/', 'contentAssetUrl'],
    ['@salesforce/messageChannel/', 'messageChannel'],
    ['@salesforce/user/', 'user'],
];

/** refreshApex を export するモジュール */
export const SALESFORCE_APEX_MODULE = '@salesforce/apex';

/** 解析で名前を見る lightning/* のモジュール */
export const LIGHTNING_MODULES = {
    /** レコードの作成・更新・削除 (createRecord など) と @wire のアダプター */
    uiRecordApi: 'lightning/uiRecordApi',
    /** メッセージチャネル (publish・subscribe など) */
    messageService: 'lightning/messageService',
    /** 静的リソースの読み込み (loadScript・loadStyle) */
    platformResourceLoader: 'lightning/platformResourceLoader',
    /** トースト (ShowToastEvent) */
    platformShowToastEvent: 'lightning/platformShowToastEvent',
} as const;

/** @wire のアダプターのうち、項目を受け取るもの (lightning/ui*Api) の接頭辞 */
export const LIGHTNING_UI_API_PREFIX = 'lightning/ui';
