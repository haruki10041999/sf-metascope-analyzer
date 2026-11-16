import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { apexModifierCategoryOf } from '../../src/analyzer/processor/Apex/modifiers';

import { find, toJson, unitRules } from './helpers';

// 修飾子の JSON (makeModifiersJson)。IR v2 の木から作る (docs/ir-integration.md)

/** クラスの最初のメンバーの修飾子の JSON */
const memberModifier = async (member: string) => {
    const { json } = await toJson(`public class A {\n    ${member}\n}`, unitRules.cls);
    const [declaration] = find(json, (n) => n.kind === 'field' || n.kind === 'method');
    assert.ok(declaration, member);
    return { json, modifier: declaration.modifier };
};

describe('makeModifiersJson', () => {
    it('修飾子とアノテーションを書いた順に持ち、各修飾子が自分の sourceKeys を持つ (分類は持たない。段階 A5)', async () => {
        const { modifier } = await memberModifier(
            '@AuraEnabled(cacheable=true) @TestVisible public static void run() {}',
        );

        assert.deepEqual(
            modifier.keyword.map((m: { kind: string; name: string }) => [m.kind, m.name]),
            [
                ['modifier', 'PUBLIC'],
                ['modifier', 'STATIC'],
            ],
        );
        assert.deepEqual(
            modifier.annotation.map((a: { name: string }) => a.name),
            ['AuraEnabled', 'TestVisible'],
        );
        const [access, declaration] = modifier.keyword;
        assert.ok(access.sourceKeys.objectKey.startsWith('modifier_'));
        assert.notEqual(access.sourceKeys.sourceKey, declaration.sourceKeys.sourceKey);
        // 分類のキー (access・lwcAnnotation など) は持たない
        assert.deepEqual(Object.keys(modifier).sort(), ['annotation', 'keyword']);
    });

    it('アノテーションの引数はリテラルの式の配列 (引用符を持たない)', async () => {
        const { modifier } = await memberModifier(
            "@InvocableMethod(label='Run it' callout=true) public static void run() {}",
        );
        const [annotation] = modifier.annotation;
        assert.deepEqual(
            annotation.arg.map((a: { key: string; value: { kind: string; value: unknown } }) => [
                a.key,
                a.value.kind,
                a.value.value,
            ]),
            [
                ['label', 'string', 'Run it'],
                ['callout', 'boolean', true],
            ],
        );
    });

    it('分類は解析で出す (どれにも当たらない修飾子は other)', async () => {
        const { modifier } = await memberModifier('@Future transient Integer x;');
        assert.deepEqual(
            [...modifier.keyword, ...modifier.annotation].map(
                (item: Parameters<typeof apexModifierCategoryOf>[0]) =>
                    apexModifierCategoryOf(item),
            ),
            ['other', 'asyncAnnotation'],
        );
    });

    it('修飾子がなければ持たない', async () => {
        const { modifier } = await memberModifier('void run() {}');
        assert.deepEqual(modifier, {});
    });
});
