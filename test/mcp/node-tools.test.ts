import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { repositoryOf } from '../../docs/examples/paths';
import { closeAllStoreBackends } from '../../src/analyzer/unit';
import { RepositoryProcessor } from '../../src/analyzer/unit/processor';
import { registerNodeTools } from '../../src/mcp/nodeTools';

// 置き場 (SQLite) のノードの行を問い合わせるツール (docs/implementation-roadmap.md 5 章の Q4)

type Tool = (args: Record<string, unknown>) => Promise<{ content: { text: string }[] }>;

type NodeResult = {
    unitType: string;
    unit: string;
    location: string;
    kind: string;
    objectKey: string | null;
    path: string;
    filePath: string | null;
    startLine: number | null;
    endLine: number | null;
};

describe('MCP のノードのツール', () => {
    let tmp: string;
    const tools = new Map<string, Tool>();
    const call = async <T>(name: string, args: Record<string, unknown>): Promise<T> =>
        JSON.parse((await tools.get(name)!(args)).content[0]!.text) as T;

    before(async () => {
        tmp = await mkdtemp(path.join(os.tmpdir(), 'node-tools-'));
        const processor = await RepositoryProcessor.create(
            path.join(tmp, 'saved'),
            repositoryOf('after'),
        );
        const server = {
            registerTool: (name: string, _config: unknown, handler: Tool) =>
                tools.set(name, handler),
        } as unknown as McpServer;
        registerNodeTools(server, processor);
    });
    after(async () => {
        closeAllStoreBackends();
        await rm(tmp, { recursive: true, force: true });
    });

    it('ノードの種類と数を、単位の種類ごとに返す', async () => {
        const kinds = await call<{ unitType: string; kind: string; count: number }[]>(
            'list_node_kinds',
            {},
        );
        assert.ok(kinds.length > 0);
        assert.ok(kinds.every((k) => k.count > 0));
        // 多い順
        assert.deepEqual(
            kinds.map((k) => k.count),
            [...kinds.map((k) => k.count)].sort((a, b) => b - a),
        );
        const apex = await call<{ unitType: string }[]>('list_node_kinds', {
            unitTypes: ['apexClass'],
        });
        assert.ok(apex.length > 0 && apex.every((k) => k.unitType === 'apexClass'));
    });

    it('種類で探し、単位・ファイル・行を返す (中身は返さない)', async () => {
        const kinds = await call<{ unitType: string; kind: string; count: number }[]>(
            'list_node_kinds',
            { unitTypes: ['apexClass'] },
        );
        const kind = kinds[0]!;
        const found = await call<{ total: number; nodes: NodeResult[] }>('find_nodes', {
            kind: kind.kind,
            unitTypes: ['apexClass'],
            limit: 5,
        });
        assert.equal(found.total, kind.count);
        assert.equal(found.nodes.length, Math.min(5, kind.count));
        for (const node of found.nodes) {
            assert.equal(node.kind, kind.kind);
            assert.equal(node.unitType, 'apexClass');
            assert.deepEqual(Object.keys(node).sort(), [
                'endLine',
                'filePath',
                'kind',
                'location',
                'objectKey',
                'path',
                'startLine',
                'unit',
                'unitType',
            ]);
        }
        // 位置のあるノードは、リポジトリからの相対パスと行を持つ
        const located = found.nodes.filter((n) => n.startLine !== null);
        assert.ok(located.length > 0);
        for (const node of located) {
            assert.ok(node.filePath?.startsWith('force-app/'), node.filePath ?? '');
            assert.ok(node.endLine! >= node.startLine!);
        }
    });

    it('* で前方一致、単位の名前・objectKey・offset で絞る', async () => {
        const all = await call<{ total: number; nodes: NodeResult[] }>('find_nodes', {
            kind: 'apex*',
            unit: 'AccountService',
            limit: 1000,
        });
        assert.ok(all.total > 0);
        assert.ok(all.nodes.every((n) => n.kind.startsWith('apex') && n.unit === 'AccountService'));
        const second = await call<{ total: number; nodes: NodeResult[] }>('find_nodes', {
            kind: 'apex*',
            unit: 'AccountService',
            limit: 1,
            offset: 1,
        });
        assert.deepEqual(second.nodes, all.nodes.slice(1, 2));
        const withKey = all.nodes.find((n) => n.objectKey);
        assert.ok(withKey);
        const byKey = await call<{ total: number; nodes: NodeResult[] }>('find_nodes', {
            objectKey: withKey.objectKey,
            unit: 'AccountService',
        });
        assert.ok(byKey.nodes.some((n) => n.path === withKey.path));
        // % や _ はそのままの文字として扱う
        const none = await call<{ total: number }>('find_nodes', { kind: '%' });
        assert.equal(none.total, 0);
    });
});
