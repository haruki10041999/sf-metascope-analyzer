import type { ConvertKeys } from '../../../types';
import type { ApexSemanticAnalysis } from './analyze';
import { reachableApexCfgNodes } from './cfg';
import { apexDataflowOf } from './dataflow';
import type { ApexUnitFacts } from './facts';
import { apexMemberNamesOf } from './members';

// ★ガバナ制限のリスク: ループの中の SOQL・SOSL・DML (docs/plan.md 10 章 P4 段 2・docs/plan-details.md C-7)。
// - direct: ループの中に直接書いた SOQL・SOSL・動的なクエリ・DML (facts.ts の inLoop)
// - call: ループの中から同じ単位のメソッドを呼び、その先 (何段でも) で SOQL・DML をするもの。位置はループの中の呼び出し、
//   path は呼び出しの並び。呼び出し先は 1 つに決まったもの (candidateIds が 1 件) だけ
// - CFG で届かない文 (return のあとなど) の操作・呼び出しは除く
// ほかの単位のメソッドの呼び出しの先は見ない (単位をまたぐのは依存関係のグラフで行う。今は単位の中だけ)
// 指摘 (findings) にするかは、docs/plan.md 9 章の「apex.findings のルールの選別」を決めてから (D)

export type ApexLoopOperationKind = 'soql' | 'sosl' | 'dynamicQuery' | 'dml';

export type ApexLoopOperation = {
    /** ループの中にあるメンバー (Class.method) */
    member: string;
    kind: ApexLoopOperationKind;
    via: 'direct' | 'call';
    /** direct は操作の位置、call はループの中の呼び出しの位置 */
    sourceKeys: ConvertKeys;
    /** call のとき、呼び出しの並び (ループの中で呼んだメソッドから、操作のあるメソッドまで) */
    path?: string[];
    /** DML の操作 (insert など) */
    operation?: string;
    /** テストの中か */
    isTest: boolean;
};

type Operation = {
    kind: ApexLoopOperationKind;
    sourceKeys: ConvertKeys;
    inLoop: boolean;
    operation?: string;
};

type Call = { callee: string; sourceKeys: ConvertKeys; inLoop: boolean };

export const apexLoopOperationsOf = (
    analysis: ApexSemanticAnalysis,
    facts: ApexUnitFacts,
): ApexLoopOperation[] => {
    const names = apexMemberNamesOf(analysis.declarations, analysis.repository?.index);

    // 届かない評価点の位置 (本体ごと。ループの中に操作・呼び出しがある本体だけ調べる)
    const unreachable = new Set<string>();
    for (const semantics of analysis.bodies) {
        const hasLoopWork =
            semantics.queries.some((q) => q.inLoop) ||
            semantics.dml.some((d) => d.inLoop) ||
            semantics.calls.some((c) => c.inLoop);
        if (!hasLoopWork) continue;
        const flow = apexDataflowOf(semantics);
        const reachable = reachableApexCfgNodes(flow.cfg);
        const check = (keys: ConvertKeys) => {
            const node = flow.nodeOf(keys.sourceKey);
            if (node && !reachable.has(node)) unreachable.add(keys.sourceKey);
        };
        for (const query of semantics.queries) check(query.sourceKeys);
        for (const dml of semantics.dml) check(dml.sourceKeys);
        for (const call of semantics.calls) check(call.sourceKeys);
    }
    const live = (keys: ConvertKeys) => !unreachable.has(keys.sourceKey);

    // メンバーごとの操作
    const operations = new Map<string, Operation[]>();
    const isTest = new Map<string, boolean>();
    const addOperation = (member: string | undefined, operation: Operation, test: boolean) => {
        if (!member || !live(operation.sourceKeys)) return;
        (operations.get(member) ?? operations.set(member, []).get(member)!).push(operation);
        isTest.set(member, test);
    };
    for (const query of facts.queries) {
        addOperation(
            query.context.member,
            {
                kind: query.language === 'dynamic' ? 'dynamicQuery' : query.language,
                sourceKeys: query.sourceKeys,
                inLoop: query.context.inLoop,
            },
            query.context.isTest,
        );
    }
    for (const dml of facts.dml) {
        addOperation(
            dml.context.member,
            {
                kind: 'dml',
                sourceKeys: dml.sourceKeys,
                inLoop: dml.context.inLoop,
                operation: dml.operation,
            },
            dml.context.isTest,
        );
    }

    // メンバーごとの、同じ単位のメソッドの呼び出し (呼び出し先が 1 つに決まったもの)
    const calls = new Map<string, Call[]>();
    for (const semantics of analysis.bodies) {
        const member = names.memberOf(names.byId.get(semantics.body.id));
        if (!member) continue;
        isTest.set(member, isTest.get(member) ?? names.isTestOf(names.byId.get(semantics.body.id)));
        for (const call of semantics.calls) {
            if (call.candidateIds.length !== 1 || !live(call.sourceKeys)) continue;
            const target = names.byId.get(call.candidateIds[0]!);
            // ほかの単位の宣言 (<単位>#<sourceKey>) は見ない
            if (!target || call.candidateIds[0]!.includes('#')) continue;
            const callee = names.memberOf(target);
            if (!callee || callee === member) continue;
            (calls.get(member) ?? calls.set(member, []).get(member)!).push({
                callee,
                sourceKeys: call.sourceKeys,
                inLoop: call.inLoop,
            });
        }
    }

    /** メンバーから (何段でも) 呼び出しをたどって届く操作と、呼び出しの並び */
    const reachableOperations = (start: string): { operation: Operation; path: string[] }[] => {
        const found: { operation: Operation; path: string[] }[] = [];
        const visit = (member: string, path: string[], seen: Set<string>) => {
            for (const operation of operations.get(member) ?? []) found.push({ operation, path });
            for (const call of calls.get(member) ?? []) {
                if (seen.has(call.callee)) continue;
                visit(call.callee, [...path, call.callee], new Set([...seen, call.callee]));
            }
        };
        visit(start, [start], new Set([start]));
        return found;
    };

    const results: ApexLoopOperation[] = [];
    for (const [member, list] of operations) {
        for (const operation of list) {
            if (!operation.inLoop) continue;
            results.push({
                member,
                kind: operation.kind,
                via: 'direct',
                sourceKeys: operation.sourceKeys,
                ...(operation.operation ? { operation: operation.operation } : {}),
                isTest: isTest.get(member) ?? false,
            });
        }
    }
    for (const [member, list] of calls) {
        for (const call of list) {
            if (!call.inLoop) continue;
            for (const { operation, path } of reachableOperations(call.callee)) {
                results.push({
                    member,
                    kind: operation.kind,
                    via: 'call',
                    sourceKeys: call.sourceKeys,
                    path,
                    ...(operation.operation ? { operation: operation.operation } : {}),
                    isTest: isTest.get(member) ?? false,
                });
            }
        }
    }
    return results;
};
