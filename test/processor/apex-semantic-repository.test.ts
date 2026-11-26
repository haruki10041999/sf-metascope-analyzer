import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseApexUnitFiles } from '../../src/analyzer/parser/Apex/unit';
import {
    analyzeApexUnit,
    apexRepositoryIndexOf,
    apexSemanticDependenciesOf,
} from '../../src/analyzer/processor/Apex/semantic';
import { buildDependencyGraph, toLevel } from '../../src/analyzer/processor/dependency/graph';
import { getApexDependencies } from '../../src/analyzer/processor/dependency/apex';

// 単位をまたぐ解決 (semantic/repository.ts の索引を型の解決に渡す。docs/plan.md 10 章 P4 の段 1)

const parse = (name: string, lines: string[]) =>
    parseApexUnitFiles({
        unitType: 'class',
        name,
        filePath: `${name}.cls`,
        source: { fileName: `${name}.cls`, source: lines.join('\n') },
    });

const units = async () => ({
    repo: await parse('Repo', [
        'public class Repo {',
        '    public Wrapper last;',
        '    public static Repo instance() { return new Repo(); }',
        '    public Account fetch(Id id) { return [SELECT Id, Name FROM Account WHERE Id = :id]; }',
        '    public class Wrapper { public Contact contact; }',
        '}',
    ]),
    base: await parse('Base', [
        'public virtual class Base {',
        '    protected Repo repo;',
        '    public Integer count() { return 1; }',
        '}',
    ]),
    service: await parse('Service', [
        'public class Service extends Base {',
        '    void run(Id id) {',
        '        String n = Repo.instance().fetch(id).Name;',
        '        Integer c = count();',
        '        String l = repo.last.contact.LastName;',
        '    }',
        '}',
    ]),
});

const show = (references: { kind: string; refType: string; target: string; via: string }[]) =>
    references.map((r) => `${r.kind} ${r.refType}:${r.target} (${r.via})`);

describe('単位をまたぐ解決 (リポジトリの宣言の索引)', () => {
    it('ほかのクラスのメソッドの戻り値・親クラスのメソッドとフィールドをたどる', async () => {
        const { repo, base, service } = await units();
        const index = apexRepositoryIndexOf([repo, base, service]);

        // 単位の中だけでは、ほかのクラスの戻り値の先が分からない (単位をまたげば解決できる参照として数える)
        const local = apexSemanticDependenciesOf(analyzeApexUnit(service)!);
        assert.ok((local.dependencies.pendingResolution ?? 0) > 0);
        assert.ok(
            !show(local.dependencies.references).includes(
                'reads apexTypeMember:Account.Name (member)',
            ),
        );

        const resolved = apexSemanticDependenciesOf(
            analyzeApexUnit(service, { repository: { index, unit: 'Service' } })!,
        );
        const refs = show(
            resolved.dependencies.references.filter((r) => r.from.member === 'Service.run'),
        );
        for (const expected of [
            // 静的メソッドの戻り値 (Repo) のメソッド (fetch) の戻り値 (Account) の項目
            'calls apexMethod:Repo.instance (call)',
            'calls apexMethod:Repo.fetch (call)',
            'reads apexTypeMember:Account.Name (member)',
            // 親クラス (ほかの単位) のメソッド。以前は Service.count (ない名前) になっていた
            'calls apexMethod:Base.count (call)',
            // 親クラスのフィールド repo (型 Repo と大小だけが違う名前) → Repo.last → Repo.Wrapper.contact → Contact
            'reads apexTypeMember:Repo.last (member)',
            'reads apexTypeMember:Repo.Wrapper.contact (member)',
            'reads apexTypeMember:Contact.LastName (member)',
            // 親クラス (ほかの単位) から引き継いだフィールドそのものの読み取り
            'reads apexTypeMember:Base.repo (member)',
        ]) {
            assert.ok(refs.includes(expected), expected);
        }
        assert.ok(!refs.includes('calls apexMethod:Service.count (call)'));
        // 索引を渡した結果は数えない (保存する定義・参照ではない)
        assert.equal(resolved.dependencies.pendingResolution, undefined);
    });

    it('ほかの単位の内部クラスは、短い名前では見えない', async () => {
        const { repo } = await units();
        const other = await parse('Other', [
            'public class Other {',
            '    void run() { Wrapper w; Repo.Wrapper r; String a = w.contact.LastName; String b = r.contact.LastName; }',
            '}',
        ]);
        const index = apexRepositoryIndexOf([repo, other]);
        const refs = show(
            apexSemanticDependenciesOf(
                analyzeApexUnit(other, { repository: { index, unit: 'Other' } })!,
            ).dependencies.references,
        );
        // Repo.Wrapper は完全な名前で見える。Wrapper だけでは見えない
        assert.ok(refs.includes('uses apexType:Repo.Wrapper (type)'));
        assert.equal(
            refs.filter((r) => r === 'reads apexTypeMember:Contact.LastName (member)').length,
            1,
        );
    });

    it('グラフは、単位の中だけで解決できなかった参照がある単位だけを、索引を渡して解析し直す', async () => {
        const { repo, base, service } = await units();
        const { getRepositoryDependencies } = await import('../../src/analyzer/unit/dependencies');
        const { Repository } = await import('../../src/analyzer/unit');
        const repository = Repository.of(
            '/repo',
            new Map([
                [
                    'apexClass',
                    [repo, base, service].map((u) => ({ ...u, filePath: `/repo/${u.filePath}` })),
                ],
            ]),
        );
        const graph = buildDependencyGraph(getRepositoryDependencies(repository));
        const edges = graph.edges.map(
            (e) => `${toLevel(graph, e.from, 'member')} --${e.kind}--> ${e.to}`,
        );
        assert.ok(edges.includes('apexMethod:Service.run --calls--> apexMethod:Base.count'));
        assert.ok(edges.includes('apexMethod:Service.run --calls--> apexMethod:Repo.fetch'));
        // 保存する定義・参照 (単位の中だけ) は変えない
        assert.ok(
            !show(getApexDependencies(service).references).includes(
                'calls apexMethod:Repo.fetch (call)',
            ),
        );
    });
});

describe('インターフェース・継承を通した呼び出し (実行時に呼ばれうるメソッド)', () => {
    const dispatchUnits = async () => [
        await parse('Handler', ['public interface Handler { void handle(Integer n); }']),
        await parse('FastHandler', [
            'public class FastHandler implements Handler {',
            '    public void handle(Integer n) {}',
            '    public void handle() {}',
            '}',
        ]),
        await parse('SlowHandler', [
            'public virtual class SlowHandler implements Handler {',
            '    public virtual void handle(Integer n) {}',
            '}',
        ]),
        // 実装しているクラスを継承したクラスの上書きも候補にする
        await parse('SlowerHandler', [
            'public class SlowerHandler extends SlowHandler {',
            '    public override void handle(Integer n) {}',
            '}',
        ]),
        await parse('Caller', [
            'public class Caller {',
            '    void run(Handler h, SlowHandler s) { h.handle(1); s.handle(2); }',
            '}',
        ]),
    ];

    it('インターフェースの型の変数の呼び出しは、実装しているクラスのメソッドを候補にする (グラフの確定した辺にはしない)', async () => {
        const units = await dispatchUnits();
        const caller = units[units.length - 1]!;
        const index = apexRepositoryIndexOf(units);
        const { references, dependencies } = apexSemanticDependenciesOf(
            analyzeApexUnit(caller, { repository: { index, unit: 'Caller' } })!,
        );
        // 実行時に呼ばれうるメソッドの参照 (h.handle(1) と s.handle(2) の分)
        const dispatched = references
            .filter((r) => r.via === 'dispatch')
            .map((r) => [r.target, r.resolution.status]);
        // Handler の実装 (引数の数が同じもの) と、実装しているクラスの子クラスの上書き
        assert.deepEqual([...new Set(dispatched.map(([target]) => target))].sort(), [
            'FastHandler.handle',
            'SlowHandler.handle',
            'SlowerHandler.handle',
        ]);
        assert.ok(dispatched.every(([, status]) => status === 'candidates'));
        // 書いた型のメソッド (Handler.handle・SlowHandler.handle) は確定した呼び出し
        const calls = show(dependencies.references).filter((r) => r.startsWith('calls'));
        assert.ok(calls.includes('calls apexMethod:Handler.handle (call)'));
        assert.ok(calls.includes('calls apexMethod:SlowHandler.handle (call)'));
        // 実行時の候補は、確かさ candidates の印を付けて依存関係に残す
        const dispatch = dependencies.references.filter((r) => r.via === 'dispatch');
        assert.ok(dispatch.length > 0);
        assert.ok(dispatch.every((r) => r.resolution === 'candidates'));

        // グラフは候補の参照を確定した辺にせず、candidateEdges に持つ
        const graph = buildDependencyGraph(
            units.map((unit) => ({
                type: 'apexClass',
                id: unit.result.id,
                dependencies:
                    unit === caller
                        ? dependencies
                        : getApexDependencies(unit, {
                              repository: { index, unit: unit.result.base.name },
                          }),
            })),
        );
        const showEdges = (edges: typeof graph.edges) =>
            edges.map((e) => `${toLevel(graph, e.from, 'member')} --${e.via}--> ${e.to}`);
        assert.ok(!showEdges(graph.edges).some((e) => e.includes('--dispatch-->')));
        assert.deepEqual(
            // h.handle(1) と s.handle(2) の両方から SlowerHandler.handle へ (場所ごとの辺なので、名前で 1 つにする)
            [...new Set(showEdges(graph.candidateEdges))].sort(),
            [
                'apexMethod:Caller.run --dispatch--> apexMethod:FastHandler.handle',
                'apexMethod:Caller.run --dispatch--> apexMethod:SlowHandler.handle',
                'apexMethod:Caller.run --dispatch--> apexMethod:SlowerHandler.handle',
            ],
        );
    });

    it('親クラスの型の変数の呼び出しは、上書きしている子クラスのメソッドだけを候補にする', async () => {
        const units = await dispatchUnits();
        const caller = units[units.length - 1]!;
        const index = apexRepositoryIndexOf(units);
        const analysis = analyzeApexUnit(caller, { repository: { index, unit: 'Caller' } })!;
        const calls = analysis.bodies.flatMap((b) => b.calls);
        const dispatchOf = (argument: string) => {
            const call = calls.find(
                (c) => c.name === 'handle' && JSON.stringify(c.args).includes(`"${argument}"`),
            )!;
            return call.dispatchIds.map((id) => id.split('#')[0]).sort();
        };
        assert.deepEqual(dispatchOf('1'), ['FastHandler', 'SlowHandler', 'SlowerHandler']);
        assert.deepEqual(dispatchOf('2'), ['SlowerHandler']);
    });
});

describe('apex.callFlow で、インターフェースの実装クラスへたどる', () => {
    it('インターフェースの型の変数の呼び出しから、別の単位の実装クラスのメソッドの中へたどる', async () => {
        const { getApexCallFlows } = await import('../../src/analyzer/report');
        const apex = [
            await parse('Handler', ['public interface Handler { void handle(Integer n); }']),
            await parse('FastHandler', [
                'public class FastHandler implements Handler {',
                '    public void handle(Integer n) { List<Account> rows = [SELECT Id FROM Account]; }',
                '}',
            ]),
            await parse('Caller', [
                'public class Caller {',
                '    public void run(Handler h) { h.handle(1); }',
                '}',
            ]),
        ];
        const [flow] = getApexCallFlows({ after: { apex } as never }, { members: ['Caller.run'] });
        assert.ok(flow);
        assert.deepEqual(
            flow.messages.map((m) => [m.from, m.to, m.label, m.kind, m.depth]),
            [
                ['Caller', 'Handler', 'handle()', 'call', 1],
                ['Caller', 'FastHandler', 'handle() (Handler の実装)', 'call', 1],
                ['FastHandler', 'Database', 'SELECT Account', 'query', 2],
            ],
        );
    });
});

describe('親クラスから引き継いだフィールド・プロパティの読み書き', () => {
    it('同じ単位の中の親クラスのフィールドも、修飾のない名前の読み書きを参照にする (自分のクラスのものは今までどおり)', async () => {
        const unit = await parse('Outer', [
            'public class Outer {',
            '    public virtual class Parent { protected Integer total; public String label { get; set; } }',
            '    public class Child extends Parent {',
            '        Integer own;',
            '        void run() { total = 1; total++; own = total; String l = label; }',
            '    }',
            '}',
        ]);
        const refs = show(
            apexSemanticDependenciesOf(analyzeApexUnit(unit)!).dependencies.references.filter(
                (r) => r.from.member === 'Outer.Child.run',
            ),
        );
        assert.ok(refs.includes('writes apexTypeMember:Outer.Parent.total (assignment)'));
        assert.ok(refs.includes('reads apexTypeMember:Outer.Parent.total (member)'));
        assert.ok(refs.includes('reads apexTypeMember:Outer.Parent.label (member)'));
        // 自分のクラスのフィールド (own) は、今までどおり参照にしない
        assert.ok(!refs.some((r) => r.includes('.own')));
    });
});
