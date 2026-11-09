import { readFile } from 'node:fs/promises';
import { apexSampleOf } from '../../docs/examples/paths';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import type { ApexParser, ApexParserRuleContext } from '@apexdevtools/apex-parser';

import { dumpIr, find, toJson, unitRules } from './helpers';

const examples: [string, (p: ApexParser) => ApexParserRuleContext][] = [
    ['ParserTest.cls', unitRules.cls],
    ['ParserTrigger.trigger', unitRules.trigger],
    ['parser.apex', unitRules.anonymous],
];

const load = (file: string) => readFile(apexSampleOf('after', file), 'utf8');

const convert = async (index: number) => {
    const [file, rule] = examples[index]!;
    return toJson(await load(file), rule);
};

// IR のうち、ソース由来でない (IR が付けた) 値を持つキー (type・判別の kind・値の種類)
const META_KEYS = new Set(['type', 'kind', 'valueType']);

// SOSL の FIND のトークン ([FIND '...' / [FIND {...}) は、JSON では検索語だけになる
const searchTermOf = (value: string): string =>
    value
        .match(/^\[\s*FIND\s*(?:'((?:\\.|[^\\'])*)'|\{((?:\\.|[^\\}])*)\})\s*$/i)
        ?.slice(1)
        .find((v) => v !== undefined) ?? value;

const countValues = (target: unknown, skip: Set<string>, out = new Map<string, number>()) => {
    if (Array.isArray(target)) {
        target.forEach((item) => countValues(item, skip, out));
    } else if (target !== null && typeof target === 'object') {
        for (const [key, value] of Object.entries(target)) {
            if (skip.has(key)) continue;
            if (typeof value === 'string' || typeof value === 'number') {
                const text = searchTermOf(String(value));
                out.set(text, (out.get(text) ?? 0) + 1);
            } else {
                countValues(value, skip, out);
            }
        }
    } else if (typeof target === 'string') {
        out.set(target, (out.get(target) ?? 0) + 1);
    }
    return out;
};

describe('JSON 出力 / docs/examples/repository (Apex の構文のサンプル)', () => {
    for (const [index, [file]] of examples.entries()) {
        it(`${file}: IR のエラーなしで変換でき、IR の値を欠落させない`, async () => {
            const { ir, irErrors, json } = await convert(index);
            assert.deepEqual(irErrors, []);
            assert.equal(find(json, (n) => n.kind === 'error').length, 0);

            const expected = countValues(dumpIr(ir), META_KEYS);
            const actual = countValues(json, new Set(['sourceKeys']));
            const missing = [...expected]
                .filter(([value, count]) => (actual.get(value) ?? 0) < count)
                .map(([value, count]) => `${value} x${count - (actual.get(value) ?? 0)}`);
            assert.deepEqual(missing, []);
        });

        it(`${file}: JSON の sourceKeys がすべて絞り込み後の SourceJson から引ける`, async () => {
            const { json, sourceObjects, allSourceObjects } = await convert(index);
            const registered = new Set(
                sourceObjects.flatMap((o) => o.source.map((s) => `${o.objectKey}/${s.sourceKey}`)),
            );
            const keys = find(json, (n) => n.sourceKeys !== undefined).flatMap((n) =>
                'objectKey' in n.sourceKeys ? [n.sourceKeys] : Object.values(n.sourceKeys).flat(),
            );
            assert.ok(keys.length > 0);
            keys.forEach((k: any) => assert.ok(registered.has(`${k.objectKey}/${k.sourceKey}`)));
            assert.ok(sourceObjects.length < allSourceObjects.length);
        });
    }

    it('宣言は名前の位置を持つ境界ノードになる', async () => {
        const { json } = await convert(0);
        for (const kind of ['class', 'method', 'constructor', 'property', 'enum', 'interface']) {
            const declarations = find(json, (n) => n.kind === kind);
            assert.ok(declarations.length > 0, kind);
            declarations.forEach((d) => {
                assert.ok(d.sourceKeys.base, kind);
                assert.ok(d.sourceKeys.name, kind);
            });
        }
        // field は初期値まで含めて 1 つの境界ノード
        const fields = find(json, (n) => n.kind === 'field');
        assert.ok(fields.length > 0);
        fields.forEach((f) => assert.ok(f.sourceKeys.objectKey));
        // enum の定数も位置を持つ
        assert.ok(find(json, (n) => n.kind === 'enumConstant').length > 0);
    });

    it('クラスのコンストラクタはメンバーの並び (block) に入り、constructor プロパティを使わない', async () => {
        const { json } = await convert(0);
        const classes = find(json, (n) => n.kind === 'class');
        assert.ok(
            classes.some(
                (c) =>
                    Array.isArray(c.block) &&
                    (c.block as { kind?: string }[]).some((m) => m.kind === 'constructor'),
            ),
        );
        classes.forEach((c) => assert.equal(Object.hasOwn(c, 'constructor'), false));
    });

    it('複合文・SOQL / SOSL は境界ノードになる', async () => {
        const { json } = await convert(0);
        for (const kind of [
            'if',
            'for',
            'while',
            'doWhile',
            'switch',
            'try',
            'runAs',
            'soql',
            'sosl',
            'subQuery',
        ]) {
            assert.ok(find(json, (n) => n.kind === kind && n.sourceKeys).length > 0, kind);
        }
    });

    it('内側の型（ジェネリクス・要素型）はキーを持たない', async () => {
        const { json } = await convert(0);
        const collections = find(json, (n) => n.kind === 'type' && n.type === 'map');
        assert.ok(collections.length > 0);
        collections.forEach((t) => {
            assert.equal(t.keyType.kind, undefined);
            assert.equal(t.keyType.sourceKeys, undefined);
            assert.equal(t.valueType.sourceKeys, undefined);
        });
    });

    it('SOSL の検索語だけを find に持つ', async () => {
        const { json } = await convert(0);
        const finds = find(json, (n) => n.kind === 'sosl').map((n) => n.find);
        assert.ok(finds.includes('test'));
        assert.ok(finds.includes('a@example.com'));
        finds
            .filter((f) => typeof f === 'string')
            .forEach((f) => assert.equal(/FIND/i.test(f), false));
    });

    it('トリガー名・対象 SObject・トリガー条件を保持する', async () => {
        const { json } = await convert(1);
        assert.equal(json.name, 'ParserTrigger');
        assert.equal(json.object, 'Account');
        assert.ok(json.case.length > 0);
        json.case.forEach((c: any) => {
            assert.equal(c.kind, 'triggerCase');
            assert.ok(c.sourceKeys.objectKey);
        });
    });
});
