// 系統ごとのノードの共用体 (types/*/node.ts) の kind が string に広がっていないことを、型の上で確かめる。
// npm run typecheck で確かめる (実行はしない)
import type {
    ApexNodeKind,
    ApexNodeOf,
    LwcNodeKind,
    LwcNodeOf,
    MetadataNodeKind,
    MetadataNodeOf,
} from '../../src/analyzer/types';

type NotString<K> = string extends K ? never : true;

export type ApexKindIsLiteral = NotString<ApexNodeKind>;
export type LwcKindIsLiteral = NotString<LwcNodeKind>;
export type MetadataKindIsLiteral = NotString<MetadataNodeKind>;

// kind から型を引ける
export type ApexIfIsFound = ApexNodeOf<'ifBranch'>['kind'] extends 'ifBranch' ? true : never;
export type LwcModuleIsFound = LwcNodeOf<'lwcModule'>['kind'] extends 'lwcModule' ? true : never;
export type MetadataFlowEdgeIsFound = MetadataNodeOf<'flowEdge'>['kind'] extends 'flowEdge'
    ? true
    : never;

const checks: [
    ApexKindIsLiteral,
    LwcKindIsLiteral,
    MetadataKindIsLiteral,
    ApexIfIsFound,
    LwcModuleIsFound,
    MetadataFlowEdgeIsFound,
] = [true, true, true, true, true, true];
void checks;
