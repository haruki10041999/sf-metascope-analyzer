import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { makeFieldDeclarationDiff } from '../../src/analyzer/processor/Apex/diff/declaration';
import {
    BaseExpressionJsonDiff,
    makeExpressionDiff,
} from '../../src/analyzer/processor/Apex/diff/expression';
import { GumTreeDiff, matchTrees } from '../../src/analyzer/processor/commons/diff/gumtree';
import { makeBlockTree } from '../../src/analyzer/processor/Apex/diff/gumtree/tree';
import {
    StatementJsonDiff,
    makeBlockDiff,
    makeGumTreeBlockDiff,
    StatementReplacementDiff,
    makeStatementDiff,
} from '../../src/analyzer/processor/Apex/diff/statement';
import {
    makeAnonymousUnitDiff,
    makeTriggerUnitDiff,
    makeTypeDeclarationDiff,
} from '../../src/analyzer/processor/Apex/diff/unitBody';
import { StatementJson, UpsertStatementJson } from '../../src/analyzer/types';
import { find, toJson, unitRules } from '../converter/helpers';

/** メソッド本体の文の並びと、そのソース位置 */
const toBody = async (body: string) => {
    const { json, sourceObjects } = await toJson(
        `public class Foo { public void run() { ${body} } }`,
        unitRules.cls,
    );
    const [method] = find(json, (n) => n.kind === 'method');
    return { block: method.block as unknown[], sourceObjects };
};

const diffBodies = async (before: string, after: string) => {
    const b = await toBody(before);
    const a = await toBody(after);
    return makeGumTreeBlockDiff(b.block, a.block, {
        before: b.sourceObjects,
        after: a.sourceObjects,
    });
};

const toExpression = async (expression: string) => {
    const { json } = await toJson(
        `public class Foo { public void run() { Integer value = ${expression}; } }`,
        unitRules.cls,
    );
    const [statement] = find(json, (node) => node.kind === 'localVariable');
    return statement.variable.variants[0].init;
};

/** 差分の木を前順にたどって [label, status] を並べる */
const flatten = (diffs: GumTreeDiff[]): GumTreeDiff[] =>
    diffs.flatMap((d) => [d, ...('children' in d && d.children ? flatten(d.children) : [])]);

const statuses = (diffs: GumTreeDiff[]) => diffs.map((d) => [d.label, d.status]);

const flattenTypedDiff = (value: unknown): Record<string, unknown>[] => {
    if (Array.isArray(value)) return value.flatMap(flattenTypedDiff);
    if (typeof value !== 'object' || value === null) return [];
    const record = value as Record<string, unknown>;
    const children = Object.values(record).flatMap(flattenTypedDiff);
    return [...(typeof record.status === 'string' ? [record] : []), ...children];
};

describe('gumtree tree', () => {
    it('uses objectKey as the hash of real nodes and wraps a single statement body in a block', async () => {
        const { block } = await toBody('if (x) a(); else { b(); }');
        const tree = makeBlockTree(block);
        const [ifNode] = tree.children;
        assert.equal(ifNode?.label, 'if');
        assert.equal(
            ifNode?.hash,
            (block[0] as { sourceKeys: { objectKey: string } }).sourceKeys.objectKey,
        );

        const branches = ifNode!.children[0]!.children;
        assert.deepEqual(
            branches.map((b) => [b.label, b.children.map((c) => c.label)]),
            [
                ['if.branch', ['ifCondition', 'block']],
                ['if.branch', ['block']],
            ],
        );
    });

    it('gives the same hash to the same content at a different position', async () => {
        const before = makeBlockTree((await toBody('a(); b();')).block);
        const after = makeBlockTree((await toBody('\n\n   a();   b();')).block);
        assert.equal(before.hash, after.hash);
    });

    it('maps the roots and identical subtrees', async () => {
        const root1 = makeBlockTree((await toBody('a(); if (x) { b(); }')).block);
        const root2 = makeBlockTree((await toBody('if (x) { b(); } a();')).block);
        const mappings = matchTrees(root1, root2);
        assert.equal(mappings.src.get(root1), root2);
        assert.equal(mappings.match.get(root1), 'slot');
        root1.children.forEach((c) => assert.equal(mappings.src.get(c)?.hash, c.hash));
    });
});

describe('gumtree block diff', () => {
    it('reports an unchanged body as unchanged statements', async () => {
        const diffs = await diffBodies('a(); return;', 'a();\n return;');
        assert.deepEqual(statuses(diffs), [
            ['expression', 'unchanged'],
            ['return', 'unchanged'],
        ]);
    });

    it('reports added and removed statements in place', async () => {
        assert.deepEqual(statuses(await diffBodies('a(); b();', 'a(); c(); b();')), [
            ['expression', 'unchanged'],
            ['expression', 'added'],
            ['expression', 'unchanged'],
        ]);
        assert.deepEqual(statuses(await diffBodies('a(); b(); c();', 'a(); c();')), [
            ['expression', 'unchanged'],
            ['expression', 'removed'],
            ['expression', 'unchanged'],
        ]);
    });

    it('reports a reordered statement as moved', async () => {
        const diffs = await diffBodies('a(); b(); c();', 'c(); a(); b();');
        assert.deepEqual(
            diffs.map((d) => [d.status, d.index]),
            [
                ['moved', { before: 2, after: 0 }],
                ['unchanged', { before: 0, after: 1 }],
                ['unchanged', { before: 1, after: 2 }],
            ],
        );
    });

    it('detects a statement moved into another block', async () => {
        const diffs = await diffBodies('a(); if (x) { b(); }', 'if (x) { a(); b(); }');
        const moved = flatten(diffs).filter((d) => d.status === 'moved');
        assert.equal(moved.length, 1);
        assert.ok(moved[0]!.status === 'moved');
        assert.equal(moved[0]!.label, 'expression');
        assert.deepEqual(moved[0]!.from.parent, 'block');
        assert.equal(moved[0]!.from.index, 0);
        // 移動元には removed を出さない
        assert.equal(flatten(diffs).filter((d) => d.status === 'removed').length, 0);
    });

    it('reports a value change as changed with fields', async () => {
        const diffs = await diffBodies('Integer i = 1; break;', 'Integer i = 2; break;');
        assert.deepEqual(statuses(diffs), [
            ['localVariable', 'changed'],
            ['break', 'unchanged'],
        ]);
        const literal = flatten(diffs).find((d) => d.label === 'literal');
        assert.ok(literal && literal.status === 'changed');
        assert.deepEqual(literal.fields.value, { status: 'changed', before: '1', after: '2' });
    });

    it('matches a container by shared descendants (bottom-up)', async () => {
        const diffs = await diffBodies(
            'if (x) { a(); b(); c(); } d();',
            'd(); if (y) { a(); b(); c(); }',
        );
        const ifDiff = diffs.find((d) => d.label === 'if');
        assert.ok(ifDiff && ifDiff.status === 'changed');
        assert.equal(ifDiff.match, 'similar');
        // 条件だけが変わり、中のブロックはそのまま
        assert.deepEqual(
            flatten(ifDiff.children)
                .filter((d) => d.label === 'ifCondition' || d.label === 'block')
                .map((d) => [d.label, d.status]),
            [
                ['ifCondition', 'changed'],
                ['block', 'unchanged'],
            ],
        );
    });

    it('does not report reordered SELECT fields as moved', async () => {
        const diffs = await diffBodies(
            "List<Account> l = [SELECT Id, Name FROM Account WHERE Name = 'a'];",
            "List<Account> l = [SELECT Name, Id FROM Account WHERE Name = 'a'];",
        );
        assert.equal(flatten(diffs).filter((d) => d.status === 'moved').length, 0);
    });

    it('uses GumTree to pair block entries and returns typed list diffs', () => {
        assert.deepEqual(makeBlockDiff([], []), []);
        assert.deepEqual(
            makeBlockDiff(['a();'], ['a();', 'b();']).map(({ status, index }) => [status, index]),
            [
                ['unchanged', { before: 0, after: 0 }],
                ['added', 1],
            ],
        );
    });
});

describe('expression and statement diff entry points', () => {
    it('compares nested expression nodes through makeExpressionDiff', async () => {
        const before = await toExpression('1 + 2');
        const after = await toExpression('1 + 3');
        const diffs: BaseExpressionJsonDiff = makeExpressionDiff(before, after);
        const literal = flattenTypedDiff(diffs).find(
            (diff) => diff.before === '2' && diff.after === '3',
        );

        assert.ok(literal && literal.status === 'changed');
    });

    it('compares one statement and its nested expression through makeStatementDiff', async () => {
        const before = (await toBody('Integer value = 1;')).block[0] as StatementJson;
        const after = (await toBody('Integer value = 2;')).block[0] as StatementJson;
        const diff = makeStatementDiff(before, after);

        assert.ok('kind' in diff);
        assert.equal(diff.kind, 'localVariable');
        assert.equal(diff.status, 'changed');
        assert.ok(
            flattenTypedDiff(diff).some(
                (diff) => diff.status === 'changed' && diff.before === '1' && diff.after === '2',
            ),
        );
    });

    it('diffs primitive statement arrays element by element', () => {
        const before: UpsertStatementJson = {
            kind: 'upsert',
            sourceKeys: { objectKey: 'before', sourceKey: 'before-source' },
            field: 'Account',
            key: ['ExternalId__c'],
        };
        const after: UpsertStatementJson = {
            kind: 'upsert',
            sourceKeys: { objectKey: 'after', sourceKey: 'after-source' },
            field: 'Account',
            key: ['ExternalId__c', 'Namespace__c'],
        };
        const diff: StatementJsonDiff<UpsertStatementJson> | StatementReplacementDiff =
            makeStatementDiff(before, after);
        const keyList = 'kind' in diff && 'fields' in diff ? diff.fields.key : undefined;

        assert.ok(Array.isArray(keyList));
        assert.deepEqual(
            keyList.map((item) => item.status),
            ['unchanged', 'added'],
        );
    });

    it('uses the expression diff for field initializers', async () => {
        const before = await toJson('public class Foo { Integer value = 1; }', unitRules.cls);
        const after = await toJson('public class Foo { Integer value = 2; }', unitRules.cls);
        const [beforeField] = find(before.json, (node) => node.kind === 'field');
        const [afterField] = find(after.json, (node) => node.kind === 'field');
        const diff = makeFieldDeclarationDiff(beforeField, afterField);

        assert.ok(diff.status === 'changed' && 'fields' in diff);
        assert.ok(
            flattenTypedDiff(diff).some(
                (item) => item.status === 'changed' && item.before === '1' && item.after === '2',
            ),
        );
    });
});

describe('unit diff', () => {
    it('diffs an anonymous unit: declarations by key, statements by gumtree', async () => {
        const before = (await toJson('void run() {} run(); b();', unitRules.anonymous)).json;
        const after = (await toJson('void run() { a(); } b(); run();', unitRules.anonymous)).json;

        const diff = makeAnonymousUnitDiff(before, after);
        assert.ok('member' in diff.block);
        assert.deepEqual(
            diff.block.member.map((d) => [d.kind, d.status]),
            [['method', 'changed']],
        );
        assert.deepEqual(
            diff.block.statement.map((d) => d.status),
            ['unchanged', 'moved'],
        );
    });

    it('compares trigger cases as a set', async () => {
        const source = (cases: string) => `trigger T on Account (${cases}) { a(); }`;
        const before = (await toJson(source('before insert, after update'), unitRules.trigger))
            .json;
        const after = (await toJson(source('after update, before delete'), unitRules.trigger)).json;

        const diff = makeTriggerUnitDiff(before, after);
        assert.deepEqual(
            diff.case.map((d) => d.status),
            ['removed', 'unchanged', 'added'],
        );
        assert.deepEqual(diff.name, { status: 'unchanged', value: 'T' });
    });

    it('diffs a cls type declaration with its modifiers', async () => {
        const before = (await toJson('public class Foo { }', unitRules.cls)).json;
        const after = (await toJson('global class Foo { }', unitRules.cls)).json;
        const { fileType: _b, ...b } = before;
        const { fileType: _a, ...a } = after;

        const diff = makeTypeDeclarationDiff(b, a);
        assert.equal(diff.status, 'changed');
        assert.ok('modifier' in diff);
        assert.deepEqual(
            diff.modifier.map((m) => m.status),
            ['removed', 'added'],
        );
    });

    it('replaces the whole value when the declaration kind changes', async () => {
        const before = (await toJson('public class Foo { }', unitRules.cls)).json;
        const after = (await toJson('public interface Foo { }', unitRules.cls)).json;
        const { fileType: _b, ...b } = before;
        const { fileType: _a, ...a } = after;

        const diff = makeTypeDeclarationDiff(b, a);
        assert.deepEqual(diff.kind, { before: 'class', after: 'interface' });
    });
});

describe('gumtree diff on the example file', () => {
    const load = () =>
        readFile(
            new URL('../../docs/examples/apex/samples/syntax/ParserTest.cls', import.meta.url),
            'utf8',
        );

    it('reports nothing but unchanged when only the position changes', async () => {
        const source = await load();
        const before = await toJson(source, unitRules.cls);
        const after = await toJson(`\n\n${source}`, unitRules.cls);
        const { fileType: _b, ...b } = before.json;
        const { fileType: _a, ...a } = after.json;

        const diff = makeTypeDeclarationDiff(b, a, {
            before: before.sourceObjects,
            after: after.sourceObjects,
        });
        assert.equal(diff.status, 'unchanged');
    });

    it('reports reordered statements of every method without added / removed', async () => {
        const { json } = await toJson(await load(), unitRules.cls);
        const methods = find(json, (n) => n.kind === 'method' && Array.isArray(n.block));
        assert.ok(methods.length > 0);

        methods.forEach((method) => {
            const block = method.block as unknown[];
            const diffs = flatten(makeGumTreeBlockDiff(block, [...block].reverse()));
            assert.equal(
                diffs.filter((d) => d.status === 'added' || d.status === 'removed').length,
                0,
                method.name,
            );
        });
    });
});

describe('typed statement diff follows the policy', () => {
    const blockDiff = async (before: string, after: string) =>
        makeBlockDiff((await toBody(before)).block, (await toBody(after)).block);
    const fieldsOf = (value: unknown) => (value as { fields: Record<string, any> }).fields;

    it('compares a statement moved out of a nested block with its original statement', async () => {
        const [moved] = await blockDiff('if (x) { a(1); } b();', 'a(1); if (x) { } b();');

        // 移動元の文と比べるので、中身は同じ (moved) になる。kind / sourceKeys は中身 (value) から分ける
        const item = moved as Record<string, any>;
        assert.equal(item.status, 'moved');
        assert.equal(item.kind, 'expression');
        assert.equal(item.sourceKeys.objectKey.before, undefined, 'objectKey は同じなので単体');
        assert.ok(!('kind' in item.value) && !('sourceKeys' in item.value));
    });

    it('diffs new expressions structurally even though they have an init kind', async () => {
        const diff = await blockDiff(
            "Map<String, Integer> m = new Map<String, Integer>{ 'a' => 1 };",
            "Map<String, Integer> m = new Map<String, Integer>{ 'a' => 2 };",
        );
        const init = flattenTypedDiff(diff).find((item) => 'collection' in fieldsOfOrEmpty(item));

        assert.ok(init, 'new Map の差分が fields (collection / generic / init) を持つ');
        assert.ok(
            flattenTypedDiff(diff).some(
                (item) => item.status === 'changed' && item.before === '1' && item.after === '2',
            ),
        );
    });

    it('treats the literals of a when clause as a set', async () => {
        const diff = await blockDiff(
            'switch on x { when 1, 2 { a(); } when else { b(); } }',
            'switch on x { when 2, 1 { a(); } when else { b(); } }',
        );
        const when = fieldsOf(fieldsOf(diff[0]).block[0]);
        const literals = fieldsOf(when.condition).condition as { status: string }[];

        assert.deepEqual(
            literals.map((item) => item.status),
            ['unchanged', 'unchanged'],
        );
    });

    it('pairs try / catch / finally clauses only with the same kind of clause', async () => {
        const diff = await blockDiff(
            'try { a(); } finally { c(); }',
            'try { a(); } catch (Exception e) { d(); } finally { c(1); }',
        );
        const clauses = fieldsOf(diff[0]).block as { status: string; index: unknown }[];

        assert.deepEqual(
            clauses.map((item) => [item.status, item.index]),
            [
                ['unchanged', { before: 0, after: 0 }],
                ['added', 1],
                ['changed', { before: 1, after: 2 }],
            ],
        );
    });

    it('pairs local variables by name', async () => {
        const diff = await blockDiff('Integer a = 1, b = 2;', 'Integer b = 2, a = 3;');
        const variants = fieldsOf(fieldsOf(diff[0]).variable).variants as {
            status: string;
            match: string;
            index: unknown;
        }[];

        assert.deepEqual(
            variants.map((item) => [item.status, item.match, item.index]),
            [
                ['changed', 'key', { before: 0, after: 1 }],
                ['unchanged', 'identical', { before: 1, after: 0 }],
            ],
        );
    });
});

const fieldsOfOrEmpty = (item: Record<string, unknown>): Record<string, unknown> =>
    typeof item.fields === 'object' && item.fields !== null
        ? (item.fields as Record<string, unknown>)
        : {};
