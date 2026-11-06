import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { LwcParser, apiVersionOf, parseBundleMeta } from '../../src/analyzer/parser/Lwc';
import type { LwcBundleMetaJson } from '../../src/analyzer/types';

// LWC の js-meta.xml の JSON (docs/lwc-implementation.md)。parseBundleMeta はソースを受け取る (フォルダの読み込みは folder.ts)

const BUNDLES = 'docs/examples/repository/before/force-app/main/default/lwc';

describe('LWC の js-meta.xml', () => {
    it('値・targets・targetConfigs (property は属性)・objects・supportedFormFactors を JSON にする', async () => {
        const result = parseBundleMeta(
            'accountList/accountList.js-meta.xml',
            await readFile(`${BUNDLES}/accountList/accountList.js-meta.xml`, 'utf8'),
        );
        assert.deepEqual(result.resolvedError, []);
        const meta = result.meta as LwcBundleMetaJson;
        assert.equal(meta.kind, 'lwcBundleMeta');
        assert.equal(meta.apiVersion, '61.0');
        assert.equal(meta.isExposed, true);
        assert.equal(meta.masterLabel, '取引先一覧');
        assert.deepEqual(meta.targets, ['lightning__RecordPage', 'lightning__AppPage']);
        assert.equal(meta.capabilities, undefined);

        const [record, app] = meta.targetConfigs!;
        assert.deepEqual(record!.targets, ['lightning__RecordPage']);
        assert.deepEqual(
            record!.properties!.map(({ kind: _k, sourceKeys: _s, ...rest }) => rest),
            [
                { name: 'title', type: 'String', label: 'タイトル', default: '取引先一覧' },
                {
                    name: 'maxRows',
                    type: 'Integer',
                    label: '最大件数',
                    default: '10',
                    min: 1,
                    max: 50,
                },
            ],
        );
        assert.deepEqual(record!.objects, ['Account']);
        assert.deepEqual(record!.supportedFormFactors, ['Large', 'Small']);
        assert.equal(app!.objects, undefined);
        assert.equal(apiVersionOf(meta), 61);
    });

    it('ルート要素の違い・XML の構文エラーは ErrorJson と resolvedError (phase syntax)', () => {
        const wrongRoot = parseBundleMeta(
            'x/x.js-meta.xml',
            '<?xml version="1.0"?><ApexClass></ApexClass>',
        );
        assert.equal(wrongRoot.meta.kind, 'error');
        assert.deepEqual(
            wrongRoot.resolvedError.map((e) => [e.phase, e.code]),
            [['syntax', 'UNEXPECTED_ROOT']],
        );
        const broken = parseBundleMeta(
            'x/x.js-meta.xml',
            '<LightningComponentBundle><apiVersion>61.0',
        );
        assert.equal(broken.meta.kind, 'error');
        assert.equal(broken.resolvedError[0]!.code, 'XML_SYNTAX');
    });

    it('バンドルの meta に入る', async () => {
        const result = await LwcParser.parseLwcBundle(`${BUNDLES}/accountList`);
        assert.equal(result.dataType, 'lwcBundle');
        if (result.dataType === 'lwcBundle') {
            assert.equal(result.result.base.meta?.kind, 'lwcBundleMeta');
        }
    });
});
