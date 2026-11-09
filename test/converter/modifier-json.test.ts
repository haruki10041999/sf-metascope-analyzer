import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { find, toJson, unitRules } from './helpers';

// 修飾子の JSON (makeModifiersJson)。IR v2 の木から作る (docs/ir-v2-integration.md)

/** クラスの最初のメンバーの修飾子の JSON */
const memberModifier = async (member: string) => {
    const { json } = await toJson(`public class A {\n    ${member}\n}`, unitRules.cls);
    const [declaration] = find(json, (n) => n.kind === 'field' || n.kind === 'method');
    assert.ok(declaration, member);
    return { json, modifier: declaration.modifier };
};

describe('makeModifiersJson', () => {
    it('分類ごとにまとめ、各修飾子が自分の sourceKeys を持つ', async () => {
        const { modifier } = await memberModifier('public static void run() {}');

        assert.deepEqual(
            modifier.access.map((m: { kind: string; name: string }) => [m.kind, m.name]),
            [['modifier', 'PUBLIC']],
        );
        assert.deepEqual(
            modifier.declaration.map((m: { name: string }) => m.name),
            ['STATIC'],
        );
        const [access] = modifier.access;
        const [declaration] = modifier.declaration;
        assert.ok(access.sourceKeys.objectKey.startsWith('modifier_'));
        assert.notEqual(access.sourceKeys.sourceKey, declaration.sourceKeys.sourceKey);
    });

    it('アクセス・宣言のどちらでもない修飾子を other に入れる', async () => {
        const { modifier } = await memberModifier('transient Integer x;');

        assert.deepEqual(
            modifier.other.map((m: { name: string }) => m.name),
            ['TRANSIENT'],
        );
    });

    it('IR v2 の木から作るので、error の分類は出ない', async () => {
        const { modifier } = await memberModifier('public static void run() {}');

        assert.equal(Object.hasOwn(modifier, 'error'), false);
    });
});
