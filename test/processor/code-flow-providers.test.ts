import assert from 'node:assert/strict';
import path from 'node:path';
import { before, describe, it } from 'node:test';

import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import {
    type ClassifiedStatement,
    type CodeFlow,
    type MetadataSnapshot,
    buildCodeFlow,
    getApexCallFlows,
    getApexMethodFlows,
    getLwcEventFlow,
    getLwcMethodFlows,
    snapshotOf,
} from '../../src/analyzer/report';
import { Repository, WorkingTree } from '../../src/analyzer/unit';
import { resolveReport } from '../../src/builder/reportBuilder';
import { ReportView } from '../../src/viewer/report/view';

// 処理フロー (apex.methodFlow と、言語に依らない組み立て buildCodeFlow。docs/todo.md 3.2.1 の 4)。
// サンプルは docs/examples/repository/after

let snapshot: MetadataSnapshot;
let repository: Repository;

/** 箱の種類の並び (start・end を除く) */
const kindsOf = (flow: CodeFlow) =>
    flow.nodes.filter((n) => n.kind !== 'start' && n.kind !== 'end').map((n) => n.kind);

const edgeOf = (flow: CodeFlow, from: string, to: string) =>
    flow.edges.find(
        (e) =>
            flow.nodes.find((n) => n.id === e.from)?.label.startsWith(from) &&
            flow.nodes.find((n) => n.id === e.to)?.label.startsWith(to),
    );

describe('処理フロー', () => {
    before(async () => {
        repository = await Repository.load(
            new WorkingTree(path.resolve('docs/examples/repository', 'after')),
        );
        snapshot = snapshotOf(repository);
    });
    const flowOf = (owner: string, name: string) =>
        getApexMethodFlows({ after: snapshot }, { classes: [owner.split('.')[0]!] }).find(
            (f) => f.owner === owner && f.name === name,
        )!;

    it('SOQL → 繰り返し (戻る線と終わりの線) → DML。箱の文字はソースの元の文', () => {
        const sync = flowOf('AccountService', 'sync');
        assert.equal(sync.signature, 'sync(Set<Id>)');
        assert.equal(sync.member, 'AccountService.sync');
        assert.deepEqual(kindsOf(sync), ['query', 'loop', 'process', 'dml']);
        assert.equal(
            sync.nodes.find((n) => n.kind === 'loop')!.label,
            'for (Account acc : accounts)',
        );
        assert.equal(edgeOf(sync, 'for', 'acc.Name')!.label, '繰り返す');
        assert.equal(edgeOf(sync, 'acc.Name', 'for')!.kind, 'back');
        assert.equal(edgeOf(sync, 'for', 'update')!.label, '終わり');
        assert.ok(sync.nodes.find((n) => n.kind === 'query')!.line! > 0);
    });

    it('if / else if / else・return・break・continue・いろいろな繰り返し', () => {
        const flow = flowOf('ParserTest', 'controlFlow');
        const decisions = flow.nodes.filter((n) => n.kind === 'decision').map((n) => n.label);
        assert.deepEqual(decisions.slice(0, 3), ['value > 100', 'value > 50', 'value == 0']);
        assert.equal(flow.nodes.filter((n) => n.kind === 'loop').length, 7);
        assert.ok(flow.nodes.some((n) => n.label.startsWith('do … while (value < 10)')));
        // return は終了へ。else if は「いいえ」の先の分岐
        assert.ok(edgeOf(flow, 'return', '終了'));
        assert.equal(edgeOf(flow, 'value > 100', 'value > 50')!.label, 'いいえ');
        // continue は繰り返しの頭へ、break は繰り返しの後へ
        assert.equal(edgeOf(flow, 'i == 5', 'for (Integer i')!.kind, 'back');
        assert.equal(edgeOf(flow, 'i == 8', 'Integer k')!.label, 'はい');
    });

    it('try / catch / finally と switch', () => {
        const flow = flowOf('ParserTest', 'exceptionHandling');
        assert.equal(flow.edges.filter((e) => e.kind === 'exception').length, 2);
        assert.equal(flow.nodes.filter((n) => n.kind === 'finally').length, 2);
        assert.ok(flow.nodes.some((n) => n.label === 'catch (QueryException e)'));
        const switches = flowOf('ParserTest', 'switchExamples');
        const labels = switches.edges.filter((e) => e.kind === 'case').map((e) => e.label);
        assert.deepEqual(labels, ["'A'", "'B', 'C'", 'null', 'else']);
        assert.equal(switches.nodes[2]!.label, 'switch on text');
    });

    it('トリガー・オーバーロード・members の絞り込み', () => {
        const trigger = getApexMethodFlows(
            { after: snapshot },
            { classes: ['AccountTrigger'] },
        )[0]!;
        assert.equal(trigger.memberType, 'trigger');
        assert.ok(trigger.nodes.some((n) => n.label === 'Trigger.isBefore && Trigger.isInsert'));
        const calc = getApexMethodFlows(
            { after: snapshot },
            { classes: ['AccountService'], members: ['AccountService.calc'] },
        );
        assert.deepEqual(
            calc.map((f) => f.signature),
            ['calc(Decimal, Decimal)', 'calc(Integer, Integer)'],
        );
    });

    it('組み立て: 続く処理は 1 つの箱、ループの中の DML に印、return のあとは描かない', () => {
        // 分類した文をそのまま文として渡す (分類は恒等)
        type S = ClassifiedStatement<any>;
        const flow = buildCodeFlow<S>(
            'f()',
            [
                { type: 'simple', kind: 'process', text: 'a = 1;' },
                { type: 'simple', kind: 'process', text: 'b = 2;' },
                { type: 'simple', kind: 'process', text: 'c = 3;' },
                { type: 'simple', kind: 'process', text: 'd = 4;' },
                {
                    type: 'loop',
                    header: 'for (x : xs)',
                    body: [
                        { type: 'simple', kind: 'dml', text: 'insert x;' },
                        { type: 'break' },
                        { type: 'simple', kind: 'process', text: 'never();' },
                    ],
                },
                { type: 'return', text: 'return;' },
                { type: 'simple', kind: 'process', text: 'unreachable();' },
            ],
            (s) => s,
        );
        const merged = flow.nodes.find((n) => n.kind === 'process')!;
        assert.equal(merged.count, 4);
        assert.equal(merged.label, 'a = 1;\nb = 2;\nc = 3;\n… (ほか 1 文)');
        assert.equal(flow.nodes.find((n) => n.kind === 'dml')!.inLoop, true);
        assert.ok(!flow.nodes.some((n) => n.label === 'never();' || n.label === 'unreachable();'));
        // break: DML から繰り返しの後 (return) へ
        const dml = flow.nodes.find((n) => n.kind === 'dml')!.id;
        const ret = flow.nodes.find((n) => n.kind === 'return')!.id;
        assert.ok(flow.edges.some((e) => e.from === dml && e.to === ret));
    });

    it('LWC: Apex の呼び出し・トースト・try / catch・画面の遷移・getter・モジュールの関数', () => {
        const flows = getLwcMethodFlows(
            { after: snapshot },
            { components: ['c/accountList', 'utils'] },
        );
        const flow = (member: string) => flows.find((f) => f.member === member)!;
        const remove = flow('AccountList.handleDelete');
        assert.equal(remove.language, 'lwc');
        assert.equal(remove.signature, 'handleDelete(event: Event)');
        assert.deepEqual(kindsOf(remove), ['process', 'try', 'call', 'event', 'catch', 'process']);
        assert.equal(
            remove.nodes.find((n) => n.kind === 'call')!.label,
            'await deleteAccount({ recordId });',
        );
        assert.equal(remove.edges.filter((e) => e.kind === 'exception').length, 1);
        assert.deepEqual(kindsOf(flow('AccountList.handleOpenList')), ['navigate']);
        assert.equal(flow('AccountList.get hasRows').memberType, 'method');
        assert.equal(flow('AccountList.handleReload').memberType, 'function');
        const toRows = flow('utils.toRows');
        assert.equal(toRows.owner, 'utils');
        assert.equal(toRows.unit, 'utils');
        assert.deepEqual(
            getLwcMethodFlows({ after: snapshot }, { members: ['handleClick'] }).map(
                (f) => f.member,
            ),
            ['AccountRow.handleClick'],
        );
    });

    it('apex.callFlow: 呼び出しをクラスをまたいでたどり、SOQL・DML は Database へ。ループの中に印', () => {
        const [execute] = getApexCallFlows(
            { after: snapshot },
            { members: ['AccountService.execute'] },
        );
        assert.equal(execute!.start, 'AccountService.execute');
        assert.deepEqual(execute!.participants, ['AccountService', 'Database']);
        assert.deepEqual(
            execute!.messages.map((m) => [m.to, m.label, m.kind, m.depth]),
            [
                ['AccountService', 'sync()', 'call', 1],
                ['Database', 'SELECT Account', 'query', 2],
                ['Database', 'update Account', 'dml', 2],
            ],
        );
        // depth: 1 なら呼んだ先の中はたどらない
        const shallow = getApexCallFlows(
            { after: snapshot },
            { members: ['AccountService.execute'], depth: 1 },
        );
        assert.equal(shallow[0]!.messages.length, 1);
        const [process] = getApexCallFlows(
            { after: snapshot },
            { members: ['AccountService.process'] },
        );
        assert.equal(process!.messages.find((m) => m.label === 'log()')!.inLoop, true);
        // トリガーは名前で起点にできる
        const [trigger] = getApexCallFlows({ after: snapshot }, { members: ['AccountTrigger'] });
        assert.deepEqual(trigger!.participants, ['AccountTrigger', 'AccountService']);
        // メッセージのない起点 (this(...) だけのコンストラクター) は出さない
        assert.ok(
            getApexCallFlows({ after: snapshot }, { classes: ['AccountService'] }).every(
                (sequence) => sequence.messages.length > 0,
            ),
        );
    });

    it('lwc.eventFlow: 操作・@wire・表示のときからハンドラー・Apex・イベントへ。子のイベントは親の on<イベント> へ', () => {
        const flow = getLwcEventFlow({ after: snapshot }, { components: ['c/accountList'] });
        assert.deepEqual(flow.components, ['accountList', 'accountRow']);
        const label = (id: string) => flow.nodes.find((n) => n.id === id)!.label;
        const lines = flow.edges.map((e) => `${label(e.from)} -> ${label(e.to)}`);
        for (const line of [
            '<lightning-button> click -> handleSave()',
            'handleSave() -> AccountController.updateAccount',
            'handleSave() -> イベント accountsaved',
            '<a> click -> handleClick()',
            'handleClick() -> イベント select',
            'イベント select -> <c-account-row> select',
            'handleSelect() -> 画面の遷移 (standard__recordPage)',
            'handleDelete() -> トースト: 削除しました',
            'AccountController.getAccounts -> @wire getAccounts → wiredAccounts',
            '表示したとき (connectedCallback) -> connectedCallback()',
            'connectedCallback() -> handleReload()',
            'handleReload() -> refreshApex',
        ]) {
            assert.ok(lines.includes(line), `${line}\n${lines.join('\n')}`);
        }
        // depth: 0 なら子コンポーネントを入れない
        assert.deepEqual(
            getLwcEventFlow({ after: snapshot }, { components: ['accountList'], depth: 0 })
                .components,
            ['accountList'],
        );
    });

    it('CodeFlowchart: for の中で where (member と signature) で 1 つに絞って描く', () => {
        const resolved = resolveReport(
            {
                title: 't',
                data: {},
                spec: {
                    root: 'page',
                    elements: {
                        page: {
                            type: 'Stack',
                            props: {
                                direction: 'vertical',
                                gap: 'md',
                                align: null,
                                justify: null,
                                className: null,
                            },
                            children: ['chart'],
                        },
                        chart: {
                            type: 'CodeFlowchart',
                            for: {
                                as: 'm',
                                in: {
                                    provider: 'apex.outline',
                                    args: { classes: ['AccountService'] },
                                    where: { memberType: 'method', name: 'calc' },
                                },
                            },
                            data: {
                                provider: 'apex.methodFlow',
                                args: { classes: ['AccountService'] },
                                where: {
                                    member: '${m.owner}.${m.name}',
                                    signature: '${m.name}(${m.params})',
                                },
                            },
                            props: { member: null, height: null },
                            children: [],
                        },
                    },
                },
            },
            { after: repository },
        );
        assert.ok(resolved.ok, JSON.stringify(!resolved.ok && resolved.issues));
        const data = resolved.report.spec.state.data as Record<string, CodeFlow[]>;
        assert.deepEqual(
            Object.values(data).map((flows) => flows.map((f) => f.signature)),
            [['calc(Integer, Integer)'], ['calc(Decimal, Decimal)']],
        );
        const html = renderToString(createElement(ReportView, { report: resolved.report }));
        assert.ok(html.includes('react-flow'));
    });
});
