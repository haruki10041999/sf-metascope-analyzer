import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    extractSourceInfo,
    isCommonTypeExtractSourceInfoType,
} from '../../src/analyzer/types/apex/commons';
import { isSoqlIdType } from '../../src/analyzer/types/apex/converter';

describe('CommonTypeExtractSourceInfo type guard', () => {
    it('validates nested extracted CommonTypes using the original validator', () => {
        const sourceInfo = {
            context: 'Account',
            start: { offset: 0, line: 1, column: 0 },
            end: { offset: 7, line: 1, column: 7 },
        };
        const extracted = extractSourceInfo({
            type: 'soqlId',
            sourceInfo,
            value: { type: 'id', sourceInfo, value: 'Account' },
        });

        assert.deepEqual(extracted, {
            type: 'soqlId',
            value: { type: 'id', value: 'Account' },
        });
        assert.equal(isCommonTypeExtractSourceInfoType(extracted, isSoqlIdType), true);
        assert.equal(
            isCommonTypeExtractSourceInfoType(
                { ...extracted, value: { type: 'id', value: 1 } },
                isSoqlIdType,
            ),
            false,
        );
        assert.equal(
            isCommonTypeExtractSourceInfoType(
                {
                    ...extracted,
                    value: { type: 'id', sourceInfo, value: 'Account' },
                },
                isSoqlIdType,
            ),
            false,
        );
    });
});
