import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { ALL_KINDS, countDiffKinds, runDiff } from '../../docs/examples/apex-diff/run-diff';

/**
 * docs/examples/apex-diff の before / after を本番と同じ流れで変換して比べ、
 * README.md に書いた期待どおりの差分になるかを確かめる。
 */

type Diffs = Awaited<ReturnType<typeof runDiff>>['diffs'];
type Node = Record<string, any>;

const isRecord = (value: unknown): value is Node =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/** 差分の木から、status を持つノードを前順で集める (target は元の JSON なので除く) */
const collect = (diff: unknown, out: Node[] = []): Node[] => {
    if (Array.isArray(diff)) {
        diff.forEach((d) => collect(d, out));
    } else if (isRecord(diff)) {
        if (typeof diff.status === 'string') {
            out.push(diff);
        }
        Object.entries(diff).forEach(([key, value]) => {
            if (key !== 'target' && key !== 'value') {
                collect(value, out);
            }
        });
    }
    return out;
};

const kindOf = (node: Node) => node.kind ?? node.label;

describe('diff samples (docs/examples/apex-diff)', () => {
    let diffs: Diffs;
    const fileDiff = (file: string) => {
        const diff = diffs.find((d) => d.filePath === file);
        assert.ok(diff, file);
        return diff;
    };
    const contentNodes = (file: string) => {
        const diff = fileDiff(file);
        assert.ok('content' in diff && diff.content, file);
        return collect(diff.content);
    };

    before(async () => {
        ({ diffs } = await runDiff());
    });

    it('matches files by name and reports the file status', () => {
        assert.deepEqual(Object.fromEntries(diffs.map((d) => [d.filePath, d.status])), {
            'AccountService.cls': 'changed',
            'AccountTrigger.trigger': 'changed',
            'Broken.cls': 'changed',
            'Level.cls': 'changed',
            'OldHelper.cls': 'removed',
            'Shape.cls': 'changed',
            'Unchanged.cls': 'unchanged',
            'script.apex': 'changed',
            'NewHelper.cls': 'added',
        });
    });

    it('reports every JsonType / StructureJsonType kind as a diff node', () => {
        const counts = new Map<string, number>();
        countDiffKinds(diffs, counts);
        const missing = Object.values(ALL_KINDS)
            .flat()
            .filter((kind) => !counts.has(kind));
        assert.deepEqual(missing, []);
    });

    it('class: members by key, modifiers outside the objectKey', () => {
        const diff = fileDiff('AccountService.cls');
        assert.ok('content' in diff && diff.content && 'fields' in diff.content);
        const members = (diff.content.fields as Node).block as Node[];

        // 修飾子だけの変更 (private → protected) は changed で、修飾子の差分を持つ
        const nameField = members.find(
            (n) => n.kind === 'field' && n.status === 'changed' && n.modifier?.length === 2,
        );
        assert.deepEqual(
            nameField?.modifier.map((m: Node) => [m.status, m.value.name]),
            [
                ['removed', 'PRIVATE'],
                ['added', 'PROTECTED'],
            ],
        );

        // オーバーロードの追加、メソッドの削除・追加
        assert.deepEqual(
            members
                .filter((n) => n.status === 'added' || n.status === 'removed')
                .map((n) => [n.status, n.kind, n.value.name ?? null]),
            [
                ['removed', 'field', null],
                ['removed', 'method', 'loop'],
                ['added', 'field', null],
                ['added', 'method', 'calc'],
                ['added', 'method', 'report'],
            ],
        );
    });

    it('annotation: arguments are compared by key', () => {
        const annotations = contentNodes('AccountService.cls').filter(
            (n) => n.kind === 'modifier' && n.status === 'changed',
        );
        assert.deepEqual(
            annotations.map((n) => [n.name, n.fields.arg.map((a: Node) => [a.key, a.status])]),
            [
                ['Future', [['callout', 'changed']]],
                ['RestResource', [['urlMapping', 'changed']]],
            ],
        );
    });

    it('field: the initial value is diffed as an expression tree', () => {
        const literal = contentNodes('AccountService.cls').find(
            (n) => n.label === 'literal' && n.fields?.value?.before === '100',
        );
        assert.deepEqual(literal?.fields.value, { status: 'changed', before: '100', after: '200' });
    });

    it('statement: a statement moved from finally into catch is reported once as moved', () => {
        const nodes = contentNodes('AccountService.cls');
        const moved = nodes.find((n) => n.status === 'moved' && n.label === 'expression');
        assert.equal(moved?.from.parent, 'block');
        assert.ok(nodes.some((n) => n.label === 'try.finally' && n.status === 'removed'));
    });

    it('soql: reordered SELECT fields are not a diff, changed clauses are', () => {
        const nodes = contentNodes('AccountService.cls');
        const syncSelect = nodes.filter(
            (n) => n.label === 'selectEntry' && n.status !== 'unchanged' && n.status !== 'added',
        );
        // SELECT Id, Name → SELECT Name, Id は差分にならない。ALL ROWS のクエリの Id → Name だけが changed
        assert.equal(syncSelect.length, 1);
        assert.deepEqual(
            nodes.filter((n) => n.label === 'groupBy').map((n) => n.fields.mode),
            [{ status: 'changed', before: 'ROLLUP', after: 'CUBE' }],
        );
    });

    it('trigger: cases as a set, a small expression moved into a new condition', () => {
        const nodes = contentNodes('AccountTrigger.trigger');
        assert.deepEqual(
            nodes.filter((n) => n.kind === 'triggerCase').map((n) => n.status),
            ['removed', 'unchanged', 'added'],
        );
        const moved = nodes.find((n) => n.status === 'moved');
        assert.equal(moved?.label, 'memberAccess:object');
        assert.equal(moved?.from.parent, 'ifCondition');
    });

    it('anonymous: declarations and statements are diffed separately', () => {
        const diff = fileDiff('script.apex');
        assert.ok('content' in diff && diff.content && 'block' in diff.content);
        const block = diff.content.block;
        assert.ok('member' in block);
        assert.deepEqual(
            block.member.map((m) => [m.kind, m.status]),
            [
                ['field', 'changed'],
                ['method', 'changed'],
            ],
        );
        assert.deepEqual(
            block.statement.map((s) => s.status),
            ['moved', 'changed', 'unchanged'],
        );
    });

    it('error: a broken statement becomes an error node, and the syntax errors are reported', () => {
        const diff = fileDiff('Broken.cls');
        assert.ok(!Array.isArray(diff.resolvedError) && diff.status === 'changed');
        assert.equal(diff.resolvedError.after.length, 2);
        assert.ok(
            contentNodes('Broken.cls').some(
                (n) => n.label === 'error:localVariable' && n.status === 'added',
            ),
        );
    });

    it('cls: a kind change replaces the whole declaration, position-only changes are unchanged', () => {
        const shape = fileDiff('Shape.cls');
        assert.ok('content' in shape && shape.content);
        assert.deepEqual((shape.content as Node).kind, { before: 'interface', after: 'class' });

        const unchanged = fileDiff('Unchanged.cls');
        assert.ok('content' in unchanged && unchanged.content);
        assert.equal((unchanged.content as Node).status, 'unchanged');
    });

    it('enum: constants are diffed as a sequence', () => {
        const added = contentNodes('Level.cls').filter((n) => n.status === 'added');
        assert.deepEqual(
            added.map((n) => [n.kind, n.index, n.value.name]),
            [['enumConstant', 1, 'MEDIUM']],
        );
    });
});
