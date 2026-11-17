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

const ESCAPED: Record<string, string> = {
    '\n': '\\n',
    '\t': '\\t',
    '\r': '\\r',
    '\b': '\\b',
    '\f': '\\f',
};

/** 文字列を Apex の書き方 (引用符つき、エスケープしたもの) に戻す */
const quoted = (value: unknown): string =>
    `'${String(value).replace(/[\\'\n\t\r\b\f]/g, (c) => ESCAPED[c] ?? `\\${c}`)}'`;

/**
 * 式の JSON (段階 A2) で、ソースの書き方を持たなくなった値を、IR の書き方に戻して数える
 * (文字列のリテラルは引用符なし、boolean は真偽値、null は値なし、new の List / Set / Map・{} は型の JSON)
 */
const sourceFormsOf = (node: Record<string, unknown>): string[] => {
    switch (node.kind) {
        case 'string':
            return [quoted(node.value)];
        case 'integer':
        case 'long':
            // when の値の符号は値の前につなぐ (段階 A4)。IR は符号を別に持つ
            return [...(String(node.value).match(/^[+-]+/)?.[0] ?? '')];
        case 'boolean':
        case 'null':
            return [node.kind === 'null' ? 'null' : String(node.value)];
        case 'classLiteral':
            return node.classType === 'void' ? ['void.class'] : [];
        // ALL ROWS は値を持たない (段階 A6)
        case 'allRowsClause':
            return ['ALL ROWS'];
        case 'new': {
            const created = node.newType as { type: string; elementType?: { type: string } };
            // new List<String>[2] は List の配列
            const newType = created.type === 'array' ? created.elementType! : created;
            const empty =
                (Array.isArray(node.elements) && node.elements.length === 0) ||
                (Array.isArray(node.entries) && node.entries.length === 0);
            return [
                ...({ list: ['List'], set: ['Set'], map: ['Map'] }[newType.type] ?? []),
                ...(empty ? ['{}'] : []),
            ];
        }
        default:
            // FORMULA('...') の数式は引用符を除いて持つ (段階 A6)
            return node.type === 'formula' ? [quoted(node.value)] : [];
    }
};

const countValues = (
    target: unknown,
    skip: Set<string>,
    out = new Map<string, number>(),
    /** JSON の側だけ、ソースの書き方に戻した値も数える */
    json = false,
) => {
    if (Array.isArray(target)) {
        target.forEach((item) => countValues(item, skip, out, json));
    } else if (target !== null && typeof target === 'object') {
        for (const form of json ? sourceFormsOf(target as Record<string, unknown>) : []) {
            out.set(form, (out.get(form) ?? 0) + 1);
        }
        for (const [key, value] of Object.entries(target)) {
            if (skip.has(key)) continue;
            if (typeof value === 'string' || typeof value === 'number') {
                const text = searchTermOf(String(value));
                out.set(text, (out.get(text) ?? 0) + 1);
            } else {
                countValues(value, skip, out, json);
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
            const actual = countValues(json, new Set(['sourceKeys']), new Map(), true);
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
        // リテラルは { type: 'literal', value }、バインド (:x) は { type: 'bind', value: 式 } (段階 A1)
        const literals = finds.filter((f) => f.type === 'literal').map((f) => f.value);
        assert.ok(literals.includes('test'));
        assert.ok(literals.includes('a@example.com'));
        assert.ok(finds.some((f) => f.type === 'bind'));
        literals.forEach((f) => assert.equal(/FIND/i.test(f), false));
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
