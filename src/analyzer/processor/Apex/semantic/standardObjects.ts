export type ApexStandardObjectField = {
    readonly name: string;
    /** 資料に明記された導入 API バージョン。 */
    readonly introducedInApiVersion?: number;
};

export type ApexStandardObject = {
    readonly name: string;
    /** 資料で確認された項目名の例。 */
    readonly fieldExamples?: readonly ApexStandardObjectField[];
};

// 依存関係グラフの既存一覧と docs/reference/apex-standard-examples.md の項目例。
const STANDARD_OBJECTS: readonly ApexStandardObject[] = [
    {
        name: 'Account',
        fieldExamples: [
            { name: 'AccountNumber' },
            { name: 'AccountScore', introducedInApiVersion: 61 },
            { name: 'AccountSource', introducedInApiVersion: 24 },
            { name: 'AnnualRevenue' },
        ],
    },
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
