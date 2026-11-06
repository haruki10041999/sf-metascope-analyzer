import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { convertExcludeError, makeConvertType } from '../../src/analyzer/types/apex/commons';

const sourceInfo = (offset: number) => ({
    context: 'nested.apex',
    start: { offset, line: 1, column: offset },
    end: { offset: offset + 1, line: 1, column: offset + 1 },
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object';

describe('converted error exclusion', () => {
    it('converts nested nodes and excludes nested errors', async () => {
        const converted = await makeConvertType({
            type: 'root',
            sourceInfo: sourceInfo(0),
            child: [
                { type: 'leaf', sourceInfo: sourceInfo(1), value: 'kept' },
                {
                    type: 'error',
                    sourceInfo: sourceInfo(2),
                    errorCode: 'EXCEPTION',
                    contextType: 'leaf',
                },
            ],
        });

        const assertNodeHasSource = (value: unknown) => {
            assert.ok(isRecord(value));
            assert.equal(typeof value.objectKey, 'string');
            assert.equal(typeof value.sourceKey, 'string');
            assert.ok(
                converted.sourceObjects.some(
                    (source) =>
                        source.objectKey === value.objectKey &&
                        source.source.some((item) => item.sourceKey === value.sourceKey),
                ),
            );
        };

        // makeConvertType は入力の形 (child) をそのまま写すので、child を持つ形として読む
        const result = converted.result as typeof converted.result & { child: unknown[] };
        assertNodeHasSource(result);
        assert.ok(Array.isArray(result.child));
        result.child.forEach(assertNodeHasSource);

        const excluded = convertExcludeError(result);
        assert.equal(excluded.errorInfos.length, 1);
        assert.equal(excluded.errorInfos[0], result.child[1]);
        const value = excluded.value as unknown;
        assert.ok(isRecord(value));
        assert.ok(Array.isArray(value.child));
        assert.equal(value.child.length, 1);
        assertNodeHasSource(value.child[0]);
    });
});
