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

/** 差分の木から status を持つノードを前順で集める */
const collect = (diff: unknown, out: Node[] = []): Node[] => {
    if (Array.isArray(diff)) {
        diff.forEach((d) => collect(d, out));
    } else if (isRecord(diff)) {
        if (typeof diff.status === 'string') {
            out.push(diff);
        }
        Object.values(diff).forEach((value) => collect(value, out));
    }
    return out;
};

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
            // クラス・トリガーのメタデータ (中身は test/parser/apex-meta.test.ts で確かめる)
            'AccountService.cls-meta.xml': 'changed',
            'AccountTrigger.trigger-meta.xml': 'changed',
            'Broken.cls-meta.xml': 'changed',
            'OldHelper.cls-meta.xml': 'removed',
            'Unchanged.cls-meta.xml': 'unchanged',
            'NewHelper.cls-meta.xml': 'added',
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
            (n) => n.kind === 'annotation' && n.status === 'changed',
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
            (n) => n.before === '100' && n.after === '200',
        );
        assert.deepEqual(literal, { status: 'changed', before: '100', after: '200' });
    });

    it('statement: a statement moved from finally into catch is reported once as moved', () => {
        const nodes = contentNodes('AccountService.cls');
        const moved = nodes.find((n) => n.status === 'moved' && n.kind === 'expression');
        assert.equal(moved?.from.parent, 'block');
        assert.ok(nodes.some((n) => n.status === 'removed' && n.value?.condition === 'finally'));
    });

    it('soql: reordered SELECT fields are not a diff, changed clauses are', () => {
        const nodes = contentNodes('AccountService.cls');
        const syncSelect = nodes.filter((n) => n.kind === 'selectEntry' && n.status === 'changed');
        // SELECT Id, Name → SELECT Name, Id は差分にならない。ALL ROWS の Id → Name は集合要素の削除・追加。
        assert.equal(syncSelect.length, 0);
        assert.deepEqual(
            nodes
                .filter(
                    (n) =>
                        n.kind === 'selectEntry' &&
                        (n.status === 'removed' || n.status === 'added') &&
                        n.value?.type === 'field',
                )
                .map((n) => [n.status, n.value.field]),
            [
                ['removed', ['Id']],
                ['added', ['Name']],
            ],
        );
        assert.ok(nodes.some((n) => n.kind === 'subQuery' && n.status === 'changed'));
        assert.deepEqual(
            nodes.filter((n) => n.kind === 'groupBy').map((n) => n.fields.mode),
            [{ status: 'changed', before: 'ROLLUP', after: 'CUBE' }],
        );
    });

    it('trigger: cases as a set, condition expressions retain their typed shape', () => {
        const nodes = contentNodes('AccountTrigger.trigger');
        assert.deepEqual(
            nodes.filter((n) => n.kind === 'triggerCase').map((n) => n.status),
            ['removed', 'unchanged', 'added'],
        );
        const condition = nodes.find((n) => n.kind === 'ifCondition' && n.status === 'changed');
        assert.ok(condition && 'fields' in condition);
        const expression = condition.fields.condition;
        assert.equal(expression.status, 'changed');
        // kind / sourceKeys は中身から分ける。after の && の式は JSON ノードではないので before 側だけを持つ
        assert.deepEqual(expression.kind, { before: 'memberAccess' });
        assert.equal(expression.after.operator, '&&');
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
            contentNodes('Broken.cls').some((n) => n.status === 'added' && n.kind === 'error'),
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
