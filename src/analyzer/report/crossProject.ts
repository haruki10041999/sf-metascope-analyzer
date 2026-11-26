import type { ApexUnitParseResult } from '../parser/Apex/unit';
import { apexDeclarationsOf } from '../processor/Apex/semantic';
import { getApexTriggers } from '../processor/Metadata/references';
import { type DependencyGraph, toLevel } from '../processor/dependency/graph';
import type { DependencyKind } from '../processor/dependency/types';
import { dependencyGraphOf } from '../unit/dependencies';
import type { ApexTestRow, ApexTriggerHandlerRow, ObjectUsageRow, ReportInput } from './types';

// プロジェクトをまたぐ解析 (docs/plan.md 10 章 P4 の段 1)。どれも依存関係のグラフ (単位をまたいで解決したもの) から作る。
// - object.usage: オブジェクトごとの、使っている単位と操作 (照会・作成・更新・削除・項目の読み書き) の表
// - apex.triggerHandlers: トリガーから呼び出しをたどって届くクラス (ハンドラー)
// - apex.tests: クラス・トリガーごとの、届くテストクラス (呼び出しでたどるか、テストの DML で動くトリガー)
// 候補の呼び出し (インターフェースの実装クラスなど。candidateEdges) は、確定した呼び出しではないのでたどらない

/** Apex の単位どうしのつながりにする辺 (呼び出し・new) */
const CALL_KINDS = new Set<DependencyKind>(['calls', 'creates']);

/** DML の辺 → 動くトリガーのイベント (merge は統合されたレコードの削除と、残すレコードの更新) */
const DML_EVENTS: Partial<Record<DependencyKind, readonly string[]>> = {
    inserts: ['insert'],
    updates: ['update'],
    upserts: ['insert', 'update'],
    deletes: ['delete'],
    undeletes: ['undelete'],
    merges: ['delete', 'update'],
};

/** オブジェクトの操作の表の、辺の種類 → 操作 */
const OPERATIONS: Partial<Record<DependencyKind, ObjectUsageRow['operations'][number]>> = {
    queries: 'query',
    inserts: 'insert',
    updates: 'update',
    upserts: 'upsert',
    deletes: 'delete',
    undeletes: 'undelete',
    merges: 'merge',
    reads: 'read',
    writes: 'write',
    uses: 'use',
    publishes: 'publish',
    triggers: 'trigger',
    grants: 'grant',
    places: 'place',
};

const isApexUnit = (graph: DependencyGraph, id: string) => {
    const node = graph.nodes.get(id);
    return (
        node?.level === 'unit' &&
        node.origin === 'repository' &&
        (node.type === 'apexClass' || node.type === 'apexTrigger')
    );
};

/** グラフの、Apex の単位どうしの呼び出し (単位の細かさ。自分への呼び出しは除く) と、単位ごとの DML */
const apexLinksOf = (graph: DependencyGraph) => {
    const calls = new Map<string, Set<string>>();
    /** 単位 → DML の対象のオブジェクト (小文字) → イベント */
    const dml = new Map<string, Map<string, Set<string>>>();
    /** オブジェクト (小文字) → トリガーの単位 */
    const triggersOf = new Map<string, Set<string>>();
    for (const edge of graph.edges) {
        const from = toLevel(graph, edge.from, 'unit');
        if (!isApexUnit(graph, from)) continue;
        if (CALL_KINDS.has(edge.kind)) {
            const to = toLevel(graph, edge.to, 'unit');
            if (to !== from && isApexUnit(graph, to)) {
                calls.set(from, (calls.get(from) ?? new Set()).add(to));
            }
        }
        const events = DML_EVENTS[edge.kind];
        const target = graph.nodes.get(edge.to);
        if (events && target?.type === 'object') {
            const byObject = dml.get(from) ?? new Map<string, Set<string>>();
            const key = target.name.toLowerCase();
            byObject.set(key, new Set([...(byObject.get(key) ?? []), ...events]));
            dml.set(from, byObject);
        }
        if (edge.kind === 'triggers' && target?.type === 'object') {
            const key = target.name.toLowerCase();
            triggersOf.set(key, (triggersOf.get(key) ?? new Set()).add(from));
        }
    }
    return { calls, dml, triggersOf };
};

/** トリガーの名前 → イベント (before insert など) と対象のオブジェクト */
const triggerInfosOf = (input: ReportInput) =>
    new Map(
        getApexTriggers(input.after.get('apexTrigger') as ApexUnitParseResult[]).map((t) => [
            t.name.toLowerCase(),
            t,
        ]),
    );

// ---------------------------------------------------------------------------
// object.usage
// ---------------------------------------------------------------------------

/**
 * object.usage: オブジェクトごとに、使っている単位 (Apex・LWC・Flow・権限など) と操作 (照会・作成・更新・削除・
 * 項目の読み書き)。単位 1 つ・オブジェクト 1 つで 1 行
 */
export const getObjectUsage = (
    input: ReportInput,
    filter: { objects?: string[] } = {},
): ObjectUsageRow[] => {
    const graph = dependencyGraphOf(input.after);
    const rows = new Map<
        string,
        {
            object: string;
            unitId: string;
            operations: Set<ObjectUsageRow['operations'][number]>;
            read: Set<string>;
            written: Set<string>;
        }
    >();
    for (const edge of graph.edges) {
        const target = graph.nodes.get(edge.to);
        if (target?.type !== 'object' && target?.type !== 'field') continue;
        const object = target.type === 'object' ? target.name : target.name.split('.')[0]!;
        if (
            filter.objects &&
            !filter.objects.some((o) => o.toLowerCase() === object.toLowerCase())
        ) {
            continue;
        }
        const unitId = toLevel(graph, edge.from, 'unit');
        const unit = graph.nodes.get(unitId);
        if (unit?.origin !== 'repository') continue;
        // オブジェクトの単位の中の、自分の項目への参照は数えない (自分の定義)
        if (unit.type === 'object' && unit.name.toLowerCase() === object.toLowerCase()) continue;
        const key = `${object.toLowerCase()}|${unitId}`;
        const row = rows.get(key) ?? {
            object,
            unitId,
            operations: new Set(),
            read: new Set(),
            written: new Set(),
        };
        const operation = OPERATIONS[edge.kind];
        if (operation) row.operations.add(operation);
        if (target.type === 'field' && (edge.kind === 'reads' || edge.kind === 'queries')) {
            row.read.add(target.name);
        }
        if (target.type === 'field' && edge.kind === 'writes') row.written.add(target.name);
        rows.set(key, row);
    }
    const ORDER: ObjectUsageRow['operations'] = [
        'query',
        'read',
        'insert',
        'update',
        'upsert',
        'delete',
        'undelete',
        'merge',
        'write',
        'publish',
        'trigger',
        'grant',
        'place',
        'use',
    ];
    return [...rows.values()]
        .map((row): ObjectUsageRow => {
            const unit = graph.nodes.get(row.unitId)!;
            return {
                object: row.object,
                objectOrigin: graph.nodes.get(`object:${row.object}`)?.origin ?? 'unknown',
                unitType: unit.type,
                unit: unit.name,
                operations: ORDER.filter((o) => row.operations.has(o)),
                fieldsRead: [...row.read].sort(),
                fieldsWritten: [...row.written].sort(),
            };
        })
        .sort(
            (a, b) =>
                a.object.localeCompare(b.object) ||
                a.unitType.localeCompare(b.unitType) ||
                a.unit.localeCompare(b.unit),
        );
};

// ---------------------------------------------------------------------------
// apex.triggerHandlers
// ---------------------------------------------------------------------------

/** apex.triggerHandlers: トリガーから呼び出しをたどって届くクラス (ハンドラー) と段数・経路 */
export const getApexTriggerHandlers = (
    input: ReportInput,
    filter: { triggers?: string[]; depth?: number } = {},
): ApexTriggerHandlerRow[] => {
    const graph = dependencyGraphOf(input.after);
    const { calls } = apexLinksOf(graph);
    const infos = triggerInfosOf(input);
    const depth = filter.depth ?? 3;
    const rows: ApexTriggerHandlerRow[] = [];
    for (const node of graph.nodes.values()) {
        if (node.type !== 'apexTrigger' || node.level !== 'unit' || node.origin !== 'repository') {
            continue;
        }
        if (filter.triggers && !filter.triggers.includes(node.name)) continue;
        const info = infos.get(node.name.toLowerCase());
        // 幅優先でたどり、最初に届いた経路を残す
        const path = new Map<string, string[]>([[node.id, []]]);
        let frontier = [node.id];
        for (let step = 1; step <= depth && frontier.length; step++) {
            const next: string[] = [];
            for (const id of frontier) {
                for (const to of calls.get(id) ?? []) {
                    if (path.has(to)) continue;
                    path.set(to, [...path.get(id)!, graph.nodes.get(to)!.name]);
                    next.push(to);
                }
            }
            frontier = next;
        }
        for (const [id, chain] of path) {
            if (id === node.id) continue;
            rows.push({
                trigger: node.name,
                ...(info ? { object: info.object, events: info.events } : {}),
                handler: graph.nodes.get(id)!.name,
                depth: chain.length,
                path: chain,
            });
        }
    }
    return rows.sort(
        (a, b) =>
            a.trigger.localeCompare(b.trigger) ||
            a.depth - b.depth ||
            a.handler.localeCompare(b.handler),
    );
};

// ---------------------------------------------------------------------------
// apex.tests
// ---------------------------------------------------------------------------

/** クラスの名前 (小文字) → テストのクラス (@IsTest) か */
const testClassesOf = (input: ReportInput): Set<string> =>
    new Set(
        (input.after.get('apexClass') as ApexUnitParseResult[]).flatMap((result) => {
            const source = result.result.base.source;
            if (!source || source.fileType === 'error') return [];
            const top = apexDeclarationsOf(source).declarations.find((d) => d.kind === 'class');
            return top?.kind === 'class' && top.isTest
                ? [result.result.base.name.toLowerCase()]
                : [];
        }),
    );

/**
 * apex.tests: クラス・トリガーごとに、届くテストクラスと届き方。テストクラスから呼び出しをたどるほか、
 * テスト (やそこから呼ぶクラス) の DML で、そのオブジェクトのイベントのトリガーが動くことも数える。
 * テストのないクラス・トリガーも tests が空の行として出す
 */
export const getApexTests = (
    input: ReportInput,
    filter: { classes?: string[]; depth?: number; untestedOnly?: boolean } = {},
): ApexTestRow[] => {
    const graph = dependencyGraphOf(input.after);
    const { calls, dml, triggersOf } = apexLinksOf(graph);
    const infos = triggerInfosOf(input);
    const tests = testClassesOf(input);
    const depth = filter.depth ?? 3;
    const isTestUnit = (id: string) => {
        const node = graph.nodes.get(id)!;
        return node.type === 'apexClass' && tests.has(node.name.toLowerCase());
    };
    /** 対象の単位 → テストクラス → 届き方 (call: 呼び出しだけ / dml: どこかで DML からトリガーを通る) と段数 */
    const reached = new Map<string, Map<string, { via: 'call' | 'dml'; depth: number }>>();
    for (const node of graph.nodes.values()) {
        if (!isApexUnit(graph, node.id) || !isTestUnit(node.id)) continue;
        const seen = new Map<string, { via: 'call' | 'dml'; depth: number }>([
            [node.id, { via: 'call', depth: 0 }],
        ]);
        let frontier = [node.id];
        for (let step = 1; step <= depth && frontier.length; step++) {
            const next: string[] = [];
            const visit = (to: string, via: 'call' | 'dml') => {
                if (seen.has(to)) return;
                seen.set(to, { via, depth: step });
                next.push(to);
            };
            for (const id of frontier) {
                const via = seen.get(id)!.via;
                for (const to of calls.get(id) ?? []) visit(to, via);
                // DML で動くトリガー (オブジェクトとイベントが合うもの)
                for (const [object, events] of dml.get(id) ?? []) {
                    for (const trigger of triggersOf.get(object) ?? []) {
                        const info = infos.get(graph.nodes.get(trigger)!.name.toLowerCase());
                        const fires =
                            !info ||
                            info.events.some((event) => events.has(event.split(' ').pop()!));
                        if (fires) visit(trigger, 'dml');
                    }
                }
            }
            frontier = next;
        }
        for (const [id, how] of seen) {
            if (id === node.id || isTestUnit(id)) continue;
            const byTest = reached.get(id) ?? new Map();
            byTest.set(node.name, how);
            reached.set(id, byTest);
        }
    }
    const rows: ApexTestRow[] = [];
    for (const node of graph.nodes.values()) {
        if (!isApexUnit(graph, node.id) || isTestUnit(node.id)) continue;
        if (filter.classes && !filter.classes.includes(node.name)) continue;
        const byTest =
            reached.get(node.id) ?? new Map<string, { via: 'call' | 'dml'; depth: number }>();
        if (filter.untestedOnly && byTest.size > 0) continue;
        rows.push({
            unitType: node.type === 'apexTrigger' ? 'trigger' : 'class',
            name: node.name,
            tests: [...byTest]
                .map(([test, how]) => ({ test, via: how.via, depth: how.depth }))
                .sort((a, b) => a.depth - b.depth || a.test.localeCompare(b.test)),
        });
    }
    return rows.sort(
        (a, b) => a.unitType.localeCompare(b.unitType) || a.name.localeCompare(b.name),
    );
};
