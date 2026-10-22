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

        assertNodeHasSource(converted.result);
        assert.ok(Array.isArray(converted.result.child));
        converted.result.child.forEach(assertNodeHasSource);

        const excluded = convertExcludeError(converted.result);
        assert.equal(excluded.errorInfos.length, 1);
        assert.equal(excluded.errorInfos[0], converted.result.child[1]);
        assert.ok(isRecord(excluded.value));
        assert.ok(Array.isArray(excluded.value.child));
        assert.equal(excluded.value.child.length, 1);
        assertNodeHasSource(excluded.value.child[0]);
    });
});
