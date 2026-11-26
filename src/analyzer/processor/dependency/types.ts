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
    /** <親のオブジェクト>.<子リレーションの名前> (Apex の SOQL のサブクエリ。子のオブジェクトはグラフで決める) */
    | 'childRelationship'
    /** <親のオブジェクト>.<子リレーションの名前>.<項目> (サブクエリの項目。子のオブジェクトの項目はグラフで決める) */
    | 'childRelationshipField'
    /**
     * <オブジェクト>.<関係>.<関係>...<項目> (SOQL の関係のパス Contact.Account.Owner.Name)。グラフが参照項目の定義と
     * 標準の関係をたどって、2 段目からの参照項目と最後の項目の参照にする (1 段目の参照項目は単位の参照で別に持つ)
     */
    | 'fieldPath'
    | 'customLabel'
    | 'customPermission'
    | 'staticResource'
    | 'messageChannel'
    | 'lwc'
    | 'aura'
    /** Visualforce のページ・コンポーネント */
    | 'apexPage'
    | 'apexComponent'
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

/**
 * 参照の解決の結果 (Apex・LWC・メタデータで共通の語。docs/plan.md 2.2)。
 * - resolved: 宣言に決まった (同じ単位の中・単位をまたぐ解決でほかの単位の中)
 * - standard: 標準の型・SObject・標準のメソッドに決まった (メソッドの単位では照合しない)
 * - byName: 名前だけ分かる (ほかの単位の型・オブジェクト・項目。グラフで定義と突き合わせる)
 * - candidates: 候補が複数あって決まらない (オーバーロード・インターフェースの実装クラスなど)
 * - missing: リポジトリにも標準にもない (グラフでリポジトリの定義と突き合わせて決める)
 * - unknown: 決められない (理由つき。依存関係には入れない)
 */
export type ReferenceResolution =
    | { status: 'resolved'; declarationId?: string }
    | { status: 'standard'; qualifiedName?: string }
    | { status: 'byName' }
    | { status: 'candidates'; declarationIds: string[] }
    | { status: 'missing' }
    | { status: 'unknown'; reason: string; detail?: string };

/**
 * 依存関係に入れる参照の確かさ (unknown は入れない。持たない参照は byName)。
 * missing (リポジトリにも標準にもない) はリポジトリの定義と突き合わせて決めるので、単位の参照 (UnitReference) は持たず、
 * グラフの辺 (DependencyEdge.resolution) だけが持つ
 */
export type ReferenceCertainty = 'resolved' | 'standard' | 'byName' | 'candidates' | 'missing';

/** 参照 1 つ */
export type UnitReference = {
    refType: DependencyTargetType;
    /** 参照先の名前 (object: Invoice__c / field: Invoice__c.Amount__c / apexMethod: AccountService.sync など) */
    target: string;
    kind: DependencyKind;
    /** どこで (要素名・構文の名前。soql.select / dml.insert / extends など) */
    via: string;
    from: ReferenceSite;
    /**
     * 確かさ。持たなければ byName (名前だけ。LWC・メタデータの参照は今はすべてこれ)。
     * candidates の参照はグラフの確定した辺にしない (DependencyGraph.candidateEdges)
     */
    resolution?: Exclude<ReferenceCertainty, 'byName' | 'missing'>;
};

/** 定義 1 つ (単位が定義しているもの) */
export type UnitDefinition = {
    defType: DependencyTargetType;
    /** 名前 (apexClass: AccountService / apexMethod: AccountService.sync / field: Invoice__c.Amount__c) */
    name: string;
    /** 定義している宣言 */
    sourceKeys?: ConvertKeys;
    /**
     * 定義の性質 (グラフのノードの DependencyNode.traits になる)。
     * Apex のメソッド: auraEnabled (@AuraEnabled)・cacheable (@AuraEnabled(cacheable=true))
     */
    traits?: string[];
};

/**
 * 子リレーション (参照項目の relationshipName)。SOQL のサブクエリ (SELECT ... FROM Contacts) の
 * 子のオブジェクトを、グラフで決めるのに使う
 */
export type ChildRelationship = {
    /** 親のオブジェクト (参照先。Account) */
    parent: string;
    /** SOQL で使う名前 (Contacts / Invoices__r) */
    name: string;
    /** 子のオブジェクト (参照項目を持つもの。Contact) */
    child: string;
    /** 参照項目 (Contact.AccountId) */
    field: string;
};

/**
 * 実行本体 1 つのメトリクス (保存の置き場の metric 表に書き、SQL で集計できるようにする。docs/plan.md 6.2)。
 * 数え方は Apex が semantic/metrics.ts、LWC が Lwc/metrics.ts (どちらも commons/metrics.ts の構文の数え方)
 */
export type UnitBodyMetrics = {
    /**
     * 本体の名前。Apex: <型>.<シグネチャ> (AccountService.sync(Id)。メソッド・コンストラクター以外は名前の並び)、
     * LWC: <ファイル>:<持ち主>.<メンバー> (accountList.js:AccountList.connectedCallback)
     */
    body: string;
    /** 本体の宣言の位置 */
    sourceKey?: string;
    /** メトリクスの名前 → 値 (cyclomatic・cognitive・statements・maxNesting・calls・soqlInLoop など) */
    values: Record<string, number>;
};

/** 単位 1 つの定義と参照 */
export type UnitDependencies = {
    definitions: UnitDefinition[];
    references: UnitReference[];
    /** 実行本体ごとのメトリクス (Apex・LWC だけ。単位をまたぐ解決をしない、保存する定義・参照のときだけ作る) */
    metrics?: UnitBodyMetrics[];
    /** 子リレーション (オブジェクトの単位だけ) */
    childRelationships?: ChildRelationship[];
    /**
     * 単位をまたげば解決できるかもしれない参照の数 (Apex だけ。ほかのクラスの型・親クラスのメンバー・メソッドの戻り値)。
     * 1 以上なら、グラフを作るときにリポジトリの宣言を渡して解析し直す (unit/dependencies.ts。docs/plan.md 10 章 P4)
     */
    pendingResolution?: number;
};
