import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    makeTypeContentDiff,
    makeTypeDiff,
    makeTypeWithVoidDiff,
    makeTypesDiff,
} from '../../src/analyzer/processor/Apex/diff/type';
import type { ErrorJson, TypeJson } from '../../src/analyzer/types';

const beforeKeys = { objectKey: 'before', sourceKey: 'before-source' };
const afterKeys = { objectKey: 'after', sourceKey: 'after-source' };
const before: TypeJson = {
    kind: 'type',
    sourceKeys: beforeKeys,
    type: 'primitive',
    primitiveType: 'Integer',
};
const after: TypeJson = {
    kind: 'type',
    sourceKeys: afterKeys,
    type: 'primitive',
    primitiveType: 'String',
};
const beforeError: ErrorJson = {
    kind: 'error',
    sourceKeys: beforeKeys,
    kindType: 'type',
};
const afterError: ErrorJson = {
    kind: 'error',
    sourceKeys: afterKeys,
    kindType: 'type',
};
// objectKey / sourceKey ごとに、同じなら単体、違えば { before, after }
const sourceKeys = {
    objectKey: { before: 'before', after: 'after' },
    sourceKey: { before: 'before-source', after: 'after-source' },
};

describe('type diff', () => {
    it('compares valid type contents', () => {
        assert.deepEqual(makeTypeDiff(before, after), {
            kind: 'type',
            sourceKeys,
            status: 'changed',
            match: 'slot',
            fields: {
                type: 'primitive',
                primitiveType: { status: 'changed', before: 'Integer', after: 'String' },
            },
        });
    });

    it('treats the same objectKey as unchanged even if the position differs', () => {
        const moved = { ...before, sourceKeys: { objectKey: 'before', sourceKey: 'moved' } };
        assert.deepEqual(makeTypeDiff(before, moved), {
            kind: 'type',
            sourceKeys: {
                objectKey: 'before',
                sourceKey: { before: 'before-source', after: 'moved' },
            },
            status: 'unchanged',
            value: { type: 'primitive', primitiveType: 'Integer' },
        });
    });

    it('compares two errors by objectKey', () => {
        assert.deepEqual(makeTypeDiff(beforeError, afterError), {
            kind: 'type',
            sourceKeys,
            status: 'changed',
            match: 'slot',
            before: { kindType: 'type' },
            after: { kindType: 'type' },
        });
    });

    it('preserves contents when a type becomes an error or recovers', () => {
        assert.deepEqual(makeTypeDiff(before, afterError), {
            kind: 'type',
            sourceKeys,
            status: 'changed',
            match: 'slot',
            before: { type: 'primitive', primitiveType: 'Integer' },
            after: { kindType: 'type' },
        });
    });

    it('aligns qualified names from the end and diffs generics as a sequence', () => {
        assert.deepEqual(
            makeTypeContentDiff(
                {
                    type: 'custom',
                    customType: ['Outer', 'Inner'],
                    generic: [
                        { type: 'primitive', primitiveType: 'Id' },
                        { type: 'primitive', primitiveType: 'String' },
                    ],
                },
                {
                    type: 'custom',
                    customType: ['ns', 'Outer', 'Inner'],
                    generic: [{ type: 'primitive', primitiveType: 'String' }],
                },
            ),
            {
                status: 'changed',
                fields: {
                    type: 'custom',
                    customType: {
                        status: 'changed',
                        parts: [
                            { status: 'added', value: 'ns' },
                            { status: 'unchanged', value: 'Outer' },
                            { status: 'unchanged', value: 'Inner' },
                        ],
                    },
                    generic: [
                        {
                            status: 'removed',
                            index: 0,
                            value: { type: 'primitive', primitiveType: 'Id' },
                        },
                        {
                            status: 'unchanged',
                            value: { type: 'primitive', primitiveType: 'String' },
                            index: { before: 1, after: 0 },
                        },
                    ],
                },
            },
        );
    });

    it('handles void return types', () => {
        assert.deepEqual(makeTypeWithVoidDiff('void', 'void'), {
            kind: 'type',
            status: 'unchanged',
            value: 'void',
        });
        assert.deepEqual(makeTypeWithVoidDiff('void', after), {
            kind: 'type',
            sourceKeys: { after: afterKeys },
            status: 'changed',
            match: 'slot',
            before: 'void',
            after: { type: 'primitive', primitiveType: 'String' },
        });
    });

    it('compares implements as a set (no changed pairs)', () => {
        const diffs = makeTypesDiff([before], [after]);
        assert.deepEqual(
            diffs.map((d) => d.status),
            ['removed', 'added'],
        );
    });
});
