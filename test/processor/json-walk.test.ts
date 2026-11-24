import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseApexUnitFiles } from '../../src/analyzer/parser/Apex/unit';
import { childNodesOf, walkJson } from '../../src/analyzer/processor/commons/node';
import { type ApexNodeJson, type JsonType, isJsonType } from '../../src/analyzer/types';

// JSON の木の共通の走査 (src/analyzer/processor/commons/node.ts。docs/plan.md 5.1)

const SOURCE = `public class A {
    public Integer count;
    public void run(List<Account> accounts) {
        for (Account a : accounts) {
            if (a.Name == null) { log(a); }
        }
        try { save(accounts); } catch (Exception e) { log(e); }
        List<Account> found = [SELECT Id FROM Account WHERE Name = 'x'];
    }
    void log(Object o) {}
    void save(List<Account> accounts) {}
}`;

const parseRoot = async (): Promise<ApexNodeJson> => {
    const unit = await parseApexUnitFiles({
        unitType: 'class',
        name: 'A',
        filePath: 'A.cls',
        source: { fileName: 'A.cls', source: SOURCE },
    });
    assert.deepEqual(unit.resolvedError, []);
    const parsed = unit.result.base.source;
    assert.ok(parsed && parsed.fileType !== 'error');
    return parsed.content as ApexNodeJson;
};

/** 木の中のすべてのノード (childNodesOf を使わずに数える) */
const allNodesOf = (value: unknown): JsonType<string>[] => {
    const found: JsonType<string>[] = [];
    const visit = (v: unknown): void => {
        if (Array.isArray(v)) return v.forEach(visit);
        if (v === null || typeof v !== 'object') return;
        if (isJsonType(v)) found.push(v);
        for (const [key, item] of Object.entries(v)) {
            if (key !== 'sourceKeys') visit(item);
        }
    };
    visit(value);
    return found;
};

describe('childNodesOf と walkJson', () => {
    it('すべてのノードを 1 回ずつ訪ねる', async () => {
        const root = await parseRoot();
        const visited: JsonType<string>[] = [];
        walkJson<ApexNodeJson>(root, { enterAny: (node) => void visited.push(node) });
        assert.equal(visited.length, allNodesOf(root).length);
        assert.equal(new Set(visited).size, visited.length);
    });

    it('子は直下のノードだけ (孫は含まない)', async () => {
        const root = await parseRoot();
        const children = childNodesOf(root);
        assert.ok(children.length > 0);
        const grandchildren = new Set(children.flatMap(childNodesOf));
        assert.ok(children.every((child) => !grandchildren.has(child)));
    });

    it('kind ごとのハンドラーで型が絞られ、親の連鎖が分かる', async () => {
        const root = await parseRoot();
        const methods: string[] = [];
        const ifParents: string[][] = [];
        walkJson<ApexNodeJson>(root, {
            enter: {
                method: (node) => void methods.push(node.name),
                ifBranch: (_node, { parents }) =>
                    void ifParents.push(parents.map((parent) => parent.kind)),
            },
        });
        assert.deepEqual(methods, ['run', 'log', 'save']);
        assert.equal(ifParents.length, 1);
        assert.equal(ifParents[0]?.[0], root.kind);
        assert.ok(ifParents[0]?.includes('method'));
    });

    it('enter が返した文脈は子にだけ引き継がれる', async () => {
        const root = await parseRoot();
        type State = { inLoop: boolean; inTry: boolean };
        const states: State[] = [];
        walkJson<ApexNodeJson, State>(
            root,
            {
                enter: {
                    forEach: (_node, { state }) => ({ state: { ...state, inLoop: true } }),
                    tryClause: (_node, { state }) => ({ state: { ...state, inTry: true } }),
                    call: (_node, { state }) => void states.push(state),
                },
            },
            { inLoop: false, inTry: false },
        );
        assert.equal(states.length, 3);
        const [inLoop, inTry, inCatch] = states;
        assert.deepEqual(inLoop, { inLoop: true, inTry: false });
        assert.deepEqual(inTry, { inLoop: false, inTry: true });
        assert.equal(inCatch?.inLoop, false);
    });

    it("'skip' は子を辿らず、leave は呼ぶ", async () => {
        const root = await parseRoot();
        const order: string[] = [];
        walkJson<ApexNodeJson>(root, {
            enter: { method: () => 'skip' },
            enterAny: (node) => void order.push(`>${node.kind}`),
            leaveAny: (node) => void order.push(`<${node.kind}`),
        });
        assert.ok(!order.includes('>call'));
        assert.equal(order.filter((e) => e === '>method').length, 3);
        assert.equal(order.filter((e) => e === '<method').length, 3);
        assert.equal(order[0], `>${root.kind}`);
        assert.equal(order[order.length - 1], `<${root.kind}`);
    });
});

describe('kind が Object の組み込みのプロパティと同じ名前のとき', () => {
    it('表にない kind (constructor) は組み込みの関数を呼ばない', async () => {
        const unit = await parseApexUnitFiles({
            unitType: 'class',
            name: 'B',
            filePath: 'B.cls',
            source: {
                fileName: 'B.cls',
                source: 'public class B { public B() { run(); } void run() {} }',
            },
        });
        const parsed = unit.result.base.source;
        assert.ok(parsed && parsed.fileType !== 'error');
        const root = parsed.content as ApexNodeJson;
        const calls: boolean[] = [];
        walkJson<ApexNodeJson, boolean>(
            root,
            {
                enter: {
                    method: () => ({ state: true }),
                    call: (_node, { state }) => void calls.push(state),
                },
            },
            false,
        );
        // constructor の enter に Object() が呼ばれると、文脈が undefined に変わる
        assert.deepEqual(calls, [false]);

        const constructors: string[][] = [];
        walkJson<ApexNodeJson>(root, {
            enter: { constructor: (node) => void constructors.push(node.name) },
        });
        assert.deepEqual(constructors, [['B']]);
    });
});
