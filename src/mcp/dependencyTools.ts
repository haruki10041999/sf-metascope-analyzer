import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { GitParser, type GitDiffTarget } from '../analyzer/parser/git';
import {
    type DependencyGraph,
    getDependencies,
    getDependents,
    getImpact,
    toLevel,
} from '../analyzer/processor/dependency/graph';
import {
    ProjectTree,
    Repository,
    WorkingTree,
    analyzeDependencies,
    changedUnits,
    locateUnits,
    relativeGitFiles,
} from '../analyzer/unit';

// 依存関係を問い合わせる MCP のツール。方針: docs/analysis-plan.md 3.5
// 名前・種類・位置だけを返す (値は返さないので、機密の値 (5.7) は出ない)

const levelSchema = z.enum(['unit', 'member', 'site']).optional();

const text = (value: unknown) => ({
    content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
});

/** リポジトリ (sfdx-project.json の packageDirectories・.forceignore の範囲) のグラフ */
const loadGraph = async (
    root: string,
): Promise<{ graph: DependencyGraph; repository: Repository }> => {
    const repository = await Repository.load(new ProjectTree(new WorkingTree(root)));
    return { graph: analyzeDependencies(repository), repository };
};

const describeNodes = (graph: DependencyGraph, found: Map<string, number>) =>
    [...found].map(([id, depth]) => {
        const node = graph.nodes.get(id)!;
        return { id, type: node.type, name: node.name, origin: node.origin, depth };
    });

export const registerDependencyTools = (server: McpServer, repositoryRoot: string): void => {
    server.registerTool(
        'get_dependents',
        {
            description:
                '指定したもの (例: field:Invoice__c.Amount__c / apexClass:AccountService / customLabel:Greeting) を使っているもの (被依存) を返します。depth で何段たどるか、level で結果の細かさ (unit / member / site = 文・式) を指定します',
            inputSchema: {
                target: z.string().min(1),
                depth: z.number().int().min(1).max(10).optional(),
                level: levelSchema,
            },
        },
        async ({ target, depth, level }) => {
            const { graph } = await loadGraph(repositoryRoot);
            if (!graph.nodes.has(target)) return text({ target, found: false, dependents: [] });
            return text({
                target,
                found: true,
                dependents: describeNodes(
                    graph,
                    getDependents(graph, target, { depth: depth ?? 1, level: level ?? 'unit' }),
                ),
            });
        },
    );

    server.registerTool(
        'get_dependencies',
        {
            description:
                '指定したもの (例: apexClass:AccountService / flow:Invoice_Status_Update) が使っているもの (依存先) を返します',
            inputSchema: {
                target: z.string().min(1),
                depth: z.number().int().min(1).max(10).optional(),
                level: levelSchema,
            },
        },
        async ({ target, depth, level }) => {
            const { graph } = await loadGraph(repositoryRoot);
            if (!graph.nodes.has(target)) return text({ target, found: false, dependencies: [] });
            return text({
                target,
                found: true,
                dependencies: describeNodes(
                    graph,
                    getDependencies(graph, target, { depth: depth ?? 1, level: level ?? 'unit' }),
                ),
            });
        },
    );

    server.registerTool(
        'get_change_impact',
        {
            description:
                'git の変更 (from を渡せばそのコミットから HEAD まで、渡さなければ作業ツリーの未コミットの変更) で変わった単位と、変わっていないが影響を受ける単位を返します',
            inputSchema: {
                from: z.string().optional(),
                depth: z.number().int().min(1).max(10).optional(),
            },
        },
        async ({ from, depth }) => {
            const target: GitDiffTarget = from
                ? { mode: 'committed', from, to: 'HEAD' }
                : { mode: 'unstaged', includeUntracked: true };
            const diff = await GitParser.getDiffFiles(target, { cwd: repositoryRoot });
            const subdirectory = repositoryRoot.slice(diff.root.length).replace(/^[\\/]+/, '');
            const changed = changedUnits(relativeGitFiles(diff.files, subdirectory));
            const { graph, repository } = await loadGraph(repositoryRoot);
            // 変わった単位の場所 → グラフの単位のノード
            const changedNodes = [...graph.nodes.values()]
                .filter((node) => {
                    if (node.level !== 'unit' || !node.unit) return false;
                    const result = repository
                        .get(node.unit.type)
                        .find((r) => r.result.id === node.unit!.id);
                    return (
                        result !== undefined &&
                        (changed.get(node.unit.type) ?? []).includes(repository.locationOf(result))
                    );
                })
                .map((node) => node.id);
            const impact = getImpact(graph, changedNodes, depth ?? 2);
            return text({
                changed: changedNodes,
                impacted: describeNodes(graph, impact),
            });
        },
    );

    server.registerTool(
        'get_missing_references',
        {
            description:
                'リポジトリにない参照先 (存在しない項目・クラス・コンポーネント・ラベルなど) と、参照している場所を返します',
            inputSchema: {},
        },
        async () => {
            const { graph } = await loadGraph(repositoryRoot);
            return text(
                graph.findings.map((finding) => ({
                    code: finding.code,
                    target: finding.target,
                    from: toLevel(graph, finding.from, 'member'),
                    unit: toLevel(graph, finding.from, 'unit'),
                })),
            );
        },
    );

    server.registerTool(
        'list_units',
        {
            description: 'リポジトリの単位 (種類ごとの単位の場所) の一覧を返します',
            inputSchema: {},
        },
        async () => {
            const tree = new ProjectTree(new WorkingTree(repositoryRoot));
            return text(Object.fromEntries(locateUnits(await tree.listFiles())));
        },
    );
};
