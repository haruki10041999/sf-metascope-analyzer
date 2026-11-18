import fs from 'node:fs/promises';
import { availableParallelism } from 'node:os';
import path from 'node:path';

import { RepositoryProcessor } from '../analyzer/unit/processor';

// MCP のサーバーの設定と、リポジトリの読み込み (docs/implementation-roadmap.md 4.5 の初期処理)。
// 接続を先にし、リポジトリの読み込みは裏で進める (ツールは読み込みの終わりを待つ)

/** ツールに渡す processor。読み込みを待つ関数か、読み込み済みの processor (テスト) */
export type ProcessorSource = RepositoryProcessor | (() => Promise<RepositoryProcessor>);

/** ProcessorSource から、processor を待つ関数を作る */
export const processorGetter = (source: ProcessorSource): (() => Promise<RepositoryProcessor>) =>
    typeof source === 'function' ? source : async () => source;

/** サーバーの設定 */
export type ServerConfig = {
    /** 解析するリポジトリ (sfdx のプロジェクト) のルート */
    repositoryRoot: string;
    /** 保存先 (前回の解析の結果など) */
    savingRoot: string;
    /** parse に使う worker_threads の数 (0 はこのスレッドだけ) */
    threads?: number;
};

/**
 * parse のスレッドの数の既定。ビルド版 (dist/node の .js) で動いているときだけ並列にする
 * (ttsx で動かすと、スレッドごとに準備に十数秒かかる)。NPSP では 8 スレッドで約 5 倍速く、それより多くしても速くならなかった
 */
const defaultThreads = (): number =>
    import.meta.url.endsWith('.js') ? Math.max(0, Math.min(8, availableParallelism() - 1)) : 0;

/** 保存先の既定 (リポジトリの中。.gitignore に足すこと) */
export const DEFAULT_SAVING_DIRECTORY = '.sf-metascope';

/**
 * 環境変数から設定を作る。
 * SF_METASCOPE_REPOSITORY (なければ今のフォルダ)・SF_METASCOPE_BASE_DIR (なければ <リポジトリ>/.sf-metascope)・
 * SF_METASCOPE_THREADS (parse のスレッドの数。0 で並列にしない。なければビルド版のときだけ最大 8)
 */
export const resolveServerConfig = async (
    env: NodeJS.ProcessEnv = process.env,
    cwd: string = process.cwd(),
): Promise<ServerConfig> => {
    const repositoryRoot = path.resolve(cwd, env.SF_METASCOPE_REPOSITORY || '.');
    const stat = await fs.stat(repositoryRoot).catch(() => undefined);
    if (!stat?.isDirectory()) {
        throw new Error(
            `リポジトリのフォルダがありません: ${repositoryRoot} (SF_METASCOPE_REPOSITORY か、起動するフォルダを確かめてください)`,
        );
    }
    const savingRoot = path.resolve(
        repositoryRoot,
        env.SF_METASCOPE_BASE_DIR || DEFAULT_SAVING_DIRECTORY,
    );
    const threadsText = env.SF_METASCOPE_THREADS;
    const threads = threadsText ? Number(threadsText) : defaultThreads();
    if (!Number.isInteger(threads) || threads < 0) {
        throw new Error(`SF_METASCOPE_THREADS は 0 以上の整数にしてください: ${threadsText ?? ''}`);
    }
    return { repositoryRoot, savingRoot, threads };
};

/**
 * リポジトリの読み込みを 1 回だけ行う関数を作る (最初に呼んだときに始め、失敗したら次に呼んだときにやり直す)。
 * 前回の解析の結果がなければ、今の状態を基準 (before) として保存する
 */
export const makeProcessorLoader = (config: ServerConfig): (() => Promise<RepositoryProcessor>) => {
    let loading: Promise<RepositoryProcessor> | undefined;
    return () => {
        loading ??= (async () => {
            const processor = await RepositoryProcessor.create(
                config.savingRoot,
                config.repositoryRoot,
                config.threads ? { threads: config.threads } : {},
            );
            if (!(await processor.hasSaved())) await processor.save();
            return processor;
        })().catch((error: unknown) => {
            loading = undefined;
            throw error;
        });
        return loading;
    };
};

/** サーバーの説明 (クライアントが LLM に渡す、使い方の流れ) */
export const SERVER_INSTRUCTIONS = `Salesforce のリポジトリ (sfdx のプロジェクト) を解析し、ドキュメントとコードの理解を助けるサーバーです。解析結果を返し、利用者の求めに合わせたレポート (1 つの HTML) を作ります。差分と影響の調査は補助の用途です。
- 既定は今の状態 (作業ツリー) のすべてを返します (行に status はありません)。
- 差分を見るときだけ、diff: true (保存した基準 (save_baseline で保存) → 作業ツリー) か compare ({ "from": "main" } は main...作業ツリー、{ "from": "main", "to": "HEAD" } は main...HEAD) を get_report_data・validate_report_spec・build_report か文書に書きます。各行の status (added・removed・changed・unchanged) が差分です。差分だけを返す provider (requiresComparison) は、diff か compare が要ります。
- レポートの流れ: list_report_components (書き方の決まりと一覧) → get_report_data (材料を読む) → 文書 ({ title, data, spec }) を書く → validate_report_spec → build_report。
- レポートの形は決まっていません。利用者の求めに合わせて部品と provider を選んで組みます。雛形 (出発点) はプロンプトにあります: system_overview (システムの構成)・object_definition (オブジェクト定義書)・apex_specification (Apex の仕様書)・lwc_overview (LWC のコンポーネント一覧)・translation_overview (翻訳の状況)・metadata_inventory (メタデータの棚卸し)・automation_overview (自動化)・security_overview (セキュリティと共有)・ui_overview (画面)・integration_overview (連携)・analytics_overview (分析)・feature_overview (機能のまとまり。起点から依存関係をたどった範囲)・permission_overview (権限の一覧)・impact_analysis (変更の影響)・release_review (リリース前のレビュー。差分)。
- 数値・一覧は解析の結果をそのまま使います。文書には書き写さず、data で provider を宣言して { "$state": "/data/<名前>" } で指します。AI が書くのは文章 (Narrative) と構成だけです。
- 依存関係: get_dependents (使っているもの)・get_dependencies (使っているもの側)・get_change_impact (変更の影響)・get_missing_references (ない参照先)・list_units。
- 解析結果のノード (メソッド・文・テンプレートの要素・フローの要素など): list_node_kinds (種類と数) → find_nodes (種類・objectKey で探し、ファイルと行を返す)。
- 機密になりうる値 (指定ログイン情報の URL など) は伏せて返します。
- 最初の呼び出しは、リポジトリの読み込みが終わるまで待ちます。`;
