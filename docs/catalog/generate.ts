/**
 * レポートのカタログ (LLM 向け) を書き出す (docs/implementation-roadmap.md 4.2)。
 *
 *   npm run catalog
 *
 * 出力: report-catalog.json (機械向け)・report-catalog.md (LLM が読む向け)。
 * 中身は src/report/llmCatalog.ts が、部品のカタログと provider の登録表から作る。テスト (test/report/catalog.test.ts) が、
 * このファイルが今の登録表と一致することを確かめる
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildReportCatalog, reportCatalogMarkdown } from '../../src/report/llmCatalog';

const here = path.dirname(fileURLToPath(import.meta.url));

export const CATALOG_JSON = path.join(here, 'report-catalog.json');
export const CATALOG_MARKDOWN = path.join(here, 'report-catalog.md');

/** 書き出す中身 (テストと同じものを使う) */
export const catalogFiles = () => {
    const catalog = buildReportCatalog();
    return {
        [CATALOG_JSON]: `${JSON.stringify(catalog, null, 4)}\n`,
        [CATALOG_MARKDOWN]: `${reportCatalogMarkdown(catalog)}\n`,
    };
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    for (const [file, content] of Object.entries(catalogFiles())) {
        await fs.writeFile(file, content);
        console.log(file);
    }
}
