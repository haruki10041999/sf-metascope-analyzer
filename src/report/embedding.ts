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
