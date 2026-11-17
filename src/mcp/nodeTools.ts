import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { type Repository, manifestUnitOf, unitName } from '../analyzer/unit';

import { type ProcessorSource, processorGetter } from './context';

// 保存の置き場 (SQLite) のノードの行を問い合わせる MCP のツール (docs/implementation-roadmap.md 5 章の Q4)。
// ノード = 解析結果の JsonType・StructureJsonType 1 つ (Apex のメソッド・LWC のテンプレートの要素・フローの要素など)。
// 依存関係のツールと同じく、名前・種類・位置だけを返す (中身は返さないので、機密の値は出ない)

const text = (value: unknown) => ({
    content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
});

/** after = 今の状態 (既定)、before = 保存した基準 */
const sideSchema = z.enum(['after', 'before']).optional();

type UnitInfo = { unitType: string; unit: string; location: string };

/** 見る単位 (key → 種類・名前・場所)。unitTypes・unit で絞る */
const unitsOf = (
    repository: Repository,
    unitTypes: readonly string[] | undefined,
    unit: string | undefined,
): Map<string, UnitInfo> => {
    const units = new Map<string, UnitInfo>();
    for (const [type, results] of repository.entries()) {
        if (unitTypes && !unitTypes.includes(type)) continue;
        for (const result of results) {
            const manifest = manifestUnitOf(result);
            if (!manifest) continue;
            const name = unitName(type, result);
            if (unit !== undefined && name !== unit) continue;
            units.set(manifest.key, { unitType: type, unit: name, location: manifest.location });
        }
    }
    return units;
};

export const registerNodeTools = (server: McpServer, source: ProcessorSource): void => {
    const processorOf = processorGetter(source);
    const repositoryOf = async (side: 'after' | 'before' | undefined) => {
        const processor = await processorOf();
        return { processor, repository: side === 'before' ? processor.before : processor.after };
    };

    server.registerTool(
        'list_node_kinds',
        {
            description:
                '解析結果のノード (Apex のメソッド・文、LWC のテンプレートの要素、フローの要素などの JsonType) の種類と数を、単位の種類ごとに返します。find_nodes の kind に使います',
            inputSchema: {
                unitTypes: z.array(z.string().min(1)).optional(),
                side: sideSchema,
            },
        },
        async ({ unitTypes, side }) => {
            const { processor, repository } = await repositoryOf(side);
            const units = unitsOf(repository, unitTypes, undefined);
            return text(await processor.store.backend.countNodeKinds([...units.keys()]));
        },
    );

    server.registerTool(
        'find_nodes',
        {
            description:
                'ノードを種類 (kind。list_node_kinds の名前。* は任意の文字列。例: method・soql・flow*)・objectKey に含まれる文字列・単位の種類・単位の名前で探し、単位・場所・ファイルと行を返します (中身は返しません)。total は limit をかける前の数です',
            inputSchema: {
                kind: z.string().min(1).optional(),
                objectKey: z.string().min(1).optional(),
                unitTypes: z.array(z.string().min(1)).optional(),
                unit: z.string().min(1).optional(),
                side: sideSchema,
                limit: z.number().int().min(1).max(1000).optional(),
                offset: z.number().int().min(0).optional(),
            },
        },
        async ({ kind, objectKey, unitTypes, unit, side, limit, offset }) => {
            const { processor, repository } = await repositoryOf(side);
            const units = unitsOf(repository, unitTypes, unit);
            const { total, nodes } = await processor.store.backend.findNodes({
                unitKeys: [...units.keys()],
                ...(kind !== undefined ? { kind } : {}),
                ...(objectKey !== undefined ? { objectKey } : {}),
                limit: limit ?? 100,
                ...(offset !== undefined ? { offset } : {}),
            });
            return text({
                total,
                nodes: nodes.map(({ unitKey, ...node }) => ({ ...units.get(unitKey)!, ...node })),
            });
        },
    );
};
