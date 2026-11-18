import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import {
    PROVIDER_DEFINITIONS,
    comparisonRequiredMessage,
    isReportProviderName,
    providerDefinitionOf,
    requiresComparison,
    runReportProvider,
} from '../analyzer/report';
import type { CompareRange } from '../analyzer/unit/gitRange';
import type { RepositoryProcessor } from '../analyzer/unit/processor';
import { closeAllStoreBackends } from '../analyzer/unit/storeSqlite';
import { comparedInputOf, dataSummaryOf, inputForOf, reportOutputOf } from '../builder/inputs';
import { resolveReport, writeReportSite } from '../builder/reportBuilder';
import { makeProcessorLoader, resolveServerConfig } from '../mcp/context';
import { DOCUMENT_SCHEMA_FILE } from '../report/documentSchema';
import { REPORT_TEMPLATES } from '../report/templateList';

// コマンドライン (docs/todo.md 3.2 の CLI)。AI (MCP) を使わずに、自分のリポジトリでレポートを作る。
// リポジトリと保存先は MCP のサーバーと同じ設定 (環境変数 SF_METASCOPE_REPOSITORY・SF_METASCOPE_BASE_DIR・
// SF_METASCOPE_THREADS)。--repo でリポジトリを指定できる。
//
//   sf-metascope report templates                      雛形の一覧
//   sf-metascope report new <雛形> [--out <file>]      雛形の文書 (JSON) を書く
//   sf-metascope report validate <文書>                文書を確かめる (provider も実行する)
//   sf-metascope report build <文書> [--out <path>]    文書から HTML を作る
//   sf-metascope report data <provider> [--args <json>] provider のデータを見る (列を決めるため)
//   sf-metascope report providers                      provider の一覧
//
// 共通: --repo <フォルダ>・--diff (保存した基準と比べる)・--compare <from>[...<to>] (git の範囲)・
// --param <名前>=<値> (文書の引数。値は JSON として読めれば JSON、読めなければ文字)

/** 出力先 (テストで差し替える) */
export type CliIo = {
    stdout: (text: string) => void;
    stderr: (text: string) => void;
    env?: NodeJS.ProcessEnv;
    cwd?: string;
    /** 事前にビルドした viewer の HTML (テストで差し替える) */
    templatePath?: string;
};

const USAGE = `使い方: sf-metascope report <コマンド> [引数]

コマンド:
  templates                         雛形の一覧
  new <雛形> [--out <file>]          雛形の文書 (JSON) を書く (--out がなければ標準出力)
  validate <文書.json>               文書を確かめる (provider も実行し、データの件数を出す)
  build <文書.json> [--out <path>]   文書から HTML を作る (--out は .html のファイルかフォルダ。既定は <保存先>/reports)
  data <provider> [--args <json>]    provider のデータを JSON で出す
  providers                         provider の一覧

共通の引数:
  --repo <フォルダ>                  解析するリポジトリ (既定は SF_METASCOPE_REPOSITORY か今のフォルダ)
  --diff                            保存した基準と作業ツリーを比べる
  --compare <from>[...<to>]         git の範囲で比べる (main は main...作業ツリー、main...HEAD など)
  --param <名前>=<値>                文書の引数 (いくつでも。値は JSON として読めれば JSON)
`;

/** 使い方の誤り (終了コード 2) */
class UsageError extends Error {}

const parseCompare = (text: string | undefined): CompareRange | undefined => {
    if (!text) return undefined;
    const [from, to] = text.split('...');
    if (!from) throw new UsageError(`--compare の形が誤っています: ${text}`);
    return to ? { from, to } : { from };
};

const parseParams = (texts: string[] | undefined): Record<string, unknown> | undefined => {
    if (!texts?.length) return undefined;
    const params: Record<string, unknown> = {};
    for (const text of texts) {
        const index = text.indexOf('=');
        if (index <= 0)
            throw new UsageError(`--param は <名前>=<値> の形で書いてください: ${text}`);
        const value = text.slice(index + 1);
        try {
            params[text.slice(0, index)] = JSON.parse(value);
        } catch {
            params[text.slice(0, index)] = value;
        }
    }
    return params;
};

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

/** 文書の JSON Schema のファイル (パッケージの docs/catalog/。見つからなければ undefined) */
const documentSchemaPath = async (): Promise<string | undefined> => {
    // src/cli/index.ts からも dist/node/cli/index.js からも、上にたどってパッケージの docs/catalog/ を探す
    let dir = path.dirname(fileURLToPath(import.meta.url));
    for (let i = 0; i < 5; i++) {
        const candidate = path.join(dir, 'docs', 'catalog', DOCUMENT_SCHEMA_FILE);
        if (await fs.stat(candidate).catch(() => undefined)) return candidate;
        dir = path.dirname(dir);
    }
    return undefined;
};

/** コマンドを実行して、終了コードを返す (0: 成功 / 1: 文書の問題・実行の失敗 / 2: 使い方の誤り) */
export const runCli = async (argv: string[], io: CliIo): Promise<number> => {
    const env = io.env ?? process.env;
    const cwd = io.cwd ?? process.cwd();
    let processor: RepositoryProcessor | undefined;
    try {
        const { values, positionals } = parseArgs({
            args: argv,
            allowPositionals: true,
            options: {
                repo: { type: 'string' },
                out: { type: 'string' },
                diff: { type: 'boolean' },
                compare: { type: 'string' },
                param: { type: 'string', multiple: true },
                args: { type: 'string' },
                help: { type: 'boolean', short: 'h' },
            },
        });
        const [group, command, target] = positionals;
        if (values.help || group !== 'report' || !command) {
            (values.help ? io.stdout : io.stderr)(USAGE);
            return values.help ? 0 : 2;
        }
        const loadProcessor = async () => {
            const config = await resolveServerConfig(
                values.repo ? { ...env, SF_METASCOPE_REPOSITORY: values.repo } : env,
                cwd,
            );
            io.stderr(`リポジトリを読み込んでいます: ${config.repositoryRoot}\n`);
            processor = await makeProcessorLoader(config)();
            return processor;
        };
        const compare = parseCompare(values.compare);
        const params = parseParams(values.param);

        switch (command) {
            case 'templates': {
                for (const [name, entry] of Object.entries(REPORT_TEMPLATES)) {
                    io.stdout(`${name.padEnd(22)} ${entry.description}\n`);
                }
                return 0;
            }
            case 'providers': {
                for (const [name, definition] of Object.entries(PROVIDER_DEFINITIONS)) {
                    io.stdout(`${name.padEnd(28)} ${definition.description.split('。')[0]}\n`);
                }
                return 0;
            }
            case 'new': {
                const entry = target ? REPORT_TEMPLATES[target] : undefined;
                if (!entry) {
                    throw new UsageError(
                        `雛形の名前を書いてください (${Object.keys(REPORT_TEMPLATES).join(', ')})`,
                    );
                }
                const text = json(entry.document());
                if (!values.out) {
                    io.stdout(text);
                    return 0;
                }
                const out = path.resolve(cwd, values.out);
                await fs.mkdir(path.dirname(out), { recursive: true });
                // ファイルに書くときは、文書の JSON Schema を指す $schema を付ける (エディターで補完が効く)
                const schema = await documentSchemaPath();
                await fs.writeFile(
                    out,
                    schema
                        ? json({
                              $schema: path
                                  .relative(path.dirname(out), schema)
                                  .split(path.sep)
                                  .join('/'),
                              ...entry.document(),
                          })
                        : text,
                );
                io.stderr(`雛形を書きました: ${out}\n`);
                return 0;
            }
            case 'data': {
                if (!target || !isReportProviderName(target)) {
                    throw new UsageError(
                        `provider の名前を書いてください: ${target ?? ''} (report providers で一覧)`,
                    );
                }
                let args: unknown = {};
                try {
                    args = values.args ? JSON.parse(values.args) : {};
                } catch {
                    throw new UsageError(`--args は JSON で書いてください: ${values.args}`);
                }
                const parsed = providerDefinitionOf(target).args.safeParse(args);
                if (!parsed.success) {
                    io.stderr(
                        json({ error: `Invalid args for ${target}`, issues: parsed.error.issues }),
                    );
                    return 1;
                }
                const { input } = await comparedInputOf(
                    await loadProcessor(),
                    compare,
                    values.diff,
                );
                if (requiresComparison(target) && !input.before) {
                    io.stderr(`${comparisonRequiredMessage(target)}\n`);
                    return 1;
                }
                io.stdout(json(runReportProvider(target, input, args as never)));
                return 0;
            }
            case 'validate':
            case 'build': {
                if (!target) throw new UsageError('文書 (JSON) のファイルを書いてください');
                const file = path.resolve(cwd, target);
                let document: unknown;
                try {
                    document = JSON.parse(await fs.readFile(file, 'utf8'));
                } catch (error) {
                    io.stderr(
                        `文書を読めません: ${file} (${error instanceof Error ? error.message : String(error)})\n`,
                    );
                    return 1;
                }
                const loaded = await loadProcessor();
                const { input, compared } = await comparedInputOf(
                    loaded,
                    compare,
                    values.diff,
                    document,
                );
                const inputFor = await inputForOf(loaded, document);
                const resolved = resolveReport(document, input, {
                    compared,
                    inputFor,
                    ...(params ? { params } : {}),
                });
                if (!resolved.ok) {
                    io.stderr(json({ ok: false, issues: resolved.issues }));
                    return 1;
                }
                for (const warning of resolved.warnings ?? []) {
                    io.stderr(`警告: ${warning.path}: ${warning.message}\n`);
                }
                const summary = {
                    ok: true,
                    data: dataSummaryOf(resolved.report.spec.state),
                    ...(resolved.pages ? { pages: resolved.pages.length } : {}),
                };
                if (command === 'validate') {
                    io.stdout(json(summary));
                    return 0;
                }
                const hasPages = Boolean(resolved.pages?.length);
                const out = values.out
                    ? values.out.endsWith('.html')
                        ? path.resolve(cwd, values.out)
                        : reportOutputOf(
                              path.resolve(cwd, values.out),
                              resolved.report.title,
                              hasPages,
                          )
                    : reportOutputOf(
                          path.join(loaded.savingRoot, 'reports'),
                          resolved.report.title,
                          hasPages,
                      );
                const written = await writeReportSite(resolved, out, io.templatePath);
                io.stdout(json({ ...summary, path: written }));
                return 0;
            }
            default:
                throw new UsageError(`知らないコマンドです: ${command}`);
        }
    } catch (error) {
        if (
            error instanceof UsageError ||
            (error as { code?: string }).code?.startsWith('ERR_PARSE_ARGS')
        ) {
            io.stderr(`${(error as Error).message}\n\n${USAGE}`);
            return 2;
        }
        io.stderr(`失敗しました: ${error instanceof Error ? error.message : String(error)}\n`);
        return 1;
    } finally {
        await processor?.close();
    }
};

/** プロセスの引数で実行し、終了コードで終わる (bin/sf-metascope.mjs・npm run cli) */
export const main = async (): Promise<void> => {
    const code = await runCli(process.argv.slice(2), {
        stdout: (text) => process.stdout.write(text),
        stderr: (text) => process.stderr.write(text),
    });
    closeAllStoreBackends();
    process.exit(code);
};

// 直接実行したとき (npm run cli)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    await main();
}
