import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { repositoryOf } from '../../docs/examples/paths';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { RepositoryProcessor } from '../../src/analyzer/unit/processor';
import { registerDependencyTools } from '../../src/mcp/dependencyTools';
import { registerReportTools } from '../../src/mcp/reportTools';

type Handler = (args: Record<string, unknown>) => Promise<{ content: { text: string }[] }>;

/** registerTool の呼び出しを集めるだけのサーバー */
const fakeServer = () => {
    const tools = new Map<string, Handler>();
    const server = {
        registerTool: (name: string, _config: unknown, handler: Handler) =>
            tools.set(name, handler),
    } as unknown as McpServer;
    return { server, tools };
};

const call = async (handler: Handler | undefined, args: Record<string, unknown> = {}) =>
    JSON.parse((await handler!(args)).content[0]!.text);

describe('MCP の依存関係のツール', () => {
    const { server, tools } = fakeServer();
    registerDependencyTools(server, repositoryOf('after'));

    it('get_dependents: 項目を使っているもの', async () => {
        const result = await call(tools.get('get_dependents'), {
            target: 'field:Invoice__c.Amount__c',
        });
        assert.equal(result.found, true);
        assert.ok(
            result.dependents.some((d: { id: string }) => d.id === 'permissionSet:Invoice_Manager'),
        );
    });

    it('get_missing_references と list_units', async () => {
        const missing = await call(tools.get('get_missing_references'));
        assert.ok(missing.some((m: { target: string }) => m.target === 'field:Account.Missing__c'));
        const units = await call(tools.get('list_units'));
        // sfdx-project.json の packageDirectories (force-app) の外の scripts/apex は含まない
        assert.deepEqual(units.anonymousApex, []);
        assert.ok(units.apexClass.length > 0);
    });
});

describe('MCP のレポートのデータのツール', () => {
    it('get_report_data: provider のデータを返し、機密の値は伏せる', async () => {
        const tmp = await mkdtemp(path.join(os.tmpdir(), 'report-tools-'));
        try {
            const processor = await RepositoryProcessor.create(tmp, repositoryOf('after'));
            const { server, tools } = fakeServer();
            registerReportTools(server, processor);
            const providers = await call(tools.get('list_report_providers'));
            assert.ok(providers.includes('crossRef.references'));
            const rows = await call(tools.get('get_report_data'), {
                provider: 'crossRef.references',
            });
            assert.ok(
                rows.some((row: { target: string }) => row.target === 'Invoice__c.Amount__c'),
            );
            assert.ok(!JSON.stringify(rows).includes('https://'));
            const unknown = await call(tools.get('get_report_data'), { provider: 'nope' });
            assert.match(unknown.error, /Unknown provider/);
        } finally {
            await rm(tmp, { recursive: true, force: true });
        }
    });
});
