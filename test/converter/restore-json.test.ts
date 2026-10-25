import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    makeJsonType,
    makeStructureJsonType,
    restoreJson,
} from '../../src/analyzer/types/apex/commons';

describe('restoreJson', () => {
    it('restores JSON values, nested structures, and arrays', () => {
        const leaf = makeJsonType('leaf', { file: ['leaf-source'] }, { value: 'leaf-value' });
        const nestedLeaf = makeJsonType('nested-leaf', { file: ['nested-source'] });
        const nested = makeStructureJsonType('nested', { child: nestedLeaf });
        const root = makeStructureJsonType('root', {
            leaf,
            leaves: [leaf, makeJsonType('another-leaf', { file: ['another-source'] })],
            nested,
            nestedList: [nested],
        });

        assert.deepEqual(restoreJson(root, 'leaf'), leaf);
        assert.deepEqual(restoreJson(root, 'leaves'), [
            leaf,
            makeJsonType('another-leaf', { file: ['another-source'] }),
        ]);
        assert.deepEqual(restoreJson(root, 'nested'), { ...nested, child: nestedLeaf });
        assert.deepEqual(restoreJson(root, 'nestedList'), [{ ...nested, child: nestedLeaf }]);
    });
});
