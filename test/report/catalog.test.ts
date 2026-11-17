import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { describe, it } from 'node:test';

import { catalogFiles } from '../../docs/catalog/generate';
import { PROVIDER_DEFINITIONS } from '../../src/analyzer/report';
import { REPORT_COMPONENTS, REPORT_DATA_BINDINGS } from '../../src/report/catalog';
import { buildReportCatalog, reportCatalogMarkdown } from '../../src/report/llmCatalog';

// LLM 向けのカタログ (docs/implementation-roadmap.md 4.2): 登録表から作り、書き出したファイルが最新か

describe('レポートのカタログ', () => {
    const catalog = buildReportCatalog();

    it('部品と provider は、カタログと登録表で同じ (手で書いた一覧を持たない)', () => {
        assert.deepEqual(
            catalog.components.map((c) => c.name),
            Object.keys(REPORT_COMPONENTS),
        );
        assert.deepEqual(
            catalog.providers.map((p) => p.name),
            Object.keys(PROVIDER_DEFINITIONS),
        );
        // 行を受け取る部品と、引数・出力の JSON Schema
        // データを受け取る部品は REPORT_DATA_BINDINGS と同じ。provider には描ける部品が付く
        assert.deepEqual(
            catalog.components.filter((c) => c.dataProps.length).map((c) => c.name),
            Object.keys(REPORT_DATA_BINDINGS),
        );
        assert.deepEqual(
            catalog.providers.find((p) => p.name === 'permission.objectAccess')!.components,
            ['Matrix'],
        );
        const flowInterface = catalog.providers.find((p) => p.name === 'flow.interface')!;
        assert.equal(flowInterface.shape, 'rows');
        assert.equal((flowInterface.args as { type: string }).type, 'object');
        assert.equal((flowInterface.output as { type: string }).type, 'array');
        assert.match(reportCatalogMarkdown(catalog), /### flow\.interface/);
    });

    it('docs/catalog のファイルが最新 (違えば npm run catalog で作り直す)', async () => {
        for (const [file, content] of Object.entries(catalogFiles())) {
            assert.equal(
                (await fs.readFile(file, 'utf8')).replace(/\r\n/g, '\n'),
                content,
                `${file} が古い (npm run catalog)`,
            );
        }
    });
});
