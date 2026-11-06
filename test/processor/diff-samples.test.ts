import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { ALL_KINDS, countDiffKinds, runDiff } from '../../docs/examples/apex/scripts/run-diff';

/**
 * docs/examples/repository の before / after を本番と同じ流れで変換して比べ、
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

describe('diff samples (docs/examples/repository)', () => {
    let diffs: Diffs;
    const unitDiff = (id: string) => {
        const diff = diffs.find((d) => d.id === id);
        assert.ok(diff, id);
        return diff;
    };
    /** 単位のソースの中身の差分 (makeUnitContentDiff の結果) を { content } の形で返す */
    const fileDiff = (id: string): Node => {
        const content = (unitDiff(id).content as Node | undefined)?.fields?.source?.fields?.content;
        assert.ok(content, id);
        return { content };
    };
    const contentNodes = (id: string) => collect(fileDiff(id).content);

    before(async () => {
        ({ diffs } = await runDiff());
    });

    it('単位 (クラス・トリガーはソースと -meta.xml を 1 つ、匿名 Apex は 1 ファイル) を id で対応付ける', () => {
        assert.deepEqual(
            diffs.map((d) => {
                const fields = (d.content as Node | undefined)?.fields;
                return [d.id, d.status, fields?.source?.status, fields?.meta?.status];
            }),
            [
                // Apex の構文のサンプル (Parser*・parser.apex・broken.apex) は before / after の両方にあり、変わらない
                ['anonymous_broken', 'unchanged', undefined, undefined],
                ['anonymous_parser', 'unchanged', undefined, undefined],
                ['anonymous_script', 'changed', 'changed', undefined],
                // ソースと -meta.xml の両方が変わったクラス (メタデータの中身は test/parser/apex-meta.test.ts で確かめる)
                ['class_AccountService', 'changed', 'changed', 'changed'],
                ['class_Broken', 'changed', 'changed', 'changed'],
                ['class_Level', 'changed', 'changed', undefined],
                ['class_NewHelper', 'added', undefined, undefined],
                ['class_OldHelper', 'removed', undefined, undefined],
                ['class_ParserEnum', 'unchanged', undefined, undefined],
                ['class_ParserInterface', 'unchanged', undefined, undefined],
                ['class_ParserTest', 'unchanged', undefined, undefined],
                ['class_Shape', 'changed', 'changed', undefined],
                ['class_Unchanged', 'unchanged', undefined, undefined],
                ['trigger_AccountTrigger', 'changed', 'changed', 'changed'],
                ['trigger_ParserTrigger', 'unchanged', undefined, undefined],
            ],
        );
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
        const diff = fileDiff('class_AccountService');
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
        const annotations = contentNodes('class_AccountService').filter(
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
        const literal = contentNodes('class_AccountService').find(
            (n) => n.before === '100' && n.after === '200',
        );
        assert.deepEqual(literal, { status: 'changed', before: '100', after: '200' });
    });

    it('statement: a statement moved from finally into catch is reported once as moved', () => {
        const nodes = contentNodes('class_AccountService');
        const moved = nodes.find((n) => n.status === 'moved' && n.kind === 'expression');
        assert.equal(moved?.from.parent, 'block');
        assert.ok(nodes.some((n) => n.status === 'removed' && n.value?.condition === 'finally'));
    });

    it('soql: reordered SELECT fields are not a diff, changed clauses are', () => {
        const nodes = contentNodes('class_AccountService');
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
        const nodes = contentNodes('trigger_AccountTrigger');
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
        const diff = fileDiff('anonymous_script');
        assert.ok('content' in diff && diff.content && 'block' in diff.content);
        const block = diff.content.block;
        assert.ok('member' in block);
        assert.deepEqual(
            block.member.map((m: { kind: string; status: string }) => [m.kind, m.status]),
            [
                ['field', 'changed'],
                ['method', 'changed'],
            ],
        );
        assert.deepEqual(
            block.statement.map((s: { status: string }) => s.status),
            ['moved', 'changed', 'unchanged'],
        );
    });

    it('error: a broken statement becomes an error node, and the syntax errors are reported', () => {
        // 単位の resolvedError は、ソースの構文エラーと -meta.xml を読めなかったものをまとめて持つ (B. 集合)
        const diff = unitDiff('class_Broken');
        assert.deepEqual(
            diff.resolvedError
                .filter((e) => e.status === 'added')
                .map((e) => (e as Node).value.filePath),
            ['Broken.cls', 'Broken.cls', 'Broken.cls-meta.xml'],
        );
        assert.ok(
            contentNodes('class_Broken').some((n) => n.status === 'added' && n.kind === 'error'),
        );
    });

    it('cls: a kind change replaces the whole declaration, position-only changes are unchanged', () => {
        const shape = fileDiff('class_Shape');
        assert.ok('content' in shape && shape.content);
        assert.deepEqual((shape.content as Node).kind, { before: 'interface', after: 'class' });

        const unchanged = unitDiff('class_Unchanged');
        assert.equal(unchanged.status, 'unchanged');
        assert.equal((unchanged.content as Node).status, 'unchanged');
    });

    it('enum: constants are diffed as a sequence', () => {
        const added = contentNodes('class_Level').filter((n) => n.status === 'added');
        assert.deepEqual(
            added.map((n) => [n.kind, n.index, n.value.name]),
            [['enumConstant', 1, 'MEDIUM']],
        );
    });
});
