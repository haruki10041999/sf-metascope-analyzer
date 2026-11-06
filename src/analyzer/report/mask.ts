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
