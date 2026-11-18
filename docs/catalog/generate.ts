/**
 * レポートのカタログ (LLM 向け) を書き出す (docs/implementation-roadmap.md 4.2)。
 *
 *   npm run catalog
 *
 * 出力: report-catalog.json (機械向け)・report-catalog.md (LLM が読む向け)・
 * report-document.schema.json (文書の JSON Schema。エディターの補完)・templates/<雛形>.json (雛形の文書。$schema 付き。コピーして直す)。
 * 中身は src/report/llmCatalog.ts が、部品のカタログと provider の登録表から作る。テスト (test/report/catalog.test.ts) が、
 * このファイルが今の登録表と一致することを確かめる
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { DOCUMENT_SCHEMA_FILE, buildDocumentJsonSchema } from '../../src/report/documentSchema';
import { buildReportCatalog, reportCatalogMarkdown } from '../../src/report/llmCatalog';
import { REPORT_TEMPLATES } from '../../src/report/templateList';

const here = path.dirname(fileURLToPath(import.meta.url));

export const CATALOG_JSON = path.join(here, 'report-catalog.json');
export const CATALOG_MARKDOWN = path.join(here, 'report-catalog.md');
export const DOCUMENT_SCHEMA = path.join(here, DOCUMENT_SCHEMA_FILE);
export const TEMPLATES_DIR = path.join(here, 'templates');

/** 書き出す中身 (テストと同じものを使う) */
export const catalogFiles = () => {
    const catalog = buildReportCatalog();
    return {
        [CATALOG_JSON]: `${JSON.stringify(catalog, null, 4)}\n`,
        [CATALOG_MARKDOWN]: `${reportCatalogMarkdown(catalog)}\n`,
        [DOCUMENT_SCHEMA]: `${JSON.stringify(buildDocumentJsonSchema(), null, 4)}\n`,
        // 雛形は $schema を付けて置く (コピーした文書でも、エディターで補完が効く)
        ...Object.fromEntries(
            Object.entries(REPORT_TEMPLATES).map(([name, entry]) => [
                path.join(TEMPLATES_DIR, `${name}.json`),
                `${JSON.stringify({ $schema: `../${DOCUMENT_SCHEMA_FILE}`, ...entry.document() }, null, 4)}\n`,
            ]),
        ),
    };
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    await fs.mkdir(TEMPLATES_DIR, { recursive: true });
    for (const [file, content] of Object.entries(catalogFiles())) {
        await fs.writeFile(file, content);
        console.log(file);
    }
}
