import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { runDiff } from '../../docs/examples/lwc/scripts/run-diff';
import { makeLwcBundleDiffs } from '../../src/analyzer/processor/Lwc/diff/bundle';

/**
 * docs/examples/repository の lwc の before / after を本番と同じ流れ (LwcParser.parseLwcBundle) で読んで比べ、
 * docs/lwc-implementation.md の分類どおりの差分になるかを確かめる。
 */

type Node = Record<string, any>;
type Result = Awaited<ReturnType<typeof runDiff>>;

let result: Result;
const unit = (id: string) => result.diffs.find((d) => d.id === id)!;
/** バンドルの中のモジュールの差分の fields */
const moduleFields = (id: string, fileName: string): Node => {
    const modules = (unit(id).content as Node).fields.modules as Node[];
    const entry = modules.find((m) => m.fields?.fileName.value === fileName)!;
    return entry.fields.module.fields;
};
/** 配列の差分から、名前 (value / fields の name) で要素を探す */
const byName = (list: Node[], name: string, key = 'name'): Node | undefined =>
    list.find((item) => {
        const v = item.value?.[key] ?? item.fields?.[key];
        return v === name || v?.value === name || v?.after === name;
    });

describe('LWC diff samples (docs/examples/repository の lwc)', () => {
    before(async () => {
        result = await runDiff();
    });

    it('バンドルはバンドル名で対応付く (追加・削除・変更なし・変更)', () => {
        assert.deepEqual(
            result.diffs.map((d) => [d.id, d.status]),
            [
                ['accountList', 'changed'],
                ['accountRow', 'unchanged'],
                ['broken', 'unchanged'],
                ['newBanner', 'added'],
                ['oldBanner', 'removed'],
                ['utils', 'changed'],
            ],
        );
    });

    it('import は import 元で D. キー対応', () => {
        const imports = moduleFields('accountList', 'accountList.ts').imports as Node[];
        const changed = imports.filter((i) => i.status !== 'unchanged');
        assert.deepEqual(
            changed.map((i) => [i.status, i.value.source]),
            [
                ['removed', '@salesforce/label/c.AccountListTitle'],
                ['added', '@salesforce/apex/AccountController.updateAccount'],
            ],
        );
    });

    it('メンバーは名前で D. キー対応し、中はプロパティごとに比べる', () => {
        const block = moduleFields('accountList', 'accountList.ts').component.fields
            .block as Node[];
        const status = Object.fromEntries(
            block
                .filter((m) => m.status !== 'unchanged')
                .map((m) => [m.value?.name ?? m.fields.name.value, m.status]),
        );
        assert.deepEqual(status, {
            title: 'changed',
            maxRows: 'changed',
            wiredAccounts: 'changed',
            isTable: 'removed',
            handleSelect: 'changed',
            industry: 'added',
            handleSave: 'added',
        });

        const title = byName(block, 'title')!;
        // 初期値は式 (ソースの文字列は持たない) を値として比べる
        assert.equal(title.fields.init.status, 'changed');
        assert.deepEqual(title.fields.init.kind, { before: 'jsIdentifier', after: 'jsString' });
        assert.deepEqual(
            [title.fields.init.before, title.fields.init.after],
            [{ name: 'TITLE_LABEL' }, { value: 'Accounts' }],
        );
        assert.deepEqual(
            title.fields.references.map((r: Node) => [r.status, r.value.local]),
            [['removed', 'TITLE_LABEL']],
        );
    });

    it('@wire の設定はキーで対応付き、追加したキーだけが added になる', () => {
        const block = moduleFields('accountList', 'accountList.ts').component.fields
            .block as Node[];
        const wire = byName(block, 'wiredAccounts')!.fields.modifier.fields.decorator[0];
        assert.equal(wire.kind, 'lwcDecorator');
        const config = wire.fields.wire.fields.config as Node[];
        assert.deepEqual(
            config.map((c) => [c.status, c.value?.key]),
            [
                ['unchanged', 'parentId'],
                ['unchanged', 'limitSize'],
                ['added', 'industry'],
            ],
        );
    });

    it('イベントの属性 (composed) の変化は、本体の文の差分 (GumTree) に出る', () => {
        // イベント (段階 5 までの events) は JSON に持たず解析で出すので、Diff は文の中の式の変化になる
        const block = moduleFields('accountList', 'accountList.ts').component.fields
            .block as Node[];
        const handleSelect = byName(block, 'handleSelect')!;
        assert.equal(handleSelect.fields.events, undefined);
        const json = JSON.stringify(handleSelect.fields.block);
        assert.ok(json.includes('"jsBoolean"'), json);
        assert.ok(/"before":false/.test(json) && /"after":true/.test(json), json);
    });

    it('宣言・型宣言は名前で対応付き、interface のメンバー・enum も比べる', () => {
        const fields = moduleFields('utils', 'utils.ts');
        const toRows = byName(fields.declarations, 'toRows')!;
        assert.deepEqual(
            toRows.fields.param.map((p: Node) => p.status),
            ['unchanged', 'added'],
        );

        const types = fields.typeDeclarations as Node[];
        const row = byName(types, 'Row')!;
        assert.deepEqual(
            row.fields.members
                .filter((m: Node) => m.status !== 'unchanged')
                .map((m: Node) => [m.status, m.value.name]),
            [['added', 'industry']],
        );
        assert.equal(byName(types, 'ViewKind')!.status, 'added');
        assert.equal(byName(types, 'SortDirection')!.fields.variantType.status, 'changed');
    });

    it('本体の文は GumTree で比べ、変わった式 (呼び出しの追加) を子の差分に持つ (段階 4)', () => {
        const fields = moduleFields('utils', 'utils.ts');
        // return records.map(...) → return records.slice(0, limit).map(...)
        const block = byName(fields.declarations, 'toRows')!.fields.block as Node[];
        assert.deepEqual(
            block.map((d) => [d.label, d.status]),
            [['jsReturn', 'changed']],
        );
        const labels: string[] = [];
        const visit = (diffs: Node[]) =>
            diffs.forEach((d) => {
                if (d.status !== 'unchanged') labels.push(`${d.status}:${d.label}`);
                visit(d.children ?? []);
            });
        visit(block);
        assert.ok(labels.includes('added:jsMemberAccess:method'), labels.join('\n'));
        // 位置 (sourceKeys) は before / after の文の位置
        assert.ok(block[0]!.sourceKeys.before && block[0]!.sourceKeys.after);

        // 変わっていない本体 (formatAmount の式の本体・accountList の getter) は unchanged
        const component = moduleFields('accountList', 'accountList.ts').component.fields
            .block as Node[];
        assert.equal(byName(component, 'hasRows')!.status, 'unchanged');
        // handleSelect は composed だけが変わったので、本体の文の差分もその 1 文だけが changed
        const handleSelect = byName(component, 'handleSelect')!.fields.block as Node[];
        assert.deepEqual(
            handleSelect.map((d) => [d.label, d.status]),
            [
                ['jsLocalVariable', 'unchanged'],
                ['jsExpression', 'changed'],
                ['jsExpression', 'unchanged'],
            ],
        );
    });

    it('CSS は規則を順序付き列で比べ、宣言は prop で対応付ける', () => {
        const stylesheets = (unit('accountList').content as Node).fields.stylesheets as Node[];
        const rules = stylesheets[0]!.fields.stylesheet.fields.rules as Node[];
        const changed = rules
            .filter((r) => r.status !== 'unchanged')
            .map((r) => [r.status, r.kind, r.value?.selector ?? r.value?.name ?? null]);
        assert.deepEqual(changed, [
            ['changed', 'cssRule', null],
            ['changed', 'cssRule', null],
            ['changed', 'cssRule', null],
            ['added', 'cssRule', '.tile:hover'],
            ['changed', 'cssAtRule', null],
        ]);

        // セレクターを 1 つ足した規則は、削除・追加ではなく変更 (selectors に追加)
        const parent = rules.find(
            (r) => r.fields?.selector?.after === '.parent, .total, .summary',
        )!;
        assert.deepEqual(
            parent.fields.selectors
                .filter((s: Node) => s.status !== 'unchanged')
                .map((s: Node) => [s.status, s.value]),
            [['added', '.summary']],
        );
        // カスタムプロパティの値の変更は、宣言 (prop) の changed
        const host = rules[0]!;
        assert.deepEqual(
            host.fields.declarations
                .filter((d: Node) => d.status !== 'unchanged')
                .map((d: Node) => [d.status, d.before.value, d.after.value]),
            [['changed', '0.5rem', '0.75rem']],
        );
        // @media の条件の変更は params の changed
        const media = rules.find((r) => r.kind === 'cssAtRule')!;
        assert.deepEqual(media.fields.params, {
            status: 'changed',
            before: '(max-width: 480px)',
            after: '(max-width: 600px)',
        });
    });

    it('HTML は要素の木を GumTree で対応付け、属性は要素の fields で比べる', () => {
        const templates = (unit('accountList').content as Node).fields.templates as Node[];
        const children = templates[0]!.fields.template.fields.children as Node[];
        /** GumTree の差分を前順にたどる */
        const all: Node[] = [];
        const visit = (diffs: Node[]) =>
            diffs.forEach((d) => {
                all.push(d);
                visit(d.children ?? []);
            });
        visit(children);
        const of = (label: string) => all.filter((d) => d.label === label);

        // 「更新」ボタンは「再読み込み」ボタンと対応付き、label の変更と variant の追加になる。「保存」ボタンは追加
        const buttons = of('element:lightning-button');
        const changed = buttons.find((b) => b.status === 'changed')!;
        assert.deepEqual(changed.fields.label, {
            status: 'changed',
            before: '更新',
            after: '再読み込み',
        });
        assert.deepEqual(changed.fields.variant, { status: 'added', value: 'brand' });
        assert.deepEqual(
            buttons.filter((b) => b.status === 'added').map((b) => b.value.attributes[1].value),
            [{ type: 'static', value: '保存' }],
        );

        // lwc:if で囲んだ <p> は、追加した分岐の中への移動
        const added = of('lwcIf').find((d) => d.status === 'added')!;
        assert.equal(added.value.branches[0].directive, 'lwc:if');
        const moved = of('element:p').find((d) => d.status === 'moved')!;
        assert.equal(moved.value.attributes[0].value.value, 'parent');

        // 文言の変更・要素の削除
        const text = of('lwcText').find((d) => d.status === 'changed')!;
        assert.deepEqual(text.fields.text, {
            status: 'changed',
            before: '取引先がありません',
            after: '該当する取引先がありません',
        });
        assert.deepEqual(
            of('element:div')
                .filter((d) => d.status === 'removed')
                .map((d) => d.value.attributes[0].value.value),
            ['chart'],
        );
    });

    it('同じ解析結果同士は unchanged だけになる', () => {
        const diffs = makeLwcBundleDiffs(result.after, result.after);
        assert.ok(diffs.every((d) => d.status === 'unchanged'));
        assert.ok(diffs.every((d) => d.content === undefined || d.content.status === 'unchanged'));
    });
});
