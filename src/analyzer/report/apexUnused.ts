import type { ApexUnitParseResult } from '../parser/Apex/unit';
import {
    type ApexDeclaration,
    apexDeclarationsOf,
    apexMemberNamesOf,
    apexPlatformCallbacksOf,
} from '../processor/Apex/semantic';
import { type DependencyGraph, toLevel } from '../processor/dependency/graph';
import { dependencyGraphOf } from '../unit/dependencies';
import type { ApexUnusedMethodRow, ReportInput } from './types';

// apex.unusedMethods: ほかから呼ばれていない Apex のメソッド (掃除の候補。docs/plan.md 10 章 P4 の段 1「プロジェクトをまたぐ解析」)。
// 呼ばれているかは依存関係のグラフ (単位をまたいで解決したもの) の辺で決める。
// - unused: 確定した呼び出しも、呼び出しの候補もない
// - candidateOnly: インターフェース・親クラスの型の変数からの呼び出しの候補 (candidateEdges) からだけ呼ばれうる
// プラットフォーム・画面から直接呼ばれうるもの (入口) は出さない:
// テスト、@AuraEnabled・@InvocableMethod・@RemoteAction・@Http*・@NamespaceAccessible・@Deprecated、global・webservice、
// 標準のインターフェースのうちプラットフォームが呼ぶメソッド (Batch の start・execute・finish など。processor/Apex/semantic/
// standardInterfaces.ts。表にないインターフェースを実装したクラスは public のメソッドすべて)、
// Visualforce のコントローラー・拡張の public のメソッド (マークアップから呼ばれる)。
// グラフのメソッドのノードは名前ごとなので、オーバーロードはまとめて判定する

/** 付いていれば入口とみなすアノテーション (小文字) */
const ENTRY_ANNOTATIONS = new Set([
    'auraenabled',
    'invocablemethod',
    'remoteaction',
    'httpget',
    'httppost',
    'httpput',
    'httppatch',
    'httpdelete',
    'namespaceaccessible',
    'deprecated',
    'testsetup',
    'istest',
]);

/** Visualforce からコントローラー・拡張を参照する via */
const VISUALFORCE_VIAS = new Set(['markup.controller', 'markup.extensions', 'controller']);

const isPublic = (declaration: ApexDeclaration) =>
    'modifiers' in declaration &&
    (declaration.modifiers.access === 'public' || declaration.modifiers.access === 'global');

/** メソッドのノード → 呼ばれ方 (ほかのメンバーからの確定した呼び出し・候補だけ) */
const callersOf = (graph: DependencyGraph) => {
    const confirmed = new Set<string>();
    const candidate = new Set<string>();
    for (const edge of graph.edges) {
        if (edge.kind !== 'calls') continue;
        // 自分の中からの呼び出し (再帰) は数えない
        if (toLevel(graph, edge.from, 'member') === edge.to) continue;
        confirmed.add(edge.to);
    }
    for (const edge of graph.candidateEdges) {
        if (toLevel(graph, edge.from, 'member') !== edge.to) candidate.add(edge.to);
    }
    // Visualforce のコントローラー・拡張のクラス
    const visualforce = new Set(
        graph.edges.filter((edge) => VISUALFORCE_VIAS.has(edge.via)).map((edge) => edge.to),
    );
    return { confirmed, candidate, visualforce };
};

/** 使われていない Apex のメソッド */
export const getApexUnusedMethods = (
    input: ReportInput,
    filter: { classes?: string[]; includeCandidates?: boolean } = {},
): ApexUnusedMethodRow[] => {
    const graph = dependencyGraphOf(input.after);
    const { confirmed, candidate, visualforce } = callersOf(graph);
    const rows: ApexUnusedMethodRow[] = [];
    for (const result of input.after.get('apexClass') as ApexUnitParseResult[]) {
        const base = result.result.base;
        if (filter.classes && !filter.classes.includes(base.name)) continue;
        const source = base.source;
        if (!source || source.fileType === 'error') continue;
        const { declarations } = apexDeclarationsOf(source);
        const names = apexMemberNamesOf(declarations);
        const seen = new Set<string>();
        for (const method of declarations) {
            if (method.kind !== 'method') continue;
            const member = names.memberOf(method);
            if (!member || seen.has(member)) continue;
            const owner = names.ownerTypeOf(names.ownerOf(method));
            if (!owner || owner.kind !== 'class') continue;
            // オーバーロードはまとめて判定する (どれかが入口なら入口)
            const overloads = declarations.filter(
                (d) => d.kind === 'method' && names.memberOf(d) === member,
            );
            seen.add(member);
            const entry = overloads.some(
                (d) =>
                    d.kind === 'method' &&
                    (names.isTestOf(d) ||
                        d.modifiers.access === 'global' ||
                        d.modifiers.isWebService ||
                        d.modifiers.annotations.some((a) =>
                            ENTRY_ANNOTATIONS.has(a.toLowerCase()),
                        ) ||
                        // 標準のインターフェースのうち、プラットフォームが呼ぶメソッド (表にないインターフェースなら
                        // 何が呼ばれるか分からないので public のメソッドすべて)
                        (isPublic(d) &&
                            owner.kind === 'class' &&
                            owner.implements.some((type) => {
                                if (type.type !== 'custom') return false;
                                // リポジトリのインターフェースの実装は、候補の呼び出し (candidateEdges) で見る
                                if (graph.nodes.has(`apexClass:${type.customType.join('.')}`)) {
                                    return false;
                                }
                                const callbacks = apexPlatformCallbacksOf(type.customType);
                                return !callbacks || callbacks.includes(d.nameKey);
                            })) ||
                        // Visualforce のコントローラー・拡張の public のメソッド
                        (isPublic(d) && visualforce.has(`apexClass:${names.qualifiedOf(owner)}`))),
            );
            if (entry) continue;
            const id = `apexMethod:${member}`;
            if (confirmed.has(id)) continue;
            const verdict = candidate.has(id) ? 'candidateOnly' : 'unused';
            if (verdict === 'candidateOnly' && filter.includeCandidates === false) continue;
            rows.push({
                filePath: result.filePath,
                sourceKeys: method.sourceKeys,
                className: base.name,
                member,
                access: method.modifiers.access ?? 'private',
                isStatic: method.modifiers.isStatic,
                overloads: overloads.length,
                verdict,
            });
        }
    }
    return rows.sort((a, b) => a.member.localeCompare(b.member));
};
