import assert from 'node:assert/strict';

// 差分を読むテストの補助 (docs/plan.md 10 章 P2「テストの手書きの JSON・Diff を公開している型に合わせる」)

/** changed の差分の fields (公開している差分の型のまま取り出す。changed でなければ失敗にする) */
export const changedFieldsOf = <D>(
    diff: D | undefined,
): Extract<D, { fields: unknown }>['fields'] => {
    assert.ok(
        typeof diff === 'object' && diff !== null && 'fields' in diff,
        'changed の差分 (fields を持つ) ではない',
    );
    return (diff as Extract<D, { fields: unknown }>).fields;
};
