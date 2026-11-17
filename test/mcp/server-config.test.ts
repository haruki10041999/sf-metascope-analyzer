import assert from 'node:assert/strict';
import { closeAllStoreBackends } from '../../src/analyzer/unit';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { repositoryOf } from '../../docs/examples/paths';
import {
    DEFAULT_SAVING_DIRECTORY,
    makeProcessorLoader,
    resolveServerConfig,
} from '../../src/mcp/context';
import { registerReportTools } from '../../src/mcp/reportTools';

// MCP のサーバーの初期処理 (docs/implementation-roadmap.md 4.5): 設定・読み込みを 1 回だけ・ツールは読み込みを待つ

describe('MCP のサーバーの初期処理', () => {
    let tmp: string;
    before(async () => {
        tmp = await mkdtemp(path.join(os.tmpdir(), 'server-config-'));
    });
    after(async () => {
        closeAllStoreBackends();
        await rm(tmp, { recursive: true, force: true });
    });

    it('保存先の既定はリポジトリの中の .sf-metascope、環境変数で変えられる', async () => {
        const root = repositoryOf('after');
        const config = await resolveServerConfig({}, root);
        assert.equal(config.repositoryRoot, path.resolve(root));
        assert.equal(config.savingRoot, path.join(path.resolve(root), DEFAULT_SAVING_DIRECTORY));
        const custom = await resolveServerConfig(
            { SF_METASCOPE_REPOSITORY: root, SF_METASCOPE_BASE_DIR: tmp },
            os.tmpdir(),
        );
        assert.equal(custom.repositoryRoot, path.resolve(root));
        assert.equal(custom.savingRoot, path.resolve(tmp));
    });

    it('リポジトリのフォルダがなければ、分かるエラーにする', async () => {
        await assert.rejects(
            resolveServerConfig({ SF_METASCOPE_REPOSITORY: path.join(tmp, 'missing') }),
            /リポジトリのフォルダがありません/,
        );
    });

    it('読み込みは 1 回だけ行い、ツールはそれを待つ (関数で渡せる)', async () => {
        const load = makeProcessorLoader({
            repositoryRoot: repositoryOf('after'),
            savingRoot: path.join(tmp, 'saved'),
        });
        const tools = new Map<string, (args: Record<string, unknown>) => Promise<unknown>>();
        const server = {
            registerTool: (name: string, _config: unknown, handler: never) =>
                tools.set(name, handler),
        } as unknown as McpServer;
        registerReportTools(server, load);
        // ツールを呼ぶと読み込みを待つ (まだ始まっていなければ始める)
        const result = (await tools.get('get_report_data')!({ provider: 'flow.list' })) as {
            content: { text: string }[];
        };
        assert.ok(Array.isArray(JSON.parse(result.content[0]!.text)));
        // 同じ processor を返す
        assert.equal(await load(), await load());
        // 前回の解析の結果がなければ、今の状態を基準として保存する
        assert.equal(await (await load()).hasSaved(), true);
    });
});
