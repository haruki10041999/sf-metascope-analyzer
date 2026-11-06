import assert from 'node:assert/strict';
import path from 'node:path';

import { apexSampleOf, type Side } from '../../docs/examples/paths';
import { before, describe, it } from 'node:test';

import { runDiff } from '../../docs/examples/apex/scripts/run-diff';
import { ApexParser, type ApexUnitParseResult } from '../../src/analyzer/parser/Apex';
import type { ApexMetaJson } from '../../src/analyzer/types';

/**
 * docs/examples/repository のクラス・トリガーのメタデータ (-meta.xml)。
 * クラス・トリガーは、ソースと -meta.xml を 1 つの単位として読む (parser/Apex/unit.ts)
 */

const sample = path.resolve('docs/examples/repository');
const parseUnit = (side: string, file: string) =>
    ApexParser.parseApexUnit(apexSampleOf(side as Side, file));
const metaOf = (unit: ApexUnitParseResult) => unit.result.base.meta!.meta as ApexMetaJson;

type Node = Record<string, any>;

describe('Apex の単位とメタデータ (-meta.xml)', () => {
    it('ソースと -meta.xml を 1 つの単位にし、id は class_<名前> / trigger_<名前>', async () => {
        // どちらのファイルを渡しても同じ単位になる
        const fromSource = await parseUnit('after', 'AccountService.cls');
        const fromMeta = await parseUnit('after', 'AccountService.cls-meta.xml');
        assert.deepEqual(fromMeta, fromSource);

        assert.equal(fromSource.dataType, 'apexUnit');
        assert.equal(fromSource.result.id, 'class_AccountService');
        assert.equal(path.basename(fromSource.filePath), 'AccountService.cls');
        const base = fromSource.result.base;
        assert.deepEqual(
            [
                base.name,
                base.unitType,
                base.source?.fileName,
                base.source?.fileType,
                base.meta?.fileName,
            ],
            ['AccountService', 'class', 'AccountService.cls', 'cls', 'AccountService.cls-meta.xml'],
        );

        const { kind, sourceKeys, ...body } = metaOf(fromSource);
        assert.equal(kind, 'apexClassMeta');
        assert.match(sourceKeys.objectKey, /^apexClassMeta_[0-9a-f]{16}$/);
        // apiVersion は 61.0 のまま (数値にしない)。packageVersions は要素がないので持たない
        assert.deepEqual(body, { apiVersion: '61.0', status: 'Active' });

        const trigger = await parseUnit('after', 'AccountTrigger.trigger');
        assert.equal(trigger.result.id, 'trigger_AccountTrigger');
        assert.equal(metaOf(trigger).kind, 'apexTriggerMeta');
        assert.deepEqual(metaOf(trigger).packageVersions, [
            { namespace: 'acme', majorNumber: 1, minorNumber: 4 },
        ]);
    });

    it('読めない -meta.xml は ErrorJson にし、単位の resolvedError に filePath 付きで入れる', async () => {
        const broken = await parseUnit('after', 'Broken.cls');
        assert.equal(broken.result.base.meta?.meta.kind, 'error');
        assert.deepEqual(
            broken.resolvedError
                .filter((e) => e.filePath === 'Broken.cls-meta.xml')
                .map((e) => [e.code, e.start.line]),
            [['XML_SYNTAX', 4]],
        );
    });

    it('匿名 Apex は 1 ファイルで 1 つの単位 (anonymous_<名前>)。searchApexUnits はフォルダごとに単位にまとめる', async () => {
        const units = (await ApexParser.searchApexUnits(path.join(sample, 'after'))).map((file) =>
            path.basename(file),
        );
        // クラス・トリガーはソースのパス (-meta.xml は同じ単位なので出ない)
        assert.deepEqual(units, [
            'broken.apex',
            'parser.apex',
            'script.apex',
            'AccountService.cls',
            'Broken.cls',
            'Level.cls',
            'NewHelper.cls',
            'ParserEnum.cls',
            'ParserInterface.cls',
            'ParserTest.cls',
            'Shape.cls',
            'Unchanged.cls',
            'AccountTrigger.trigger',
            'ParserTrigger.trigger',
        ]);
        const script = await parseUnit('after', 'script.apex');
        assert.equal(script.result.id, 'anonymous_script');
        assert.equal(script.result.base.meta, undefined);
    });
});

describe('Apex のメタデータの Diff (makeApexUnitDiffs)', () => {
    let diffs: Awaited<ReturnType<typeof runDiff>>['diffs'];
    before(async () => {
        ({ diffs } = await runDiff());
    });
    /** 単位の -meta.xml の中身の差分 */
    const metaDiff = (id: string) =>
        (diffs.find((d) => d.id === id)!.content as Node).fields.meta.fields.meta as Node;

    it('値ごとに比べ、片方にしかない値は added / removed', () => {
        const cls = metaDiff('class_AccountService');
        assert.equal(cls.kind, 'apexClassMeta');
        assert.deepEqual(cls.fields, {
            apiVersion: { status: 'changed', before: '59.0', after: '61.0' },
            status: { status: 'unchanged', value: 'Active' },
        });

        const trigger = metaDiff('trigger_AccountTrigger');
        assert.deepEqual(trigger.fields.status, {
            status: 'changed',
            before: 'Active',
            after: 'Inactive',
        });
        assert.deepEqual(trigger.fields.packageVersions, {
            status: 'added',
            value: [{ namespace: 'acme', majorNumber: 1, minorNumber: 4 }],
        });
    });

    it('読めなくなった -meta.xml は値ごとの変更', () => {
        const broken = metaDiff('class_Broken');
        assert.equal(broken.status, 'changed');
        // JSON ノードの kind は中身から分けて持つ (ほかの値ごとの差分と同じ)
        assert.deepEqual(broken.kind, { before: 'apexClassMeta', after: 'error' });
    });
});
