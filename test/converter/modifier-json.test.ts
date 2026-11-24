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
        // 分類のキー (access・lwcAnnotation など) は持たない。一覧はノード (apex 8)
        assert.deepEqual(Object.keys(modifier).sort(), [
            'annotation',
            'keyword',
            'kind',
            'sourceKeys',
        ]);
        assert.equal(modifier.kind, 'modifiers');
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

    it('修飾子がなければ keyword・annotation を持たない (一覧のノードだけ。apex 8)', async () => {
        const { modifier } = await memberModifier('void run() {}');
        assert.deepEqual(Object.keys(modifier).sort(), ['kind', 'sourceKeys']);
        assert.equal(modifier.kind, 'modifiers');
    });

    it('中身が同じ修飾子の一覧は、持ち主が違っても同じ objectKey になる (位置は持ち主ごと)', async () => {
        const { json } = await toJson(
            'public class A { public void a() { Integer x = 1; } public void b() { Integer y = 2; } }',
            unitRules.cls,
        );
        const [a, b] = find(json, (n) => n.kind === 'method').map((m) => m.modifier);
        assert.equal(a.sourceKeys.objectKey, b.sourceKeys.objectKey);
        assert.notEqual(a.sourceKeys.sourceKey, b.sourceKeys.sourceKey);
    });
});
