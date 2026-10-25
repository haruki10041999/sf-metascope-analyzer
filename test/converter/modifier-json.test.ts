import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { makeAllModifierJson } from '../../src/analyzer/types/apex/modifier';
import { makeConvertType } from '../../src/analyzer/types/apex/commons';
import { ModifierType } from '../../src/analyzer/types/apex/converter';

describe('makeAllModifierJson', () => {
    it('groups modifiers and keeps each source key with its modifier', async () => {
        const sourceInfo = (offset: number) => ({
            context: 'modifier.apex',
            start: { offset, line: 1, column: offset },
            end: { offset: offset + 1, line: 1, column: offset + 1 },
        });
        const access = await makeConvertType<ModifierType>({
            type: 'modifier',
            sourceInfo: sourceInfo(0),
            value: 'PUBLIC',
        });
        const declaration = await makeConvertType<ModifierType>({
            type: 'modifier',
            sourceInfo: sourceInfo(1),
            value: 'STATIC',
        });

        const result = makeAllModifierJson([access.result, declaration.result]);

        assert.deepEqual(result.access, [{ kind: 'modifier', type: 'modifier', name: 'PUBLIC' }]);
        assert.deepEqual(result.declaration, [
            { kind: 'modifier', type: 'modifier', name: 'STATIC' },
        ]);
        assert.deepEqual(result.sourceKeys.access, [
            { [access.result.objectKey]: [access.result.sourceKey] },
        ]);
        assert.deepEqual(result.sourceKeys.declaration, [
            { [declaration.result.objectKey]: [declaration.result.sourceKey] },
        ]);
    });
});
