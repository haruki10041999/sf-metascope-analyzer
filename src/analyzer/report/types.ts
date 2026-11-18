import type { ApexUnitParseResult } from '../parser/Apex/unit';
import type { LwcBundleParseResult } from '../parser/Lwc/parser';
import type { CustomLabelsParseResult } from '../parser/Metadata/customLabels';
import type { FlowParseResult } from '../parser/Metadata/flow';
import type { FlexiPageParseResult, LayoutParseResult } from '../parser/Metadata/page';
import type { MetadataFileParseResult } from '../parser/Metadata/folder';
import type { ObjectTranslationParseResult } from '../parser/Metadata/objectTranslation';
import type { ObjectParseResult } from '../parser/Metadata/parser';
import type {
    MutingPermissionSetParseResult,
    PermissionSetGroupParseResult,
    PermissionSetParseResult,
    ProfileParseResult,
} from '../parser/Metadata/permission';
import type { ObjectAccess } from '../processor/Metadata/permissionAnalysis';
import type { MetadataContext } from '../processor/Metadata/references';
import type { ViewStatus } from '../processor/Metadata/view';
import type { Repository } from '../unit/repository';
import type { z } from 'zod';

import type * as schemas from './schemas';

// レポートの data provider の入力と出力の型。方針: docs/report-components-plan.md 3.2 章。
// 出力の型は schemas.ts の zod のスキーマから作る (z.infer。docs/implementation-roadmap.md 3 章)
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
    objectTranslations?: ObjectTranslationParseResult[];
    apex?: ApexUnitParseResult[];
    lwc?: LwcBundleParseResult[];
    /** 参照先の確かめに使う名前の一覧など。渡さなければ、渡した解析結果から作る */
    context?: MetadataContext;
};

/**
 * provider の入力。ある時点のリポジトリ (Repository)。before を渡すと、各行が status を持つ (差分のレポート)。
 * 種類ごとの provider は、Repository から作った MetadataSnapshot (SnapshotInput) を使う (report/snapshot.ts)
 */
export type ReportInput = { before?: Repository; after: Repository };

/** 種類ごとの provider の入力 (ReportInput の Repository を、種類ごとの解析結果にしたもの) */
export type SnapshotInput = { before?: MetadataSnapshot; after: MetadataSnapshot };

/** 行の共通部分 */
export type RowBase = Pick<
    z.infer<typeof schemas.ApexAccessRowSchema>,
    'status' | 'filePath' | 'sourceKeys'
>;

/** 値の変更 (行の中のプロパティ 1 つ) */
export type ValueChange = z.infer<typeof schemas.ValueChangeSchema>;

// 権限
export type PermissionHolderRef = z.infer<typeof schemas.PermissionHolderRefSchema>;
export type PermissionDiffRow = z.infer<typeof schemas.PermissionDiffRowSchema>;
export type AccessFlags = Omit<ObjectAccess, 'object'>;
/** Matrix の 1 セル */
export type MatrixCell<V> = RowBase & { before?: V; after?: V };
/** Matrix (行 × 列)。cells[行][列]。値のないセルは持たない (schemas.ts の matrixSchema と同じ形) */
export type Matrix<V> = {
    columns: PermissionHolderRef[];
    rows: string[];
    cells: Record<string, Record<string, MatrixCell<V>>>;
};
export type ApexAccessRow = z.infer<typeof schemas.ApexAccessRowSchema>;
export type EffectivePermissionRow = z.infer<typeof schemas.EffectivePermissionRowSchema>;

// Flow・自動化・コードの公開の形
export type FlowListRow = z.infer<typeof schemas.FlowListRowSchema>;
export type FlowDiagram = z.infer<typeof schemas.FlowDiagramSchema>;
export type FlowDiffRow = z.infer<typeof schemas.FlowDiffRowSchema>;
export type ApexInterfaceRow = z.infer<typeof schemas.ApexInterfaceRowSchema>;
export type LwcInterfaceRow = z.infer<typeof schemas.LwcInterfaceRowSchema>;
export type FlowInterfaceRow = z.infer<typeof schemas.FlowInterfaceRowSchema>;
export type FlowReferenceRow = z.infer<typeof schemas.FlowReferenceRowSchema>;
export type AutomationRow = z.infer<typeof schemas.AutomationRowSchema>;

// 画面
export type LayoutDetail = z.infer<typeof schemas.LayoutDetailSchema>;
export type FlexiPageDetail = z.infer<typeof schemas.FlexiPageDetailSchema>;
export type LwcPlacementRow = z.infer<typeof schemas.LwcPlacementRowSchema>;

// 横断
export type LabelUsageRow = z.infer<typeof schemas.LabelUsageRowSchema>;
export type ReferenceUsageRow = z.infer<typeof schemas.ReferenceUsageRowSchema>;
export type FindingRow = z.infer<typeof schemas.FindingRowSchema>;

// オブジェクト
export type ObjectListRow = z.infer<typeof schemas.ObjectListRowSchema>;
export type ObjectFieldRow = z.infer<typeof schemas.ObjectFieldRowSchema>;
export type ObjectPicklistRow = z.infer<typeof schemas.ObjectPicklistRowSchema>;
export type ObjectValidationRuleRow = z.infer<typeof schemas.ObjectValidationRuleRowSchema>;
export type ObjectRecordTypePicklistRow = z.infer<typeof schemas.ObjectRecordTypePicklistRowSchema>;
export type ObjectDiagram = z.infer<typeof schemas.ObjectDiagramSchema>;

// Apex
export type ApexOutlineRow = z.infer<typeof schemas.ApexOutlineRowSchema>;
export type ApexDataAccessRow = z.infer<typeof schemas.ApexDataAccessRowSchema>;

// LWC
export type LwcComponentRow = z.infer<typeof schemas.LwcComponentRowSchema>;
export type LwcDetailRow = z.infer<typeof schemas.LwcDetailRowSchema>;
export type LwcWireframe = z.infer<typeof schemas.LwcWireframeSchema>;
export type { WireframeNode } from './schemas';

// 翻訳
export type TranslationCoverageRow = z.infer<typeof schemas.TranslationCoverageRowSchema>;
export type TranslationItemRow = z.infer<typeof schemas.TranslationItemRowSchema>;

// すべての種類の土台
export type MetadataUnitRow = z.infer<typeof schemas.MetadataUnitRowSchema>;
export type MetadataTypeRow = z.infer<typeof schemas.MetadataTypeRowSchema>;
export type MetadataPropertyRow = z.infer<typeof schemas.MetadataPropertyRowSchema>;

// 宣言単位
export type ObjectMemberRow = z.infer<typeof schemas.ObjectMemberRowSchema>;
export type FlowElementRow = z.infer<typeof schemas.FlowElementRowSchema>;
export type LabelDefinitionRow = z.infer<typeof schemas.LabelDefinitionRowSchema>;

// 処理フロー
export type CodeFlowNode = z.infer<typeof schemas.CodeFlowNodeSchema>;
export type CodeFlowEdge = z.infer<typeof schemas.CodeFlowEdgeSchema>;
export type CodeFlow = z.infer<typeof schemas.CodeFlowSchema>;
export type CallSequenceMessage = z.infer<typeof schemas.CallSequenceMessageSchema>;
export type CallSequence = z.infer<typeof schemas.CallSequenceSchema>;
export type EventFlowNode = z.infer<typeof schemas.EventFlowNodeSchema>;
export type EventFlowEdge = z.infer<typeof schemas.EventFlowEdgeSchema>;
export type EventFlow = z.infer<typeof schemas.EventFlowSchema>;

// 機能のまとまり
export type FeatureScopeRow = z.infer<typeof schemas.FeatureScopeRowSchema>;

// 依存関係
export type DependencyNodeRow = z.infer<typeof schemas.DependencyNodeRowSchema>;
