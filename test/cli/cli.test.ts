import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { repositoryOf } from '../../docs/examples/paths';
import { closeAllStoreBackends } from '../../src/analyzer/unit/storeSqlite';
import { runCli } from '../../src/cli/index';
import { REPORT_TEMPLATES } from '../../src/report/templateList';

// コマンドライン (src/cli/index.ts)。サンプルのリポジトリ (after) で、雛形 → 確かめる → HTML を作る、を通す

describe('コマンドライン', () => {
    let tmp: string;
    let template: string;
    before(async () => {
        tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cli-'));
        template = path.join(tmp, 'viewer.html');
        await fs.writeFile(
            template,
            '<html><head><script type="application/json" id="metascope-report">null</script></head></html>',
        );
    });
    after(async () => {
        closeAllStoreBackends();
        await fs.rm(tmp, { recursive: true, force: true });
    });

    /** コマンドを実行して、終了コードと出力を返す */
    const run = async (...argv: string[]) => {
        let stdout = '';
        let stderr = '';
        const code = await runCli(argv, {
            stdout: (text) => (stdout += text),
            stderr: (text) => (stderr += text),
            env: {
                SF_METASCOPE_REPOSITORY: repositoryOf('after'),
                SF_METASCOPE_BASE_DIR: path.join(tmp, 'saved'),
                SF_METASCOPE_THREADS: '0',
            },
            cwd: tmp,
            templatePath: template,
        });
        return { code, stdout, stderr };
    };

    it('使い方の誤りは終了コード 2。雛形と provider の一覧', async () => {
        assert.equal((await run()).code, 2);
        assert.equal((await run('report', 'unknown')).code, 2);
        assert.equal((await run('report', 'new', 'no_such_template')).code, 2);
        assert.equal((await run('report', '--help')).code, 0);
        const templates = await run('report', 'templates');
        assert.equal(templates.code, 0);
        assert.equal(
            templates.stdout.trim().split('\n').length,
            Object.keys(REPORT_TEMPLATES).length,
        );
        assert.match((await run('report', 'providers')).stdout, /apex\.methodFlow/);
    });

    it('new → validate → build (1 件 1 ページの文書は目次とページを書く)', async () => {
        const file = path.join(tmp, 'apex.json');
        assert.equal((await run('report', 'new', 'apex_specification', '--out', file)).code, 0);
        const { $schema, ...document } = JSON.parse(await fs.readFile(file, 'utf8'));
        assert.deepEqual(document, REPORT_TEMPLATES.apex_specification!.document());
        // 書いた文書から、パッケージの文書の JSON Schema を指す
        assert.match($schema, /report-document\.schema\.json$/);
        assert.ok(await fs.stat(path.resolve(tmp, $schema)));
        const validated = await run('report', 'validate', file);
        assert.equal(validated.code, 0, validated.stderr);
        assert.equal(JSON.parse(validated.stdout).pages, 11);
        const built = await run('report', 'build', file, '--out', path.join(tmp, 'out'));
        assert.equal(built.code, 0, built.stderr);
        const written = JSON.parse(built.stdout).path as string;
        assert.equal(path.basename(written), 'index.html');
        const pages = await fs.readdir(path.join(path.dirname(written), 'pages'));
        assert.ok(pages.includes('AccountService.html'));
        // ページに分けない文書は、--out の .html にそのまま書く
        const single = path.join(tmp, 'system.json');
        await run('report', 'new', 'system_overview', '--out', single);
        const target = path.join(tmp, 'single', 'system.html');
        const one = await run('report', 'build', single, '--out', target);
        assert.equal(one.code, 0, one.stderr);
        assert.equal(JSON.parse(one.stdout).path, target);
    });

    it('notes: notes のキーの一覧。--missing で未記入だけ', async () => {
        const file = path.join(tmp, 'apex-notes.json');
        await run('report', 'new', 'apex_specification', '--out', file);
        const all = await run('report', 'notes', file);
        assert.equal(all.code, 0, all.stderr);
        const keys = JSON.parse(all.stdout).keys as { key: string; written: boolean }[];
        assert.ok(keys.some((k) => k.key === 'AccountService'));
        const missing = await run('report', 'notes', file, '--missing');
        const missingKeys = JSON.parse(missing.stdout).keys as { written: boolean }[];
        assert.equal(missingKeys.length, keys.filter((k) => !k.written).length);
    });

    it('export: 文書のデータの行の並びを、データの名前ごとの CSV に書き出す', async () => {
        const file = path.join(tmp, 'system-export.json');
        await run('report', 'new', 'system_overview', '--out', file);
        const out = path.join(tmp, 'csv');
        const exported = await run('report', 'export', file, '--out', out);
        assert.equal(exported.code, 0, exported.stderr);
        const files = JSON.parse(exported.stdout).files as string[];
        assert.ok(files.length > 0);
        assert.ok(files.every((f) => path.dirname(f) === out && f.endsWith('.csv')));
        // 先頭は BOM、1 行目は列の見出し
        const text = await fs.readFile(files[0]!, 'utf8');
        assert.equal(text.charCodeAt(0), 0xfeff);
        assert.ok(text.split('\r\n')[0]!.length > 1);
    });

    it('文書の問題・引数の誤りは終了コード 1 で、問題を出す', async () => {
        const file = path.join(tmp, 'lwc.json');
        await run('report', 'new', 'lwc_overview', '--out', file);
        const unknown = await run('report', 'validate', file, '--param', 'depth=2');
        assert.equal(unknown.code, 1);
        assert.match(unknown.stderr, /params\.depth/);
        assert.equal((await run('report', 'validate', file, '--param', 'oops')).code, 2);
        assert.equal((await run('report', 'validate', path.join(tmp, 'none.json'))).code, 1);
    });

    it('data: provider のデータを JSON で出す。引数の誤り・比べる時点のない差分は 1', async () => {
        const flows = await run(
            'report',
            'data',
            'apex.callFlow',
            '--args',
            '{"members":["AccountService.execute"]}',
        );
        assert.equal(flows.code, 0, flows.stderr);
        assert.equal(JSON.parse(flows.stdout)[0].start, 'AccountService.execute');
        assert.equal(
            (await run('report', 'data', 'apex.callFlow', '--args', '{"depth":"x"}')).code,
            1,
        );
        assert.equal((await run('report', 'data', 'permission.diffs')).code, 1);
        assert.equal((await run('report', 'data', 'permission.diffs', '--diff')).code, 0);
    });
});
