import type { Spec } from '@json-render/core';

// レポートを viewer に渡すときの決まり (node のビルドと viewer の両方から使う)

/** HTML に埋め込む文書の script の id (src/builder/reportBuilder.ts が中身を書く) */
export const REPORT_SCRIPT_ID = 'metascope-report';

/** MCP Apps のツールの結果の _meta に入れるレポート本体 (タイトルと仕様・state) のキー (src/mcp/appResources.ts) */
export const REPORT_META_KEY = 'io.github.sf-metascope/report';

/**
 * データが自分の比べ方を持つ部品に、ビルドが足す props (`{ "$state": "/compared/<データの名前>" }`)。
 * viewer は部品の上に「比べた時点」を出す。文書には書かない (書いても上書きする)
 */
export const COMPARED_PROP = '_compared';

/** HTML・MCP Apps に埋め込む文書 (タイトルと、json-render の仕様を state とともに)。ビルド (src/builder/reportBuilder.ts) が作り、viewer が描く */
export type EmbeddedReport = {
    title: string;
    /** 何と何を比べたか (保存した基準 → 作業ツリー、main...HEAD など) */
    compared?: string;
    /** ページに分けた文書の 1 ページのとき、目次 (タイトルと、このページからの相対パス) */
    parent?: { title: string; href: string };
    spec: Spec & { state: Record<string, unknown> };
};

/** state の中の場所 (`{ "$state": "/data/<名前>" }`・`/compared/<名前>`) */
export type StateRef = { scope: 'data' | 'compared'; name: string };

const STATE_PATH = /^\/(data|compared)\/([^/]+)$/;

/** props の値が state を指していれば、その場所 (`{ "$state": "/data/<名前>" }` の形でなければ undefined) */
export const stateRefOf = (value: unknown): StateRef | undefined => {
    if (typeof value !== 'object' || value === null) return undefined;
    const path = (value as { $state?: unknown }).$state;
    const match = typeof path === 'string' ? path.match(STATE_PATH) : null;
    return match ? { scope: match[1] as StateRef['scope'], name: match[2]! } : undefined;
};

/** props の値が文書のデータ (`/data/<名前>`) を指していれば、その名前 */
export const dataNameOf = (value: unknown): string | undefined => {
    const ref = stateRefOf(value);
    return ref?.scope === 'data' ? ref.name : undefined;
};
