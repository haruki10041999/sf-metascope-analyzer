export type ApexStandardObject = {
    readonly name: string;
};

/** 照合した Object Reference の API バージョン (docs/reference/apex-standard-reference.md の「照合の記録」) */
export const APEX_STANDARD_OBJECTS_REFERENCE_API_VERSION = 68;

// よく使う標準オブジェクト (依存関係のグラフもこの一覧を使う。docs/plan.md 10 章 P2)。
// 2026-11-25 に Object Reference for the Salesforce Platform (Version 68.0, Winter '27) の PDF で、
// すべてが標準オブジェクトとして載っていることを確かめた。全件の一覧ではない (載っていない名前を「標準でない」としない)。
// オブジェクトの名前だけを持つ (項目・導入版は持たない。項目はスキーマを引く参照の解決で扱う)
const STANDARD_OBJECTS: readonly ApexStandardObject[] = [
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
export const APEX_STANDARD_OBJECTS: ReadonlyMap<string, ApexStandardObject> = new Map(
    STANDARD_OBJECTS.map((object) => [object.name.toLowerCase(), object]),
);

/** オブジェクトの API 名を照合する。未収録のオブジェクトは undefined を返す。 */
export const findApexStandardObject = (name: string): ApexStandardObject | undefined =>
    APEX_STANDARD_OBJECTS.get(name.toLowerCase());

/**
 * カスタムのオブジェクト・メタデータ型などの API 名の接尾辞
 * (__c: カスタムオブジェクト、__mdt: カスタムメタデータ型、__e: プラットフォームイベント、__x: 外部オブジェクト、
 * __b: ビッグオブジェクト、__kav: ナレッジ記事のバージョン、__dlm: Data Cloud のデータモデル、
 * __share・__history・__feed・__changeevent: カスタムオブジェクトに付く標準の付属オブジェクト)
 */
const CUSTOM_OBJECT_SUFFIX = /__(c|mdt|e|x|b|kav|dlm|share|history|feed|changeevent)$/i;

/** カスタムのオブジェクトの API 名か (接尾辞で判断する。名前空間の接頭辞 ns__ があってもよい) */
export const isApexCustomObjectName = (name: string): boolean => CUSTOM_OBJECT_SUFFIX.test(name);
