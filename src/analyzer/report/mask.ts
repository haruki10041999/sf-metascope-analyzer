import { shareDependencyGraph } from '../unit/dependencies';
import type { Repository } from '../unit/repository';
import type { UnitParseResult } from '../unit/unitType';

// 機密になりうる値を伏せる。レポート・MCP で解析結果を外に出すとき (AI に渡すときなど) に使う。
// 解析・Diff・保存は伏せない (伏せると差分が分からなくなる)。方針: docs/analysis-plan.md 5.7

/** 伏せた値 */
export const MASKED = '***';

/**
 * 種類 (dataType) ごとの、伏せるプロパティの名前 (どの深さでも)。
 * URL・ユーザー名・パラメーターの値・カスタムメタデータの値・メールの本文など
 */
export const SENSITIVE_PROPERTIES: Readonly<Record<string, readonly string[]>> = {
    namedCredential: ['endpoint', 'username', 'password', 'parameterValue', 'oauthScope'],
    remoteSiteSetting: ['url'],
    customMetadata: ['value'],
    emailTemplate: ['body', 'content', 'subject'],
    connectedApp: ['consumerKey', 'consumerSecret', 'callbackUrl'],
    authProvider: ['consumerKey', 'consumerSecret'],
    externalCredential: ['parameterValue'],
};

/** どの種類でも伏せるプロパティの名前 */
const ALWAYS = new Set(['password', 'secret', 'consumerSecret', 'token']);

const maskValue = (value: unknown): unknown => {
    if (typeof value === 'string') return value === '' ? value : MASKED;
    if (Array.isArray(value)) return value.map(maskValue);
    if (value !== null && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, child]) => [
                key,
                key === 'kind' || key === 'sourceKeys' ? child : maskValue(child),
            ]),
        );
    }
    return value;
};

/**
 * JSON の中の、伏せるプロパティの値を MASKED にしたもの (元は変えない)。
 * dataType の SENSITIVE_PROPERTIES と、どの種類でも伏せる名前 (password など) を伏せる
 */
export const maskSensitive = <T>(dataType: string, json: T): T => {
    const names = new Set([...(SENSITIVE_PROPERTIES[dataType] ?? []), ...ALWAYS]);
    const walk = (value: unknown): unknown => {
        if (Array.isArray(value)) return value.map(walk);
        if (value === null || typeof value !== 'object') return value;
        return Object.fromEntries(
            Object.entries(value).map(([key, child]) => [
                key,
                names.has(key) ? maskValue(child) : walk(child),
            ]),
        );
    };
    return walk(json) as T;
};

/**
 * ソースの文字列 (sourceObject の context など) を伏せるか。
 * SENSITIVE_PROPERTIES がある種類は、ソースの文字列ごと伏せる (値がそのまま入っているため)
 */
export const isSensitiveDataType = (dataType: string): boolean =>
    SENSITIVE_PROPERTIES[dataType] !== undefined;

// ---------------------------------------------------------------------------
// リポジトリ (解析結果) を伏せる
// ---------------------------------------------------------------------------

/** ソース位置の文字列 (sourceObject・resolvedError の context) を伏せる */
const maskContexts = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(maskContexts);
    if (value === null || typeof value !== 'object') return value;
    return Object.fromEntries(
        Object.entries(value).map(([key, child]) => [
            key,
            key === 'context' && typeof child === 'string' ? MASKED : maskContexts(child),
        ]),
    );
};

/**
 * 解析結果 1 つを伏せたもの (元は変えない)。type は単位の種類 (読めなかった結果も、種類で伏せる)。
 * 伏せる種類なら、JSON の値 (maskSensitive) と、ソースの文字列 (sourceObject・resolvedError の context) を伏せる
 */
export const maskUnitResult = <R extends UnitParseResult>(type: string, result: R): R => {
    if (!isSensitiveDataType(type)) return result;
    return {
        ...result,
        resolvedError: maskContexts(result.resolvedError) as R['resolvedError'],
        result: {
            ...result.result,
            base: maskSensitive(type, result.result.base),
            sourceObject: maskContexts(result.result.sourceObject) as R['result']['sourceObject'],
        },
    };
};

const maskedRepositories = new WeakMap<Repository, Repository>();

/** 伏せる値を伏せたリポジトリ (同じリポジトリには、作ったものを使い回す) */
export const maskRepository = (repository: Repository): Repository => {
    let masked = maskedRepositories.get(repository);
    if (!masked) {
        masked = repository.map(maskUnitResult);
        maskedRepositories.set(repository, masked);
        // 依存関係のグラフは、伏せる前のものを使う (メールの本文の項目の参照などを失わないため)
        shareDependencyGraph(masked, repository);
    }
    return masked;
};
