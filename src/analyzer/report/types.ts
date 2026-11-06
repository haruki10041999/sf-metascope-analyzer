import type { ApexUnitParseResult } from '../parser/Apex/unit';
import type { LwcBundleParseResult } from '../parser/Lwc/parser';
import type { CustomLabelsParseResult } from '../parser/Metadata/customLabels';
import type { FlowParseResult } from '../parser/Metadata/flow';
import type { FlexiPageParseResult, LayoutParseResult } from '../parser/Metadata/page';
import type { MetadataFileParseResult } from '../parser/Metadata/folder';
import type { ObjectParseResult } from '../parser/Metadata/parser';
import type {
    MutingPermissionSetParseResult,
    PermissionSetGroupParseResult,
    PermissionSetParseResult,
    ProfileParseResult,
} from '../parser/Metadata/permission';
import type { ObjectAccess } from '../processor/Metadata/permissionAnalysis';
import type { MetadataContext, MetadataFindingSeverity } from '../processor/Metadata/references';
import type { ViewStatus } from '../processor/Metadata/view';
import type { ConvertKeys } from '../types';

// レポートの data provider の入力と出力の型。方針: docs/report-components-plan.md 3.2 章
// - 入力は解析結果 (before / after) だけ。ファイルは読まない
// - 出力の各行は、元のノードの sourceKeys とファイルのパスを持つ (SourceSnippet と AI の注記の対象に使う)
// - status は差分を表示するとき (before を渡したとき) だけ持つ (Diff と同じ語彙)

export type { ViewStatus };

/** ある時点のリポジトリの解析結果。渡したものだけを使う */
export type MetadataSnapshot = {
    permissionSets?: PermissionSetParseResult[];
    mutingPermissionSets?: MutingPermissionSetParseResult[];
    profiles?: ProfileParseResult[];
    permissionSetGroups?: PermissionSetGroupParseResult[];
    customLabels?: CustomLabelsParseResult[];
    flows?: FlowParseResult[];
    layouts?: LayoutParseResult[];
    flexiPages?: FlexiPageParseResult[];
    /** 優先度 B・C のメタデータ (種類をまとめて。docs/metadata-implementation.md) 10 章 */
    others?: MetadataFileParseResult[];
    objects?: ObjectParseResult[];
    apex?: ApexUnitParseResult[];
    lwc?: LwcBundleParseResult[];
    /** 参照先の確かめに使う名前の一覧など。渡さなければ、渡した解析結果から作る */
    context?: MetadataContext;
};

/** provider の入力。before を渡すと、各行が status を持つ (差分のレポート) */
export type ReportInput = { before?: MetadataSnapshot; after: MetadataSnapshot };

/** 行の共通部分 */
export type RowBase = {
    status?: ViewStatus;
    filePath?: string;
    sourceKeys?: ConvertKeys;
};

/** 値の変更 (行の中のプロパティ 1 つ) */
export type ValueChange = { name: string; before?: unknown; after?: unknown };

// ---------------------------------------------------------------------------
// 権限 (2.5 章)
// ---------------------------------------------------------------------------

export type PermissionHolderRef = {
    type: 'permissionSet' | 'mutingPermissionSet' | 'profile' | 'permissionSetGroup';
    name: string;
};

/** permission.diffs: 権限セット・Profile の変更 (1 行 = 権限の 1 行、または設定値) */
export type PermissionDiffRow = RowBase & {
    holder: PermissionHolderRef;
    /** XML の要素名 (objectPermissions など)。ルートの設定値は settings、単位ごとの追加・削除は unit */
    category: string;
    /** 対象 (Invoice__c / Invoice__c.Amount__c など)。settings・unit は空 */
    target: string;
    changes: ValueChange[];
};

export type AccessFlags = Omit<ObjectAccess, 'object'>;

/** Matrix の 1 セル */
export type MatrixCell<V> = RowBase & { before?: V; after?: V };

/** Matrix (行 × 列)。cells[行][列]。値のないセルは持たない */
export type Matrix<V> = {
    columns: PermissionHolderRef[];
    rows: string[];
    cells: Record<string, Record<string, MatrixCell<V>>>;
};

/** permission.apexAccess の 1 行 */
export type ApexAccessRow = RowBase & {
    holder: PermissionHolderRef;
    /** apexClass / apexPage */
    accessType: 'apexClass' | 'apexPage';
    name: string;
    enabled: boolean;
};

/** permission.effective: 権限セットグループの実際の権限 */
export type EffectivePermissionRow = RowBase & {
    group: string;
    category:
        | 'object'
        | 'field'
        | 'apexClass'
        | 'apexPage'
        | 'flow'
        | 'customPermission'
        | 'userPermission';
    target: string;
    /** オブジェクトは CRED など、項目は R / E、そのほかは有効なら true */
    before?: string | boolean;
    after?: string | boolean;
};

// ---------------------------------------------------------------------------
// Flow・自動化 (2.6 章)
// ---------------------------------------------------------------------------

export type FlowListRow = RowBase & {
    name: string;
    label?: string;
    processType?: string;
    triggerType?: string;
    recordTriggerType?: string;
    object?: string;
    /** Flow の状態 (Active / Draft など) */
    flowStatus?: string;
    elementCount: number;
};

export type FlowDiagram = {
    flow: string;
    nodes: (RowBase & { id: string; kind: string; label?: string })[];
    edges: (RowBase & { from: string; to: string; edgeType: string })[];
};

/** flow.diffs: 要素・資源・起動の変更 */
export type FlowDiffRow = RowBase & {
    flow: string;
    /** 要素・資源の名前 (起動は $start、Flow の設定値は空) */
    element: string;
    kind: string;
    /** 変わったプロパティの名前 (changed のとき) */
    changedProperties: string[];
};

export type FlowReferenceRow = RowBase & {
    flow: string;
    element: string;
    refType: string;
    value: string;
    /** 参照先がないなどの指摘 (code) */
    problem?: string;
};

export type AutomationRow = {
    object: string;
    flows: (RowBase & {
        name: string;
        triggerType?: string;
        recordTriggerType?: string;
        triggerOrder?: number;
    })[];
    triggers: (RowBase & { name: string; events: string[]; triggerStatus?: string })[];
    validationRules: (RowBase & { name: string; active: boolean; errorMessage?: string })[];
};

// ---------------------------------------------------------------------------
// 画面 (2.7 章)
// ---------------------------------------------------------------------------

export type LayoutDetail = RowBase & {
    name: string;
    objectApiName: string;
    sections: (RowBase & {
        label: string;
        columns: number;
        items: (RowBase & {
            field?: string;
            /** 項目以外 (customLink・page・空白など) の表示名 */
            other?: string;
            behavior?: string;
            column: number;
            row: number;
            /** 位置が変わったとき、変更前の位置 */
            movedFrom?: { section: string; column: number; row: number };
        })[];
    })[];
    relatedLists: (RowBase & { relatedList: string; fields: string[] })[];
    actions: (RowBase & { actionName: string; actionType?: string; sortOrder?: number })[];
};

export type FlexiPageDetail = RowBase & {
    name: string;
    label?: string;
    pageType?: string;
    sobjectType?: string;
    template?: string;
    regions: (RowBase & {
        name: string;
        items: (RowBase & {
            identifier: string;
            itemType: 'component' | 'field';
            /** componentName または fieldItem */
            name: string;
            properties: Record<string, string>;
            hasVisibilityRule: boolean;
            /** リージョンをまたいで動いたとき、変更前のリージョン */
            movedFrom?: string;
        })[];
    })[];
};

export type LwcPlacementRow = RowBase & {
    lwc: string;
    flexiPage: string;
    pageType?: string;
    sobjectType?: string;
    region: string;
    properties: string[];
};

// ---------------------------------------------------------------------------
// 横断 (2.8 章)
// ---------------------------------------------------------------------------

export type LabelUsageRow = RowBase & {
    name: string;
    value?: string;
    usages: { origin: string; unit: string }[];
};

/** crossRef.references: 参照先 (種類・名前) と、参照している単位 (before を渡すと、参照の増減が status に出る) */
export type ReferenceUsageRow = {
    status?: ViewStatus;
    refType: string;
    target: string;
    /** 参照している単位の id と、どこで参照しているか */
    usedBy: { from: string; via: string; filePath: string; sourceKeys?: ConvertKeys }[];
    /** 参照先がリポジトリにないときの指摘の code */
    problem?: string;
};

/** metadata.findings: 解析の指摘。before を渡すと、新しく出た指摘は added、なくなった指摘は removed */
export type FindingRow = RowBase & {
    source: 'permission' | 'label' | 'flow' | 'layout' | 'flexiPage' | 'reference';
    code: string;
    severity: MetadataFindingSeverity;
    /** 指摘を出した単位 (権限セット・Flow・レイアウトなどの名前) */
    unit: string;
    target: string;
    message: string;
};
