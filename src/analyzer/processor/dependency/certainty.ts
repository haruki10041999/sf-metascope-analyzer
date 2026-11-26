import { findStandardObject } from '../commons/standardObjects';
import type { UnitDependencies, UnitReference } from './types';

// 参照の確かさ (resolution) の、言語によらない決め方 (docs/plan.md 2.2)。
// Apex は型の解決 (processor/Apex/semantic) で決める。LWC・メタデータは名前だけで取り出すので、ここで
// 公式の一覧に載っている名前だけを standard にする (載っていない名前は byName のまま。名前だけで標準と断定しない)。
// 項目は標準の項目の一覧を持たないので、byName のまま

/** 名前だけの参照に、公式の一覧で分かる確かさを付ける (すでに確かさのある参照は変えない) */
export const withCertainty = (reference: UnitReference): UnitReference => {
    if (reference.resolution) return reference;
    if (reference.refType === 'object' && findStandardObject(reference.target)) {
        return { ...reference, resolution: 'standard' };
    }
    return reference;
};

/** 単位の参照すべてに、確かさを付ける */
export const withCertainties = (dependencies: UnitDependencies): UnitDependencies => ({
    ...dependencies,
    references: dependencies.references.map(withCertainty),
});
