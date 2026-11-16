import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    getValueKey,
    pairAsSequence,
    pairAsSet,
    pairByKey,
} from '../../src/analyzer/processor/commons/diff/commons';
import { makeIdUnitDiffs } from '../../src/analyzer/processor/commons/diff/unit';

describe('diff pairing', () => {
    it('uses structural keys without depending on object property order', () => {
        assert.equal(
            getValueKey({ left: 1, right: [true, 'x'] }),
            getValueKey({ right: [true, 'x'], left: 1 }),
        );
        assert.notEqual(getValueKey(['left', 'right']), getValueKey(['right', 'left']));
    });

    it('pairs a set by objectKey only', () => {
        assert.deepEqual(pairAsSet(['a', 'b', 'c'], ['c', 'x', 'a']), [
            { status: 'unchanged', match: 'identical', before: 0, after: 2 },
            { status: 'removed', before: 1 },
            { status: 'unchanged', match: 'identical', before: 2, after: 0 },
            { status: 'added', after: 1 },
        ]);
    });

    it('detects moved elements in a sequence', () => {
        assert.deepEqual(pairAsSequence(['a', 'b'], ['b', 'a']), [
            { status: 'moved', match: 'identical', before: 0, after: 1 },
            { status: 'unchanged', match: 'identical', before: 1, after: 0 },
        ]);
    });

    it('pairs changed elements inside the same gap only', () => {
        // a | b → x | c → y : b-x と c-y は同じ gap なので changed、z は追加
        assert.deepEqual(pairAsSequence(['a', 'b', 'c'], ['a', 'x', 'c', 'z']), [
            { status: 'unchanged', match: 'identical', before: 0, after: 0 },
            { status: 'changed', match: 'slot', before: 1, after: 1 },
            { status: 'unchanged', match: 'identical', before: 2, after: 2 },
            { status: 'added', after: 3 },
        ]);
    });

    it('does not pair across anchors', () => {
        // b は a より前、x は a より後ろなので組にしない
        assert.deepEqual(pairAsSequence(['b', 'a'], ['a', 'x']), [
            { status: 'removed', before: 0 },
            { status: 'unchanged', match: 'identical', before: 1, after: 0 },
            { status: 'added', after: 1 },
        ]);
    });

    it('respects canPair', () => {
        assert.deepEqual(pairAsSequence(['b'], ['x'], { canPair: () => false }), [
            { status: 'removed', before: 0 },
            { status: 'added', after: 0 },
        ]);
    });

    it('pairs by identity and falls back to a set for unkeyed elements', () => {
        assert.deepEqual(
            pairByKey(
                ['foo', 'bar', undefined],
                [undefined, 'bar', 'foo'],
                ['k1', 'k2', 'e1'],
                ['e1', 'k2x', 'k1'],
            ),
            [
                { status: 'unchanged', match: 'identical', before: 0, after: 2 },
                { status: 'changed', match: 'key', before: 1, after: 1 },
                { status: 'unchanged', match: 'identical', before: 2, after: 0 },
            ],
        );
    });
});

describe('makeIdUnitDiffs (docs/save-format-plan.md の S3)', () => {
    const result = (id: string, base: unknown) => ({
        filePath: `units/${id}`,
        resolvedError: [],
        dataType: 'sample',
        result: { id, base, sourceObject: [] },
    });

    it('同じ解析結果 (key が同じで使い回したもの) は中身の差分を作らずに unchanged にする', () => {
        const shared = result('a', { value: 1 });
        let made = 0;
        const content = {
            dataType: 'sample' as const,
            make: () => {
                made++;
                return { status: 'changed' as const };
            },
        };
        const [same] = makeIdUnitDiffs([shared], [shared], content);
        assert.equal(same!.status, 'unchanged');
        assert.equal(same!.content, undefined);
        assert.equal(made, 0);
        // 別のオブジェクトなら今までどおり中身を比べる
        const [other] = makeIdUnitDiffs([shared], [result('a', { value: 2 })], content);
        assert.equal(made, 1);
        assert.equal(other!.status, 'changed');
    });
});
