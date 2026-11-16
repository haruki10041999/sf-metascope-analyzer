import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { EXPRESSION_KINDS } from '../../src/analyzer/types';
import { regenerateSourceObjects } from '../../src/analyzer/types/apex/commons';

import { find, toJson, unitRules } from './helpers';

/** sourceKeys を除く */
const stripKeys = (value: unknown): any =>
    Array.isArray(value)
        ? value.map(stripKeys)
        : value && typeof value === 'object'
          ? Object.fromEntries(
                Object.entries(value)
                    .filter(([key]) => key !== 'sourceKeys')
                    .map(([key, child]) => [key, stripKeys(child)]),
            )
          : value;

// JSON 層の、省略できるところ・取り出し・SourceJson の再生成 (IR v2 の木から作る。docs/ir-integration.md)。
// v1 の「エラーのノードを ErrorJson にする」テストは、v2 の木にエラーのノードがないのでなくした

const anonymous = async (source: string) => {
    const { json, irErrors } = await toJson(source, unitRules.anonymous);
    assert.deepEqual(irErrors, []);
    return json;
};

describe('JSON 層の形', () => {
    it('文は LWC と同じ形 (段階 A4: 条件は式、本体は配列、for / forEach、catch の型、blockStatement)', async () => {
        const json = await anonymous(
            [
                'if (x) a(); else if (y) { b(); } else c();',
                'while (x) a();',
                'do { a(); } while (x);',
                'for (Integer i = 0, j = 1; i < 3; i++) a();',
                'for (Account acc : accounts) { a(); }',
                "switch on x { when 1, -2 { a(); } when 'k' { b(); } when null { } when else { c(); } }",
                'switch on o { when Account acc { a(); } when else { } }',
                'try { a(); } catch (System.DmlException e) { b(); } finally { c(); }',
                'System.runAs(u) { a(); }',
                '{ Integer nested = 1; }',
                'break;',
            ].join(' '),
        );
        const one = (kind: string) => find(json, (n) => n.kind === kind)[0] as Record<string, any>;
        const ifJson = one('if');
        assert.deepEqual(
            ifJson.conditionBlock.map((b: any) => [
                b.condition === 'else' ? 'else' : b.condition.kind,
                b.block.map((s: any) => s.kind),
            ]),
            [
                ['identifier', ['expression']],
                ['identifier', ['expression']],
                ['else', ['expression']],
            ],
        );
        assert.equal(one('while').condition.kind, 'identifier');
        assert.deepEqual(stripKeys(one('while').block).length, 1);
        assert.equal(one('doWhile').condition.name, 'x');
        const forJson = one('for');
        assert.deepEqual(
            forJson.condition.initializer.variants.map((v: any) => [v.kind, v.name]),
            [
                ['variant', 'i'],
                ['variant', 'j'],
            ],
        );
        assert.equal(forJson.condition.initializer.variantType.primitiveType, 'Integer');
        assert.equal(forJson.condition.condition.kind, 'binary');
        const forEach = one('forEach');
        assert.equal(forEach.variant, 'acc');
        assert.deepEqual(forEach.variantType.customType, ['Account']);
        assert.equal(forEach.right.name, 'accounts');
        const [literalSwitch, typeSwitch] = find(json, (n) => n.kind === 'switch');
        assert.equal(literalSwitch.value.name, 'x');
        assert.deepEqual(stripKeys(literalSwitch.when.map((w: any) => w.condition.condition)), [
            [
                { kind: 'integer', value: '1' },
                { kind: 'integer', value: '-2' },
            ],
            [{ kind: 'string', value: 'k' }],
            [{ kind: 'null' }],
            'else',
        ]);
        assert.equal(typeSwitch.when[0].condition.condition.variant, 'acc');
        assert.deepEqual(typeSwitch.when[0].condition.condition.variantType.customType, [
            'Account',
        ]);
        const [, catchClause, finallyClause] = one('try').block;
        assert.equal(catchClause.condition, 'catch');
        assert.equal(catchClause.variant, 'e');
        assert.deepEqual(catchClause.variantType.customType, ['System', 'DmlException']);
        assert.ok(catchClause.variantType.sourceKeys);
        assert.equal(finallyClause.condition, 'finally');
        assert.equal(one('runAs').arg[0].name, 'u');
        assert.equal(one('blockStatement').block[0].kind, 'localVariable');
        assert.deepEqual(stripKeys(one('break')), { kind: 'break' });
        // ローカル変数は入れ子にしない
        const local = one('blockStatement').block[0];
        assert.equal(local.variantType.primitiveType, 'Integer');
        assert.equal(local.variants[0].kind, 'variant');
        for (const removed of [
            'ifCondition',
            'whileCondition',
            'doWhileCondition',
            'forCondition',
            'switchVariant',
            'runAsCondition',
            'catchCondition',
        ]) {
            assert.equal(find(json, (n) => n.kind === removed).length, 0, removed);
        }
    });

    it('式はどれも kind を持ち、ソースの文字列を持たない (段階 A2)', async () => {
        const json = await anonymous(
            [
                "String s = 'it\\'s';",
                'Boolean b = TRUE;',
                'Long n = 5L;',
                'Object c = Account.class;',
                'Type v = void.class;',
                'f(1);',
                'this.g();',
                'Integer i = a[0];',
                'Integer j = (Integer) o;',
                'Boolean k = o instanceof Integer;',
                'Integer m = (1 + 2) * 3;',
                'Boolean l = x && !y;',
                'Map<String, Integer> e = new Map<String, Integer>{};',
                "Map<String, Integer> p = new Map<String, Integer>{ 'a' => 1 };",
                'Integer[] arr = new Integer[5];',
                'Object q = x ?? null;',
            ].join(' '),
        );
        const init = (name: string) =>
            find(json, (n) => n.name === name && 'init' in n)[0]!.init as Record<string, any>;
        assert.deepEqual(stripKeys(init('s')), { kind: 'string', value: "it's" });
        assert.deepEqual(stripKeys(init('b')), { kind: 'boolean', value: true });
        assert.deepEqual(stripKeys(init('n')), { kind: 'long', value: '5L' });
        assert.equal(init('c').kind, 'classLiteral');
        assert.deepEqual(init('c').classType.customType, ['Account']);
        assert.deepEqual(stripKeys(init('v')), { kind: 'classLiteral', classType: 'void' });
        const [call] = find(json, (n) => n.kind === 'call');
        assert.deepEqual(stripKeys(call), {
            kind: 'call',
            callee: { kind: 'identifier', name: 'f' },
            arg: [{ kind: 'integer', value: '1' }],
        });
        assert.equal(find(json, (n) => n.kind === 'this').length, 1);
        assert.equal(init('i').kind, 'index');
        assert.equal(init('j').kind, 'cast');
        assert.equal(init('k').kind, 'instanceof');
        assert.equal(init('m').kind, 'binary');
        assert.equal(init('m').left.kind, 'parenthesized');
        assert.equal(init('l').kind, 'logical');
        assert.equal(init('l').right.kind, 'unary');
        assert.equal(init('q').operator, '??');
        assert.deepEqual(stripKeys(init('e')).entries, []);
        assert.equal(init('p').newType.type, 'map');
        assert.equal(init('p').entries.length, 1);
        assert.equal(init('arr').newType.type, 'array');
        assert.equal(init('arr').size.kind, 'integer');
        // 式はどれも sourceKeys を持つ (kind を持つものは境界ノード)
        const expressions = find(json, (n) => EXPRESSION_KINDS.has(n.kind));
        assert.ok(expressions.length > 20);
        assert.deepEqual(
            expressions.filter((n) => n.sourceKeys === undefined).map((n) => n.kind),
            [],
        );
    });

    it("SOSL の FIND :term と FIND 'term' を区別する (段階 A1)", async () => {
        const json = await anonymous(
            "String term = 'a'; List<List<SObject>> a = [FIND :term RETURNING Account]; List<List<SObject>> b = [FIND 'term' RETURNING Account];",
        );
        const [bind, literal] = find(json, (n) => n.kind === 'sosl');
        assert.equal(bind.find.type, 'bind');
        assert.equal(bind.find.value.kind, 'identifier');
        assert.equal(bind.find.value.name, 'term');
        assert.deepEqual(literal.find, { type: 'literal', value: 'term' });
    });

    it('型の名前・SOQL の残り・merge・引数をそろえる (段階 A6)', async () => {
        const json = await anonymous(
            [
                'Account a = new Account(); ns.Outer.Inner b;',
                "List<Account> q1 = [SELECT Id FROM Account WHERE FORMULA('Amount__c * 2') > 10];",
                "List<Account> q2 = [SELECT Id FROM Account WITH Name = 'x'];",
                'List<Account> q3 = [SELECT Id FROM Account ALL ROWS];',
                'List<Event> q4 = [SELECT TYPEOF What WHEN Account THEN Phone ELSE Name END FROM Event];',
                'merge a b;',
            ].join(' '),
        );
        // customType はいつも名前の並び
        const types = find(json, (n) => n.type === 'custom').map((n) => n.customType);
        assert.deepEqual(types.slice(0, 3), [['Account'], ['Account'], ['ns', 'Outer', 'Inner']]);

        const [formula] = find(json, (n) => n.field?.type === 'formula');
        assert.deepEqual(formula.field, { type: 'formula', value: 'Amount__c * 2' });

        const [withExpression] = find(json, (n) => n.mode === 'EXPRESSION');
        assert.equal(withExpression.condition.condition[0].kind, 'singleCondition');

        const [allRows] = find(json, (n) => n.kind === 'allRowsClause');
        assert.deepEqual(Object.keys(allRows).sort(), ['kind', 'sourceKeys']);

        const whens = find(json, (n) => n.kind === 'typeOfWhen');
        assert.deepEqual(
            whens.map((w) => [w.object, w.field]),
            [
                [['Account'], [['Phone']]],
                ['else', [['Name']]],
            ],
        );
        assert.ok(whens.every((w) => w.sourceKeys.objectKey));

        const [merge] = find(json, (n) => n.kind === 'merge');
        assert.equal(merge.master.name, 'a');
        assert.equal(merge.merged.name, 'b');
        assert.equal(Object.hasOwn(merge, 'field'), false);

        // 引数のないメソッドも param を持つ (LWC と同じく、いつも配列)
        const { json: cls } = await toJson(
            'public class C { public C() {} void m() {} void n(Integer x) {} }',
            unitRules.cls,
        );
        assert.deepEqual(
            find(cls, (n) => n.kind === 'method' || n.kind === 'constructor').map(
                (m) => m.param.length,
            ),
            [0, 0, 1],
        );
    });

    it('for の init / update が省略されていても変換できる', async () => {
        const [json] = find(await anonymous('for (; i < 1;) {}'), (n) => n.kind === 'for');

        assert.ok(json);
        assert.deepEqual(json.condition.condition.left.kind, 'identifier');
        assert.equal(json.condition.condition.left.name, 'i');
        assert.equal(Object.hasOwn(json.condition, 'initializer'), false);
        assert.equal(Object.hasOwn(json.condition, 'update'), false);
    });

    it('DISTANCE の引数は 2 つの位置と単位になる', async () => {
        const json = await anonymous(
            "List<Account> a = [SELECT Id FROM Account WHERE DISTANCE(Location__c, GEOLOCATION(1, 2), 'mi') < 20];",
        );
        const [distance] = find(json, (n) => n.func === 'DISTANCE');

        assert.ok(distance);
        assert.notEqual(distance.arg?.kind, 'error');
    });

    it('trigger 名と対象を持つ', async () => {
        const { json } = await toJson(
            'trigger OnlyName on Account (before insert) {}',
            unitRules.trigger,
        );

        assert.equal(json.name, 'OnlyName');
        assert.equal(json.object, 'Account');
    });

    it('SOSL の FIND は検索語だけを持つ', async () => {
        for (const [find_, term] of [
            ["FIND 'test'", 'test'],
            ["FIND 'it\\'s'", "it\\'s"],
        ] as const) {
            const json = await anonymous(
                `List<List<SObject>> r = [${find_} IN ALL FIELDS RETURNING Account];`,
            );
            const [sosl] = find(json, (n) => n.kind === 'sosl');
            assert.deepEqual(sosl?.find, { type: 'literal', value: term });
        }
    });
});

describe('SourceJson の再生成', () => {
    it('深い入れ子でも各ノードを 1 回だけ辿る', () => {
        let node: any = { kind: 'leaf', sourceKeys: { objectKey: 'o0', sourceKey: 's0' } };
        for (let i = 1; i <= 40; i++) {
            node = {
                kind: 'n',
                sourceKeys: { objectKey: `o${i}`, sourceKey: `s${i}` },
                child: node,
            };
        }
        const sources = [{ objectKey: 'o0', context: 'x', source: [{ sourceKey: 's0' } as never] }];

        const started = Date.now();
        const result = regenerateSourceObjects(sources, node);

        assert.ok(Date.now() - started < 1000);
        assert.deepEqual(result, sources);
    });

    it('StructureJson の配列のキーも登録する', () => {
        const json: any = {
            kind: 'catchCondition',
            sourceKeys: {
                base: { objectKey: 'base', sourceKey: 'b' },
                exceptionType: [{ objectKey: 'type', sourceKey: 't1' }],
            },
        };
        const sources = [
            { objectKey: 'base', context: 'x', source: [{ sourceKey: 'b' } as never] },
            {
                objectKey: 'type',
                context: 'x',
                source: [{ sourceKey: 't1' } as never, { sourceKey: 't2' } as never],
            },
        ];

        const result = regenerateSourceObjects(sources, json);

        assert.deepEqual(
            result.map((o) => [o.objectKey, o.source.map((s: any) => s.sourceKey)]),
            [
                ['base', ['b']],
                ['type', ['t1']],
            ],
        );
    });
});
