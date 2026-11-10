import type { ConvertKeys } from '../../types';

// 依存関係の「定義」と「参照」(単位ごと)。グラフ (graph.ts) はこれを集めて作る。方針: docs/analysis-plan.md 3 章
//
// ノードの細かさは文・式の単位まで: 参照はどの単位の、どのメンバー (メソッドなど) の、どの文・式から使っているかを
// 持つ (UnitReference.from)。グラフでは文・式もノードにでき、単位 → メンバー → 文・式 とまとめて見られる。

/** 参照・定義の対象の種類 */
export type DependencyTargetType =
    | 'object'
    | 'field'
    | 'recordType'
    | 'apexClass'
    | 'apexTrigger'
    | 'apexMethod'
    | 'apexProperty'
    /** Apex の型の名前 (クラスかオブジェクトかは、グラフで定義と突き合わせて決める) */
    | 'apexType'
    /** <型>.<メンバー> (型が変数の型のときなど。クラスのメンバーか項目かは、グラフで決める) */
    | 'apexTypeMember'
    | 'customLabel'
    | 'customPermission'
    | 'staticResource'
    | 'messageChannel'
    | 'lwc'
    | 'auraComponent'
    | 'flow'
    | 'globalVariable'
    | (string & {});

/** 参照の意味 */
export type DependencyKind =
    | 'uses'
    | 'reads'
    | 'writes'
    | 'queries'
    | 'inserts'
    | 'updates'
    | 'upserts'
    | 'deletes'
    | 'undeletes'
    | 'merges'
    /** プラットフォームイベントの発行 (Apex の EventBus.publish) */
    | 'publishes'
    | 'calls'
    | 'creates'
    | 'extends'
    | 'implements'
    | 'triggers'
    | 'imports'
    | 'places'
    | 'grants'
    | (string & {});

/** どこから参照しているか (文・式の単位) */
export type ReferenceSite = {
    /** 単位の中のメンバー (AccountService.sync / AccountService.Wrapper など)。単位の直下なら持たない */
    member?: string;
    /** 文 (メソッドの中の 1 文。宣言の直下ならその宣言) */
    statement?: ConvertKeys;
    /** 式 (参照そのもの。SOQL・メンバーの参照・型など) */
    expression?: ConvertKeys;
};

/** 参照 1 つ */
export type UnitReference = {
    refType: DependencyTargetType;
    /** 参照先の名前 (object: Invoice__c / field: Invoice__c.Amount__c / apexMethod: AccountService.sync など) */
    target: string;
    kind: DependencyKind;
    /** どこで (要素名・構文の名前。soql.select / dml.insert / extends など) */
    via: string;
    from: ReferenceSite;
};

/** 定義 1 つ (単位が定義しているもの) */
export type UnitDefinition = {
    defType: DependencyTargetType;
    /** 名前 (apexClass: AccountService / apexMethod: AccountService.sync / field: Invoice__c.Amount__c) */
    name: string;
    /** 定義している宣言 */
    sourceKeys?: ConvertKeys;
};

/** 単位 1 つの定義と参照 */
export type UnitDependencies = {
    definitions: UnitDefinition[];
    references: UnitReference[];
};
