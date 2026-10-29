import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { makeModifiersJson } from '../../src/analyzer/types/apex/modifier';
import { makeConvertType } from '../../src/analyzer/types/apex/commons';
import { ModifierType } from '../../src/analyzer/types/apex/converter';

import { sourceInfo } from './helpers';

const modifier = async (value: string, offset: number) =>
    (
        await makeConvertType<ModifierType>({
            type: 'modifier',
            sourceInfo: sourceInfo(offset),
            value: value as ModifierType['value'],
        } as ModifierType)
    ).result;

describe('makeModifiersJson', () => {
    it('分類ごとにまとめ、各修飾子が自分の sourceKeys を持つ', async () => {
        const access = await modifier('PUBLIC', 0);
        const declaration = await modifier('STATIC', 1);

        const result = makeModifiersJson([access, declaration]);

        assert.deepEqual(result.access, [
            {
                kind: 'modifier',
                sourceKeys: { objectKey: access.objectKey, sourceKey: access.sourceKey },
                name: 'PUBLIC',
            },
        ]);
        assert.deepEqual(result.declaration?.map((m) => m.name), ['STATIC']);
    });

    it('どの分類にも当たらない修飾子を捨てずに other に入れる', async () => {
        const unknown = await modifier('UNKNOWN_MODIFIER', 0);
        const transient = await modifier('TRANSIENT', 1);

        const result = makeModifiersJson([unknown, transient]);

        assert.deepEqual(result.other?.map((m) => m.name), ['UNKNOWN_MODIFIER', 'TRANSIENT']);
    });

    it('エラーノードの修飾子は error に入る', async () => {
        const { result: error } = await makeConvertType({
            type: 'error',
            sourceInfo: sourceInfo(0),
            errorCode: 'EXCEPTION',
            contextType: 'modifier',
        } as never);

        const result = makeModifiersJson([error as never]);

        assert.equal(result.error?.length, 1);
        assert.equal(result.error?.[0]?.kind, 'error');
    });
});
