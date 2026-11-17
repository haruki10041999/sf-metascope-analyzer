import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { repositoryOf } from '../../docs/examples/paths';
import { loadSampleInput } from '../../docs/examples/report/scripts/run-report';
import { runReportProvider } from '../../src/analyzer/report';
import {
    RepositoryProcessor,
    WORKING_TREE,
    resolveCompareRange,
    closeAllStoreBackends,
} from '../../src/analyzer/unit';
import { registerReportTools } from '../../src/mcp/reportTools';
import { impactAnalysisTemplate } from '../../src/report/templates';

// git の範囲で比べる (docs/implementation-roadmap.md の R5)。
// 一時フォルダに git のリポジトリを作り、main に before、feature に after をコミットする。
// sfdx のプロジェクトは git のルートの下のフォルダ (project/) に置く

const git = (cwd: string, ...args: string[]) =>
    execFileSync('git', ['-c', 'user.name=test', '-c', 'user.email=test@example.com', ...args], {
        cwd,
        encoding: 'utf8',
    }).trim();

/** 公開の形の変化 (名前と status。位置・パスは比べない) */
const shapeOf = (rows: unknown) =>
    (rows as { status?: string; owner?: string; name: string; memberType: string }[])
        .map((row) => `${row.status} ${row.owner ?? ''}#${row.memberType}:${row.name}`)
        .sort();

describe('git の範囲で比べる', () => {
    let tmp: string;
    let gitRoot: string;
    let project: string;
    let processor: RepositoryProcessor;

    before(async () => {
        tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'git-range-'));
        gitRoot = path.join(tmp, 'repo');
        project = path.join(gitRoot, 'project');
        await fs.cp(repositoryOf('before'), project, { recursive: true });
        git(gitRoot, 'init', '-q', '-b', 'main');
        git(gitRoot, 'add', '-A');
        git(gitRoot, 'commit', '-q', '-m', 'before');
        git(gitRoot, 'checkout', '-q', '-b', 'feature');
        await fs.rm(project, { recursive: true });
        await fs.cp(repositoryOf('after'), project, { recursive: true });
        git(gitRoot, 'add', '-A');
        git(gitRoot, 'commit', '-q', '-m', 'after');
        processor = await RepositoryProcessor.create(path.join(tmp, 'saved'), project);
    });
    after(async () => {
        closeAllStoreBackends();
        await fs.rm(tmp, { recursive: true, force: true });
    });

    it('範囲を分岐点のコミットと、後の時点 (コミットか作業ツリー) にする', async () => {
        const main = git(gitRoot, 'rev-parse', 'main');
        const head = git(gitRoot, 'rev-parse', 'HEAD');
        const committed = await resolveCompareRange(project, { from: 'main', to: 'HEAD' });
        assert.equal(committed.before, main);
        assert.equal(committed.after, head);
        assert.equal(committed.subdirectory, 'project');
        assert.match(committed.label, /^main\.\.\.HEAD \(\w{7} → \w{7}\)$/);
        const working = await resolveCompareRange(project, { from: 'main' });
        assert.equal(working.after, WORKING_TREE);
        await assert.rejects(
            resolveCompareRange(project, { from: 'no-such-branch' }),
            /リビジョンがありません/,
        );
    });

    it('git の範囲で比べた差分は、フォルダ (before / after) で比べた差分と同じ', async () => {
        const { input, compared } = await processor.getComparedInput({ from: 'main', to: 'HEAD' });
        assert.match(compared, /^main\.\.\.HEAD/);
        const expected = await loadSampleInput();
        for (const provider of ['apex.interface', 'lwc.interface'] as const) {
            assert.deepEqual(
                shapeOf(runReportProvider(provider, input, { onlyChanged: true })),
                shapeOf(runReportProvider(provider, expected, { onlyChanged: true })),
                provider,
            );
        }
        // 同じコミットは読み直さない (メモリに残した解析結果)
        const again = await processor.getComparedInput({ from: 'main', to: 'HEAD' });
        assert.equal(again.input.before, input.before);
    });

    it('作業ツリーの未コミットの変更も比べられる', async () => {
        const file = path.join(project, 'force-app', 'main', 'default', 'classes', 'NewHelper.cls');
        const original = await fs.readFile(file, 'utf8');
        await fs.writeFile(
            file,
            original.replace(
                'public static void run() {}',
                'public static void run() {}\n    public static void more() {}',
            ),
        );
        try {
            await processor.reset();
            const { input } = await processor.getComparedInput({ from: 'main' });
            assert.ok(
                shapeOf(runReportProvider('apex.interface', input, { onlyChanged: true })).includes(
                    'added NewHelper#method:more',
                ),
            );
        } finally {
            await fs.writeFile(file, original);
            await processor.reset();
        }
    });

    it('MCP: compare (ツールの引数か文書) で範囲を選び、レポートに比べた時点が出る。誤りは問題として返す', async () => {
        const tools = new Map<string, (args: Record<string, unknown>) => Promise<unknown>>();
        const server = {
            registerTool: (name: string, _config: unknown, handler: never) =>
                tools.set(name, handler),
        } as unknown as McpServer;
        const template = path.join(tmp, 'template.html');
        await fs.writeFile(
            template,
            '<script type="application/json" id="metascope-report">null</script>',
        );
        registerReportTools(server, processor, {
            reportDirectory: path.join(tmp, 'reports'),
            templatePath: template,
        });
        const call = async (name: string, args: Record<string, unknown>) =>
            JSON.parse(
                ((await tools.get(name)!(args)) as { content: { text: string }[] }).content[0]!
                    .text,
            );

        const document = {
            ...impactAnalysisTemplate('apexClass:AccountService'),
            compare: { from: 'main', to: 'HEAD' },
        };
        const built = await call('build_report', { document });
        assert.equal(built.ok, true, JSON.stringify(built.issues));
        assert.match(await fs.readFile(built.path, 'utf8'), /"compared":"main\.\.\.HEAD/);

        const data = await call('get_report_data', {
            provider: 'apex.interface',
            args: { onlyChanged: true },
            compare: { from: 'main', to: 'HEAD' },
        });
        assert.ok(
            data.some(
                (row: { name: string; status: string }) =>
                    row.name === 'calc' && row.status === 'added',
            ),
        );

        const wrong = await call('validate_report_spec', {
            document,
            compare: { from: 'no-such-branch' },
        });
        assert.equal(wrong.ok, false);
        assert.equal(wrong.issues[0].path, 'compare');
    });
});
