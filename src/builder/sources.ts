import path from 'node:path';

import { SENSITIVE_PROPERTIES } from '../analyzer/report/mask';
import type { Repository } from '../analyzer/unit/repository';

// レポートの行に付けるソースの抜き出し (docs/implementation-roadmap.md 4.3 の SourceSnippet)。
// 行の filePath (単位のファイル) と sourceKeys.sourceKey から、解析結果の sourceObject (位置とソースの文字列) を引く。
// sourceKey は「種類と位置」から作るので、別のファイルの同じ位置では同じ値になる (単位をまたいでは一意でない)。
// そのため単位のファイルと組にして引く。削除された行 (status: removed) は、削除前 (before) のソースから引く。
// 機密になりうる値を持つ種類 (report/mask.ts の SENSITIVE_PROPERTIES。指定ログイン情報・メールなど) のソースは出さない

/** 行に付けるソースの抜き出し (_source) */
export type SourceExcerpt = {
    filePath: string;
    /** 1 から数えた開始の行 */
    startLine: number;
    text: string;
    /** 長いので途中で切った */
    truncated?: true;
};

/** 抜き出しの行数の上限 */
const MAX_LINES = 40;

type SourceObjectEntry = {
    context?: string;
    source?: {
        sourceKey: string;
        filePath?: string;
        start: { line: number };
    }[];
};

const indexes = new WeakMap<Repository, Map<string, SourceExcerpt>>();

/** 引くときのキー (単位のファイル (絶対パス) と sourceKey) */
const keyOf = (unitFile: string, sourceKey: string) => `${path.resolve(unitFile)}|${sourceKey}`;

/** リポジトリの (単位のファイル, sourceKey) → 抜き出し (同じリポジトリには、作ったものを使い回す) */
export const sourceIndexOf = (repository: Repository): Map<string, SourceExcerpt> => {
    let index = indexes.get(repository);
    if (index) return index;
    index = new Map();
    for (const [, results] of repository.entries()) {
        for (const result of results) {
            const unit = result as unknown as {
                dataType: string;
                filePath: string;
                result?: { sourceObject?: SourceObjectEntry[] };
            };
            if (Object.hasOwn(SENSITIVE_PROPERTIES, unit.dataType)) continue;
            const unitPath = path
                .relative(repository.root, unit.filePath)
                .split(path.sep)
                .join('/');
            for (const entry of unit.result?.sourceObject ?? []) {
                if (typeof entry.context !== 'string') continue;
                const lines = entry.context.split('\n');
                const text = lines.slice(0, MAX_LINES).join('\n');
                for (const source of entry.source ?? []) {
                    index.set(keyOf(unit.filePath, source.sourceKey), {
                        // 単位の中のファイル (LWC・オブジェクト) は、単位のフォルダからのパス
                        filePath: source.filePath
                            ? path.posix.join(path.posix.dirname(unitPath), source.filePath)
                            : unitPath,
                        startLine: source.start.line,
                        text,
                        ...(lines.length > MAX_LINES ? { truncated: true as const } : {}),
                    });
                }
            }
        }
    }
    indexes.set(repository, index);
    return index;
};

/**
 * 行の並びの各行に、位置 (sourceKeys) と単位のファイル (filePath) があれば抜き出し (_source) を付ける。
 * 削除された行は before (なければ付けない)、ほかは after から引く。行の並びでなければそのまま
 */
export const attachSources = (
    data: unknown,
    repositories: { before?: Repository | undefined; after: Repository },
): unknown => {
    if (!Array.isArray(data)) return data;
    return data.map((row: unknown) => {
        const value = row as {
            status?: unknown;
            filePath?: unknown;
            sourceKeys?: { sourceKey?: unknown };
        } | null;
        const key = value?.sourceKeys?.sourceKey;
        const repository = value?.status === 'removed' ? repositories.before : repositories.after;
        if (typeof key !== 'string' || typeof value?.filePath !== 'string' || !repository) {
            return row;
        }
        const filePath = path.isAbsolute(value.filePath)
            ? value.filePath
            : path.join(repository.root, value.filePath);
        const excerpt = sourceIndexOf(repository).get(keyOf(filePath, key));
        return excerpt ? { ...(row as object), _source: excerpt } : row;
    });
};
