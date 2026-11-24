import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import type { ApexSourceJson } from '../../src/analyzer/parser';
import { parseApexUnitFiles } from '../../src/analyzer/parser/Apex/unit';
import {
    makeApexDotMethodCallNameOf,
    makeApexDotObjectCallNameOf,
    makeApexMethodCallNameOf,
    apexCallsOf,
    namePathOf,
} from '../../src/analyzer/processor/Apex/semantic/call';
import {
    type ApexDeclaration,
    type ApexDeclarationOf,
    apexDeclarationsOf,
} from '../../src/analyzer/processor/Apex/semantic/declaration';
import {
    type ApexNameTarget,
    analyzeApexBodies,
    definitionCandidatesOf,
} from '../../src/analyzer/processor/Apex/semantic/statement';
import { type ApexQuery, apexQueriesOf } from '../../src/analyzer/processor/Apex/semantic/query';
import type { CallJson, DotMethodCallJson, MethodDeclarationJson } from '../../src/analyzer/types';

// 作り直し中の Apex の walker (src/analyzer/processor/Apex/semantic/)。
// 入力は今のパーサーの JSON (最小のソースと、サンプルの ParserTest.cls)。docs/plan.md の P0・P2

const parseSource = async (
    source: string,
    name = 'A',
): Promise<Exclude<ApexSourceJson, { fileType: 'error' }>> => {
    const fileName = `${name}.cls`;
    const unit = await parseApexUnitFiles({
        unitType: 'class',
        name,
        filePath: fileName,
        source: { fileName, source },
    });
    assert.deepEqual(unit.resolvedError, []);
    const parsed = unit.result.base.source;
    assert.ok(parsed && parsed.fileType !== 'error');
    return parsed;
};

/** JSON の木から、kind が一致するノードを書いた順に集める */
const nodesOf = <T extends { kind: string }>(value: unknown, kind: T['kind']): T[] => {
    const found: T[] = [];
    const walk = (v: unknown): void => {
        if (Array.isArray(v)) {
            v.forEach(walk);
            return;
        }
        if (typeof v !== 'object' || v === null) return;
        if ((v as { kind?: unknown }).kind === kind) found.push(v as T);
        Object.values(v).forEach(walk);
    };
    walk(value);
    return found;
};

/** メソッド本体の最初の式文の式 */
const expressionOf = async (expression: string): Promise<unknown> => {
    const source = await parseSource(`public class A { void m() { ${expression}; } }`);
    const method = nodesOf<MethodDeclarationJson>(source.content, 'method')[0];
    assert.ok(method?.block);
    return method.block[0];
};

describe('walker/call.ts', () => {
    it('splits a method call into the receiver path and the method name', async () => {
        const [call] = nodesOf<DotMethodCallJson>(await expressionOf('a.b.c()'), 'memberAccess');
        assert.ok(call);
        assert.deepEqual(makeApexDotMethodCallNameOf(call), {
            kind: 'method',
            path: ['a', 'b'],
            name: 'c',
        });
        // メソッドの呼び出しはフィールドの参照ではない
        assert.equal(makeApexDotObjectCallNameOf(call), undefined);
    });

    it('keeps calls inside the receiver chain (hoge.fuga(tmp()).aaa())', async () => {
        const calls = nodesOf<DotMethodCallJson>(
            await expressionOf('hoge.fuga(tmp()).aaa()'),
            'memberAccess',
        );
        // 書いた順: 外側の aaa、その中の fuga
        assert.deepEqual(
            calls.map((call) => makeApexDotMethodCallNameOf(call)),
            [
                { kind: 'method', path: ['hoge', 'fuga'], name: 'aaa' },
                { kind: 'method', path: ['hoge'], name: 'fuga' },
            ],
        );
        const [tmp] = nodesOf<CallJson>(calls[1], 'call');
        assert.ok(tmp);
        assert.deepEqual(makeApexMethodCallNameOf(tmp), { kind: 'method', name: 'tmp' });
    });

    it('reads a field access as an object name and ignores it as a method call', async () => {
        const source = await parseSource('public class A { void m() { Object x = a.b.c; } }');
        const [access] = nodesOf<DotMethodCallJson>(source.content, 'memberAccess');
        assert.ok(access);
        assert.deepEqual(makeApexDotObjectCallNameOf(access), {
            kind: 'object',
            name: ['a', 'b', 'c'],
        });
        assert.equal(makeApexDotMethodCallNameOf(access), undefined);
    });

    it('marks this(...) and super(...) as constructor calls', async () => {
        const source = await parseSource(
            'public class A extends B { A() { this(1); } A(Integer i) { super(i); } }',
        );
        assert.deepEqual(
            nodesOf<CallJson>(source.content, 'call').map((call) => makeApexMethodCallNameOf(call)),
            [
                { kind: 'constructor', target: 'this' },
                { kind: 'constructor', target: 'super' },
            ],
        );
    });

    it('stops the receiver path at expressions without a name (items[0].get())', async () => {
        const [call] = nodesOf<DotMethodCallJson>(
            await expressionOf('items[0].get(1)'),
            'memberAccess',
        );
        assert.ok(call);
        // 添字の式はまだ名前にしない (レシーバーの式を持つ形は P2 で作る)
        assert.deepEqual(makeApexDotMethodCallNameOf(call), {
            kind: 'method',
            path: [],
            name: 'get',
        });
    });
});

/** 宣言を「種類:パス.名前」の形にする */
const keyOf = (d: ApexDeclaration) => `${d.kind}:${[...d.path, d.name].join('.')}`;

const parseUnit = async (unitType: 'trigger' | 'anonymous', name: string, source: string) => {
    const fileName = unitType === 'trigger' ? `${name}.trigger` : `${name}.apex`;
    const unit = await parseApexUnitFiles({
        unitType,
        name,
        filePath: fileName,
        source: { fileName, source },
    });
    assert.deepEqual(unit.resolvedError, []);
    const parsed = unit.result.base.source;
    assert.ok(parsed && parsed.fileType !== 'error');
    return parsed;
};

describe('semantic/declaration.ts', () => {
    const CLASS = `@IsTest
public with sharing virtual class A extends Base implements I, J {
    public static final Integer MAX = 10, MIN;
    private String name { get; private set { name = value; Integer inSetter; } }
    static { Integer inInit = 1; }
    public A() { this(1); }
    public A(Integer i) { super(i); }
    @AuraEnabled public static List<Account> run(final Id accountId, String q) {
        Integer a = 1;
        if (true) { Integer nested; }
        for (Integer i = 0; i < 1; i++) {}
        for (Account acc : [SELECT Id FROM Account]) {}
        try {} catch (DmlException e) {}
        switch on q { when Account rec {} when else {} }
        return null;
    }
    public abstract void later();
    public enum Level { LOW, HIGH }
    public interface Inner { void call(String s); }
}`;

    it('宣言を種類・パスつきで書いた順に集める (パスの先頭はクラス名)', async () => {
        const { declarations } = apexDeclarationsOf(await parseSource(CLASS));
        assert.deepEqual(declarations.map(keyOf), [
            'class:A',
            'field:A.MAX',
            'field:A.MIN',
            'property:A.name',
            'getter:A.name.name',
            'setter:A.name.name',
            'localVariable:A.name.setter.inSetter',
            'initializer:A.initializer',
            'localVariable:A.initializer.inInit',
            'constructor:A.A',
            'constructor:A.A',
            'parameter:A.A.i',
            'method:A.run',
            'parameter:A.run.accountId',
            'parameter:A.run.q',
            'localVariable:A.run.a',
            'localVariable:A.run.nested',
            'localVariable:A.run.i',
            'forEachVariable:A.run.acc',
            'catchVariable:A.run.e',
            'whenVariable:A.run.rec',
            'method:A.later',
            'enum:A.Level',
            'enumConstant:A.Level.LOW',
            'enumConstant:A.Level.HIGH',
            'interface:A.Inner',
            'interfaceMethod:A.Inner.call',
            'parameter:A.Inner.call.s',
        ]);
        // ID は宣言ごとに一意
        assert.equal(new Set(declarations.map((d) => d.id)).size, declarations.length);
    });

    it('宣言から修飾子・型・本体の情報を取り出す', async () => {
        const { declarations } = apexDeclarationsOf(await parseSource(CLASS));
        const find = <K extends ApexDeclaration['kind']>(kind: K, name: string) => {
            const found = declarations.find((d) => d.kind === kind && d.name === name);
            assert.ok(found, `${kind} ${name}`);
            return found as ApexDeclarationOf<K>;
        };

        const a = find('class', 'A');
        assert.equal(a.modifiers.sharing, 'with');
        assert.equal(a.modifiers.isVirtual, true);
        assert.equal(a.isTest, true);
        assert.equal(a.extends.length, 1);
        assert.equal(a.implements.length, 2);
        assert.equal(a.memberCount, 9);

        const max = find('field', 'MAX');
        const min = find('field', 'MIN');
        assert.equal(max.isConstant, true);
        assert.equal(max.hasInitializer, true);
        assert.equal(min.hasInitializer, false);
        assert.deepEqual(max.statementSourceKeys, min.statementSourceKeys);
        assert.notEqual(max.id, min.id);

        const property = find('property', 'name');
        assert.equal(property.getter?.isAutomatic, true);
        assert.equal(property.setter?.isAutomatic, false);
        assert.equal(property.setter?.access, 'private');
        assert.notEqual(property.getter?.id, property.setter?.id);

        const run = find('method', 'run');
        assert.equal(run.modifiers.isStatic, true);
        assert.deepEqual(run.modifiers.annotations, ['AuraEnabled']);
        assert.equal(run.hasBody, true);
        assert.equal(run.parameterIds.length, 2);
        assert.equal(find('parameter', 'accountId').isFinal, true);
        assert.equal(find('method', 'later').hasBody, false);

        assert.deepEqual(
            declarations.flatMap((d) => (d.kind === 'constructor' ? [d.delegatesTo] : [])),
            ['this', 'super'],
        );
        assert.equal(find('initializer', 'initializer').isStatic, true);
        assert.deepEqual(
            declarations.flatMap((d) => (d.kind === 'enumConstant' ? [d.ordinal] : [])),
            [0, 1],
        );
    });

    it('ローカル変数は見える範囲と本体を持つ', async () => {
        const { declarations } = apexDeclarationsOf(await parseSource(CLASS));
        const run = declarations.find((d) => d.kind === 'method' && d.name === 'run');
        assert.ok(run);
        const locals = declarations.flatMap((d) =>
            d.kind === 'localVariable' && d.bodyId === run.id ? [d] : [],
        );
        assert.deepEqual(
            locals.map((d) => d.name),
            ['a', 'nested', 'i'],
        );
        // a はメソッドの直下、nested は if の節、i は for の中
        assert.equal(locals[0]?.scopeKey, run.id);
        assert.equal(new Set(locals.map((d) => d.scopeKey)).size, 3);
    });

    it('実行本体を集める (メソッド・コンストラクター・初期化ブロック・setter)', async () => {
        const { bodies } = apexDeclarationsOf(await parseSource(CLASS));
        assert.deepEqual(
            bodies.map((b) => `${b.kind}:${b.path.join('.')}`),
            [
                'setter:A.name.setter',
                'initializer:A.initializer',
                'constructor:A.A',
                'constructor:A.A',
                'method:A.run',
            ],
        );
        assert.equal(bodies.find((b) => b.kind === 'method')?.parameterIds.length, 2);
    });

    it('トリガーのイベントと本体の文を取り出す', async () => {
        const source = await parseUnit(
            'trigger',
            'AccTrigger',
            'trigger AccTrigger on Account (before insert, after update) { Integer n = Trigger.new.size(); }',
        );
        const { declarations, bodies } = apexDeclarationsOf(source);
        assert.deepEqual(declarations.map(keyOf), [
            'trigger:AccTrigger',
            'localVariable:AccTrigger.n',
        ]);
        const trigger = declarations[0];
        assert.ok(trigger?.kind === 'trigger');
        assert.equal(trigger.object, 'Account');
        assert.deepEqual(trigger.events, [
            { timing: 'BEFORE', actionType: 'INSERT' },
            { timing: 'AFTER', actionType: 'UPDATE' },
        ]);
        assert.equal(bodies[0]?.statements.length, 1);
    });

    it('匿名 Apex は単位名を先頭にし、中の宣言を本体の文から除く', async () => {
        const source = await parseUnit(
            'anonymous',
            'script',
            'Integer x = 1; void helper() {} helper();',
        );
        const { declarations, bodies } = apexDeclarationsOf(source);
        assert.deepEqual(declarations.map(keyOf), [
            'anonymous:script',
            'localVariable:script.x',
            'method:script.helper',
        ]);
        assert.deepEqual(
            bodies.map((b) => `${b.kind}:${b.path.join('.')}:${b.statements.length}`),
            ['anonymous:script:2', 'method:script.helper:0'],
        );
    });

    it('サンプルの ParserTest.cls の宣言を集める (内部クラスを含む)', async () => {
        const file = path.join(
            'docs/examples/repository/after/force-app/main/default/classes/ParserTest.cls',
        );
        const { declarations } = apexDeclarationsOf(
            await parseSource(fs.readFileSync(file, 'utf8'), 'ParserTest'),
        );
        const keys = new Set(declarations.map(keyOf));
        assert.ok(keys.has('class:ParserTest'));
        assert.ok(keys.has('class:ParserTest.AccountReader'));
        assert.ok(keys.has('method:ParserTest.AccountReader.getAccount'));
        assert.ok(keys.has('method:ParserTest.AccountReader.nameOfAccount'));
        assert.ok(keys.has('method:ParserTest.dynamicSoqlExample'));
        assert.ok(keys.has('localVariable:ParserTest.dynamicSoqlExample.soqlB'));
        assert.equal(new Set(declarations.map((d) => d.id)).size, declarations.length);
    });
});

describe('semantic/statement.ts', () => {
    /** 本体を名前で探して、解析の結果を返す */
    const analyze = async (source: string, bodyPath: string) => {
        const declarations = apexDeclarationsOf(await parseSource(source));
        const analysis = analyzeApexBodies(declarations).find(
            (a) => a.body.path.join('.') === bodyPath,
        );
        assert.ok(analysis, bodyPath);
        const byId = new Map(declarations.declarations.map((d) => [d.id, d]));
        /** 解決先を「種類:宣言のパス」の形にする */
        const targetOf = (target: ApexNameTarget) =>
            target.kind === 'variable' || target.kind === 'member'
                ? `${target.kind}:${keyOf(byId.get(target.declarationId) as ApexDeclaration)}`
                : target.kind;
        return { analysis, byId, targetOf };
    };

    it('識別子をスコープ・引数・メンバーの順に解決し、読み書きを分ける', async () => {
        const { analysis, targetOf } = await analyze(
            `public class A {
                Integer count;
                String label { get; set; }
                void run(Integer n, Account acc) {
                    Integer total = n;
                    total += count;
                    total++;
                    acc.Name = label;
                    helper(total);
                    Account.SObjectType.getDescribe();
                }
                void helper(Integer x) {}
            }`,
            'A.run',
        );
        assert.deepEqual(
            analysis.accesses.map((a) => `${a.name}:${a.access}:${targetOf(a.target)}`),
            [
                'n:read:variable:parameter:A.run.n',
                // total += count は、右辺の count を読んでから total に書く
                'count:read:member:field:A.count',
                'total:readWrite:variable:localVariable:A.run.total',
                'total:readWrite:variable:localVariable:A.run.total',
                'label:read:member:property:A.label',
                'acc:memberWrite:variable:parameter:A.run.acc',
                // helper(...) の helper はメソッドの名前なので変数として数えない
                'total:read:variable:localVariable:A.run.total',
                'Account:read:unresolved',
            ],
        );
    });

    it('書き込みは右辺を読んだあとの順にし、定義を集める', async () => {
        const { analysis, byId } = await analyze(
            `public class A {
                void run(Integer n) {
                    Integer a = n;
                    a = a + 1;
                    for (Account acc : [SELECT Id FROM Account WHERE Id = :n]) { a++; }
                    try {} catch (Exception e) { a = 0; }
                }
            }`,
            'A.run',
        );
        assert.deepEqual(
            analysis.definitions.map(
                (d) => `${byId.get(d.declarationId)?.name}:${d.kind}${d.inLoop ? ':loop' : ''}`,
            ),
            [
                'n:parameter',
                'a:initializer',
                'a:assignment',
                'acc:loopVariable:loop',
                'a:increment:loop',
                'e:catchVariable',
                'a:assignment',
            ],
        );
        // a = a + 1 の右辺の a は、左辺への書き込みより先
        const [readA, writeA] = analysis.accesses.filter((a) => a.name === 'a').slice(0, 2);
        assert.equal(readA?.access, 'read');
        assert.equal(writeA?.access, 'write');
        assert.ok((readA?.order ?? 0) < (writeA?.order ?? 0));
        // SOQL のバインド式の n も読みとして数える
        assert.ok(analysis.accesses.some((a) => a.name === 'n' && a.access === 'read' && a.inLoop));
    });

    it('読みに届きうる定義の候補を返す (分岐は考えない)', async () => {
        const { analysis, byId } = await analyze(
            `public class A {
                String run(Boolean flag) {
                    String s = 'a';
                    if (flag) { s = 'b'; } else { s = 'c'; }
                    return s;
                }
            }`,
            'A.run',
        );
        const read = analysis.accesses.find((a) => a.name === 's' && a.access === 'read');
        assert.ok(read);
        assert.deepEqual(
            definitionCandidatesOf(analysis, read).map(
                (d) => `${byId.get(d.declarationId)?.name}:${d.kind}:${d.value?.kind}`,
            ),
            ['s:initializer:string', 's:assignment:string', 's:assignment:string'],
        );
    });

    it('ブロックの外のローカル変数は見えない・内側の型から外側の型のメンバーを探す', async () => {
        const { analysis, targetOf } = await analyze(
            `public class Outer {
                static Integer shared;
                public class Inner {
                    Integer own;
                    void run() {
                        if (true) { Integer inner = own; }
                        Integer after = shared;
                        Integer x = inner;
                    }
                }
            }`,
            'Outer.Inner.run',
        );
        assert.deepEqual(
            analysis.accesses.map((a) => `${a.name}:${targetOf(a.target)}`),
            [
                'own:member:field:Outer.Inner.own',
                'shared:member:field:Outer.shared',
                // if の中で宣言した inner は、if の外からは見えない
                'inner:unresolved',
            ],
        );
    });

    it('setter の value・トリガーの直下の変数を解決する', async () => {
        const setter = await analyze(
            'public class A { String name { get; set { name = value; } } }',
            'A.name.setter',
        );
        assert.deepEqual(
            setter.analysis.accesses.map(
                (a) => `${a.name}:${a.access}:${setter.targetOf(a.target)}`,
            ),
            ['value:read:implicit', 'name:write:member:property:A.name'],
        );

        const source = await parseUnit(
            'trigger',
            'AccTrigger',
            'trigger AccTrigger on Account (before insert) { Integer n = 0; for (Account a : Trigger.new) { n++; } }',
        );
        const declarations = apexDeclarationsOf(source);
        const [trigger] = analyzeApexBodies(declarations);
        assert.ok(trigger);
        const n = declarations.declarations.find((d) => d.name === 'n');
        assert.deepEqual(
            trigger.accesses.map((a) => [
                a.name,
                a.target.kind === 'variable' && a.target.declarationId === n?.id,
            ]),
            [
                ['Trigger', false],
                ['n', true],
            ],
        );
    });
});

describe('semantic/call.ts の apexCallsOf', () => {
    const callsOf = async (body: string, members = '') => {
        const declarations = apexDeclarationsOf(
            await parseSource(
                `public class A { ${members} void run(List<Account> items, Service service) { ${body} } }`,
            ),
        );
        const analysis = analyzeApexBodies(declarations).find(
            (a) => a.body.path.join('.') === 'A.run',
        );
        assert.ok(analysis);
        return apexCallsOf(analysis);
    };

    it('レシーバーと引数の式を途切れさせずに持つ', async () => {
        const calls = await callsOf(
            'items[0].get(1); new Foo(2).run(); ((Foo) obj).go(service.name);',
        );
        assert.deepEqual(
            calls.map((c) => `${c.kind}:${c.name}:${c.receiver?.kind ?? '-'}`),
            ['method:get:index', 'new::-', 'method:run:new', 'method:go:cast'],
        );
        const [get, created, run, go] = calls;
        assert.ok(get?.receiver?.kind === 'index');
        assert.equal(get.receiver.object.kind, 'name');
        assert.deepEqual(
            get.args.map((a) => a.kind),
            ['integer'],
        );
        // new Foo(2).run() のレシーバーは new の呼び出しを指す
        assert.ok(run?.receiver?.kind === 'new');
        assert.equal(run.receiver.callId, created?.id);
        // 引数の service.name は、引数の変数 service のメンバー
        const arg = go?.argRefs[0];
        assert.ok(arg?.kind === 'member');
        assert.deepEqual(namePathOf(arg), ['service', 'name']);
        assert.ok(arg.object.kind === 'name' && arg.object.target.kind === 'variable');
    });

    it('呼び出しの連鎖は、前の呼び出しを指す (評価の順に並ぶ)', async () => {
        const calls = await callsOf(
            'service.fetch(helper()).save();',
            'Integer helper() { return 1; }',
        );
        assert.deepEqual(
            calls.map((c) => c.name),
            ['helper', 'fetch', 'save'],
        );
        const [helper, fetch, save] = calls;
        assert.equal(helper?.receiver, null);
        assert.ok(fetch?.receiver?.kind === 'name');
        assert.deepEqual(fetch.receiver.target.kind, 'variable');
        assert.ok(fetch.argRefs[0]?.kind === 'call' && fetch.argRefs[0].callId === helper?.id);
        assert.ok(save?.receiver?.kind === 'call' && save.receiver.callId === fetch.id);
    });

    it('型名のレシーバーは解決しない名前として残し、ループの中か・?. を持つ', async () => {
        const calls = await callsOf(
            'for (Account a : items) { System.debug(a?.getName()); } Database.insert(items);',
        );
        assert.deepEqual(
            calls.map((c) => ({
                name: c.name,
                path: c.receiver ? namePathOf(c.receiver) : null,
                inLoop: c.inLoop,
                safe: c.safeNavigation,
            })),
            [
                { name: 'getName', path: ['a'], inLoop: true, safe: true },
                { name: 'debug', path: ['System'], inLoop: true, safe: false },
                { name: 'insert', path: ['Database'], inLoop: false, safe: false },
            ],
        );
        const debug = calls[1];
        assert.ok(debug?.receiver?.kind === 'name');
        assert.equal(debug.receiver.target.kind, 'unresolved');
    });

    it('new の初期化子の要素・キーと値を引数として持つ', async () => {
        const calls = await callsOf(
            "Map<String, Integer> m = new Map<String, Integer>{ 'a' => 1 };",
        );
        assert.equal(calls.length, 1);
        assert.equal(calls[0]?.kind, 'new');
        assert.deepEqual(
            calls[0]?.args.map((a) => a.kind),
            ['string', 'integer'],
        );
    });
});

describe('semantic/query.ts の apexQueriesOf', () => {
    const queriesOf = async (body: string) => {
        const declarations = apexDeclarationsOf(
            await parseSource(
                `public class A { void run(String n, Integer max, String term) { ${body} } }`,
            ),
        );
        const analysis = analyzeApexBodies(declarations).find(
            (a) => a.body.path.join('.') === 'A.run',
        );
        assert.ok(analysis);
        return apexQueriesOf(analysis);
    };
    const fieldsOf = (query: ApexQuery | undefined) =>
        (query?.fields ?? []).map(
            (f) => `${f.via}:${f.object}.${f.path.join('.')}${f.function ? `:${f.function}` : ''}`,
        );

    it('対象・項目・バインド式と、サブクエリの役割を集める', async () => {
        const queries = await queriesOf(
            `List<Account> r = [SELECT Id, a.Name, Owner.Name, (SELECT LastName FROM Contacts)
                FROM Account a
                WHERE Name = :n AND Id IN (SELECT AccountId FROM Contact WHERE Email != null)
                WITH USER_MODE ORDER BY Name LIMIT :max];`,
        );
        assert.deepEqual(
            queries.map((q) => `${q.role}:${q.objects.map((o) => o.name).join(',')}`),
            ['query:Account', 'childRelationship:Contacts', 'semiJoin:Contact'],
        );
        const [main, child, semi] = queries;
        assert.deepEqual(fieldsOf(main), [
            'select:Account.Id',
            // 別名 a は外す。関係のパス Owner.Name はそのまま
            'select:Account.Name',
            'select:Account.Owner.Name',
            'where:Account.Name',
            'where:Account.Id',
            'orderBy:Account.Name',
        ]);
        assert.deepEqual(fieldsOf(child), ['select:Contacts.LastName']);
        assert.deepEqual(fieldsOf(semi), ['select:Contact.AccountId', 'where:Contact.Email']);
        assert.equal(child?.parentId, main?.id);
        assert.equal(semi?.parentId, main?.id);

        assert.deepEqual(
            main?.binds.map(
                (b) =>
                    `${b.via}:${b.ref.kind === 'name' ? `${b.ref.name}:${b.ref.target.kind}` : b.ref.kind}`,
            ),
            ['where:n:variable', 'limit:max:variable'],
        );
        assert.equal(main?.facts.hasLimit, true);
        assert.equal(main?.facts.limitIsBind, true);
        assert.equal(main?.facts.accessMode, 'USER_MODE');
        assert.equal(main?.facts.isAggregate, false);
        assert.equal(main?.inLoop, false);
    });

    it('関数の中の項目に関数名を付け、集計・別名を事実にする', async () => {
        const [query] = await queriesOf(
            `List<AggregateResult> r = [SELECT CALENDAR_YEAR(CreatedDate) y, MAX(Amount) total
                FROM Opportunity GROUP BY CALENDAR_YEAR(CreatedDate) HAVING COUNT(Id) > 1];`,
        );
        assert.deepEqual(fieldsOf(query), [
            'select:Opportunity.CreatedDate:CALENDAR_YEAR',
            'select:Opportunity.Amount:MAX',
            'groupBy:Opportunity.CreatedDate:CALENDAR_YEAR',
            'having:Opportunity.Id:COUNT',
        ]);
        assert.deepEqual(query?.facts.functions, ['CALENDAR_YEAR', 'MAX', 'COUNT']);
        assert.deepEqual(query?.facts.aliases, ['y', 'total']);
        assert.equal(query?.facts.isAggregate, true);
    });

    it('TYPEOF の型ごとの項目と、ループの中のクエリ', async () => {
        const [query] = await queriesOf(
            'for (Event e : [SELECT TYPEOF What WHEN Account THEN Phone ELSE Name END FROM Event]) {}',
        );
        assert.deepEqual(fieldsOf(query), [
            'typeOf:Event.What',
            'typeOf:Account.Phone',
            'typeOf:What.Name',
        ]);
        assert.equal(query?.inLoop, true);
    });

    it('SOSL の検索語のバインドと、RETURNING のオブジェクトごとの項目', async () => {
        const [query] = await queriesOf(
            `List<List<SObject>> r = [FIND :term IN ALL FIELDS
                RETURNING Account(Name, Phone WHERE Name != null ORDER BY Name LIMIT 5), Contact];`,
        );
        assert.equal(query?.kind, 'sosl');
        assert.deepEqual(
            query?.objects.map((o) => o.name),
            ['Account', 'Contact'],
        );
        assert.deepEqual(fieldsOf(query), [
            'returning:Account.Name',
            'returning:Account.Phone',
            'where:Account.Name',
            'orderBy:Account.Name',
        ]);
        assert.deepEqual(
            query?.binds.map((b) => `${b.via}:${b.ref.kind === 'name' ? b.ref.name : b.ref.kind}`),
            ['find:term'],
        );
    });
});
