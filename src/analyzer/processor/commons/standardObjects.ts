export type StandardObject = {
    readonly name: string;
};

/** 照合した Object Reference の API バージョン (docs/reference/apex-standard-reference.md の「照合の記録」) */
export const STANDARD_OBJECTS_REFERENCE_API_VERSION = 68;

// よく使う標準オブジェクトと、カスタムのオブジェクトの名前の判定。Apex・LWC・メタデータの解析と依存関係のグラフで共通に使う
// (docs/plan.md 10 章 P2)。
// 2026-11-25 に Object Reference for the Salesforce Platform (Version 68.0, Winter '27) の PDF で、
// すべてが標準オブジェクトとして載っていることを確かめた。全件の一覧ではない (載っていない名前を「標準でない」としない)。
// オブジェクトの名前だけを持つ (項目・導入版は持たない。項目はスキーマを引く参照の解決で扱う)
const STANDARD_OBJECTS: readonly StandardObject[] = [
    { name: 'Account' },
    { name: 'Contact' },
    { name: 'Lead' },
    { name: 'Opportunity' },
    { name: 'OpportunityLineItem' },
    { name: 'Case' },
    { name: 'User' },
    { name: 'Task' },
    { name: 'Event' },
    { name: 'Campaign' },
    { name: 'CampaignMember' },
    { name: 'Contract' },
    { name: 'Order' },
    { name: 'OrderItem' },
    { name: 'Product2' },
    { name: 'Pricebook2' },
    { name: 'PricebookEntry' },
    { name: 'Asset' },
    { name: 'Quote' },
    { name: 'QuoteLineItem' },
    { name: 'Group' },
    { name: 'GroupMember' },
    { name: 'Profile' },
    { name: 'PermissionSet' },
    { name: 'PermissionSetAssignment' },
    { name: 'UserRole' },
    { name: 'RecordType' },
    { name: 'Attachment' },
    { name: 'Note' },
    { name: 'ContentDocument' },
    { name: 'ContentVersion' },
    { name: 'ContentDocumentLink' },
    { name: 'FeedItem' },
    { name: 'EmailMessage' },
    { name: 'Organization' },
    { name: 'BusinessHours' },
    { name: 'Holiday' },
    { name: 'Folder' },
    { name: 'Document' },
    { name: 'Solution' },
    { name: 'Idea' },
    { name: 'Entitlement' },
    { name: 'ServiceContract' },
    { name: 'WorkOrder' },
    { name: 'Individual' },
    { name: 'AsyncApexJob' },
    { name: 'CronTrigger' },
    { name: 'ApexClass' },
    { name: 'ApexTrigger' },
    { name: 'StaticResource' },
];

/** 小文字化した API 名から、既知の標準オブジェクトを参照する。 */
export const STANDARD_OBJECT_MAP: ReadonlyMap<string, StandardObject> = new Map(
    STANDARD_OBJECTS.map((object) => [object.name.toLowerCase(), object]),
);

/** オブジェクトの API 名を照合する。未収録のオブジェクトは undefined を返す。 */
export const findStandardObject = (name: string): StandardObject | undefined =>
    STANDARD_OBJECT_MAP.get(name.toLowerCase());

/**
 * カスタムの (利用者が作る・利用者の定義から作られる) オブジェクトの API 名の接尾辞 (__ のあと)。
 * 2026-11-26 に Object Reference (Version 68.0, Winter '27) の「Salesforce Object Types」の表の Suffix と照合した
 * (表のうちオブジェクトのもの。項目の接尾辞 __latitude__s・__longitude__s・__pc・__pr・__r と、
 * 標準オブジェクトに付く ChangeEvent・Feed (__ なし) は入れない)。
 * 版は STANDARD_OBJECTS_REFERENCE_API_VERSION と同じ資料
 */
export const CUSTOM_OBJECT_SUFFIXES: readonly string[] = [
    'b', // ビッグオブジェクト
    'c', // カスタムオブジェクト (カスタム項目も同じ)
    'ChangeEvent', // カスタムオブジェクトの変更イベント
    'chn', // プラットフォームイベントのチャネル (PlatformEventChannel)
    'cio', // Data Cloud の計算済みインサイト
    'dg', // Data Cloud のデータグラフ
    'DataCategorySelection', // ナレッジのデータカテゴリの選択
    'dlm', // Data Cloud のデータモデルオブジェクト (クエリ用)
    'dlo', // Data Cloud のデータレイクオブジェクト
    'dmo', // Data Cloud のデータモデルオブジェクト
    'dso', // Data Cloud のデータソースオブジェクト
    'e', // プラットフォームイベント
    'Feed', // カスタムオブジェクト・ナレッジ記事のフィード
    'hd', // 履歴のデータ (Historical data)
    'History', // カスタムオブジェクトの項目履歴
    'ka', // ナレッジ記事
    'kav', // ナレッジ記事のバージョン
    'mdt', // カスタムメタデータ型
    'Share', // カスタムオブジェクトの共有
    'Tag', // カスタムオブジェクトのタグ
    'ViewStat', // ナレッジ記事の閲覧の統計
    'VoteStat', // ナレッジ記事の評価の統計
    'x', // 外部オブジェクト
    'xo', // Salesforce to Salesforce (S2S) の spoke / proxy オブジェクト
];

const CUSTOM_OBJECT_SUFFIX = new RegExp(`__(${CUSTOM_OBJECT_SUFFIXES.join('|')})$`, 'i');

/**
 * カスタムのオブジェクトの API 名か (接尾辞で判断する。名前空間の接頭辞 ns__ があってもよい)。
 * カスタム項目 (__c) も同じ接尾辞なので、項目の名前の判定にも使える
 */
export const isCustomObjectName = (name: string): boolean => CUSTOM_OBJECT_SUFFIX.test(name);
