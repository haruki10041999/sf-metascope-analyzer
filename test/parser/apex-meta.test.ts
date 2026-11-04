import assert from 'node:assert/strict';
import path from 'node:path';
import { before, describe, it } from 'node:test';

import { runDiff } from '../../docs/examples/apex-diff/run-diff';
import { ApexMetaFileStructureType, ApexParser } from '../../src/analyzer/parser/Apex/parser';

/** docs/examples/apex-diff のクラス・トリガーのメタデータ (-meta.xml) の parse と Diff */

const sample = path.resolve('docs/examples/apex-diff');
const parseMeta = (side: string, name: string) =>
    ApexParser.parseApexMeta(path.join(sample, side, name));

type Node = Record<string, any>;

describe('ApexParser.parseApexMeta', () => {
    it('reads the class / trigger metadata into JSON with kind / sourceKeys', async () => {
        const cls = (await parseMeta(
            'after',
            'AccountService.cls-meta.xml',
        )) as ApexMetaFileStructureType;
        assert.equal(cls.dataType, 'apexClassMeta');
        assert.equal(cls.result.id, 'AccountService.cls-meta.xml');
        const { kind, sourceKeys, ...body } = cls.result.base;
        assert.equal(kind, 'apexClassMeta');
        assert.match(sourceKeys.objectKey, /^apexClassMeta_[0-9a-f]{16}$/);
        // apiVersion は 61.0 のまま (数値にしない)。packageVersions は要素がないので持たない
        assert.deepEqual(body, { apiVersion: '61.0', status: 'Active' });

        const trigger = (await parseMeta(
            'after',
            'AccountTrigger.trigger-meta.xml',
        )) as ApexMetaFileStructureType;
        assert.equal(trigger.result.base.kind, 'apexTriggerMeta');
        assert.deepEqual(trigger.result.base.packageVersions, [
            { namespace: 'acme', majorNumber: 1, minorNumber: 4 },
        ]);
    });

    it('turns a broken file into an error result', async () => {
        const broken = await parseMeta('after', 'Broken.cls-meta.xml');
        assert.equal(broken.dataType, 'error');
        assert.deepEqual(
            broken.resolvedError.map((e) => [e.code, e.filePath, e.start.line]),
            [['XML_SYNTAX', 'Broken.cls-meta.xml', 4]],
        );
    });

    it('is found by searchApexFiles and dispatched by parseApexFile', async () => {
        const files = (await ApexParser.searchApexFiles(path.join(sample, 'after')))
            .map((file) => path.basename(file))
            .sort();
        assert.ok(
            files.includes('AccountService.cls') && files.includes('AccountService.cls-meta.xml'),
        );
        const withoutMeta = await ApexParser.searchApexFiles(path.join(sample, 'after'), {
            includeMeta: false,
        });
        assert.ok(withoutMeta.every((file) => !file.endsWith('-meta.xml')));

        const parsed = await ApexParser.parseApexFile(
            path.join(sample, 'after', 'Unchanged.cls-meta.xml'),
        );
        assert.equal(parsed.dataType, 'apexClassMeta');
    });
});

describe('Apex metadata diff (makeUnitDiffs)', () => {
    let diffs: Awaited<ReturnType<typeof runDiff>>['diffs'];
    before(async () => {
        ({ diffs } = await runDiff());
    });
    const fileDiff = (name: string) => diffs.find((d) => d.filePath === name)! as Node;

    it('pairs metadata files by path like the source files', () => {
        assert.deepEqual(
            diffs
                .filter((d) => d.filePath.endsWith('-meta.xml'))
                .map((d) => [d.filePath, d.status]),
            [
                ['AccountService.cls-meta.xml', 'changed'],
                ['AccountTrigger.trigger-meta.xml', 'changed'],
                ['Broken.cls-meta.xml', 'changed'],
                ['OldHelper.cls-meta.xml', 'removed'],
                ['Unchanged.cls-meta.xml', 'unchanged'],
                ['NewHelper.cls-meta.xml', 'added'],
            ],
        );
    });

    it('diffs the values, and reports one-sided values as added / removed', () => {
        const cls = fileDiff('AccountService.cls-meta.xml').content;
        assert.equal(cls.kind, 'apexClassMeta');
        assert.deepEqual(cls.fields, {
            apiVersion: { status: 'changed', before: '59.0', after: '61.0' },
            status: { status: 'unchanged', value: 'Active' },
        });

        const trigger = fileDiff('AccountTrigger.trigger-meta.xml').content;
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
});
