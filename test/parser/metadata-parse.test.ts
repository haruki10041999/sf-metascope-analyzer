import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { MetadataParser, ObjectFileStructureType } from '../../src/analyzer/parser/Metadata/parser';
import {
    analyzeObject,
    getObjectDependencies,
    getRelatedObjectApiNames,
} from '../../src/analyzer/processor/Metadata/analysis';
import { XmlSyntaxError, parseXml } from '../../src/analyzer/types/commons/xml';
import { findXmlSourceInfo } from '../../src/analyzer/types/commons/xmlJson';
import type { CustomFieldJson } from '../../src/analyzer/types/metadata/field';

const sample = path.resolve('docs/examples/repository');
const objectsOf = (side: string) =>
    path.join(sample, side, 'force-app', 'main', 'default', 'objects');

const parseAfter = async (name: string) =>
    (await MetadataParser.parseObject(
        path.join(objectsOf('after'), name),
    )) as ObjectFileStructureType;

const fieldOf = (result: ObjectFileStructureType, apiName: string) =>
    result.result.base.fields!.find(
        (field) => field.kind === 'field' && field.apiName === apiName,
    ) as CustomFieldJson;

describe('parseXml', () => {
    it('keeps element positions, decodes entities and skips comments / CDATA', () => {
        const source =
            '<?xml version="1.0"?>\n<A x="1">\n  <!-- c -->\n  <B>a &lt; b &amp; &apos;c&apos;</B>\n  <C><![CDATA[<raw>]]></C>\n  <D/>\n</A>\n';
        const root = parseXml(source);
        assert.equal(root.name, 'A');
        assert.deepEqual(root.attributes, { x: '1' });
        assert.deepEqual(
            root.children.map((child) => [
                child.name,
                child.text,
                child.start.line,
                child.start.column,
            ]),
            [
                ['B', "a < b & 'c'", 4, 2],
                ['C', '<raw>', 5, 2],
                ['D', '', 6, 2],
            ],
        );
        assert.deepEqual(root.end, { offset: source.indexOf('</A>') + 4, line: 7, column: 4 });
    });

    it('reports the position of a syntax error', () => {
        assert.throws(
            () => parseXml('<A>\n  <B>x</C>\n</A>'),
            (error: unknown) =>
                error instanceof XmlSyntaxError &&
                error.reason === '</B> expected but </C> found' &&
                error.position.line === 2,
        );
    });
});

describe('MetadataParser.parseObject', () => {
    it('reads the object and every member folder into JSON with kind / sourceKeys', async () => {
        const result = await parseAfter('Invoice__c');
        assert.equal(result.dataType, 'object');
        assert.equal(result.result.id, 'Invoice__c');
        const object = result.result.base;
        assert.equal(object.kind, 'object');
        assert.equal(object.objectType, 'custom');
        assert.deepEqual(object.nameField, {
            label: 'Invoice Number',
            type: 'AutoNumber',
            displayFormat: 'INV-{0000}',
        });
        assert.deepEqual(
            [
                object.fields,
                object.validationRules,
                object.recordTypes,
                object.fieldSets,
                object.webLinks,
            ].map((members) => (members ?? []).map((member) => member.kind)),
            [
                ['field', 'field', 'field', 'field', 'field', 'field'],
                ['validationRule', 'validationRule'],
                ['recordType'],
                ['fieldSet'],
                ['webLink'],
            ],
        );

        const amount = fieldOf(result, 'Amount__c');
        assert.deepEqual(
            {
                type: amount.type,
                precision: amount.precision,
                scale: amount.scale,
                required: amount.required,
            },
            { type: 'Currency', precision: 16, scale: 2, required: true },
        );
        assert.match(amount.sourceKeys.objectKey, /^field_[0-9a-f]{16}$/);

        const status = fieldOf(result, 'Status__c');
        assert.deepEqual(
            status.valueSet?.values?.map(
                (value) => value.kind === 'picklistValue' && value.fullName,
            ),
            ['Draft', 'Paid', 'Overdue'],
        );

        // ソース位置はファイルのパスと行・列で引ける
        const info = findXmlSourceInfo(result.result.sourceObject, amount.sourceKeys);
        assert.equal(info.filePath, 'Invoice__c/fields/Amount__c.field-meta.xml');
        assert.equal(info.start.line, 2);
        assert.ok(info.context.startsWith('<CustomField'));
    });

    it('omits properties and member lists that are not in the folder or the file', async () => {
        const account = (await parseAfter('Account')).result.base;
        // Account は fieldSets / recordTypes / webLinks のフォルダを持たない
        assert.deepEqual(
            [
                'fields',
                'validationRules',
                'listViews',
                'compactLayouts',
                'fieldSets',
                'recordTypes',
                'webLinks',
            ].map((key) => key in account),
            [true, true, true, true, false, false, false],
        );
        // object-meta.xml にない値 (label など) も持たない
        assert.ok(!('label' in account) && !('nameField' in account));

        // Due_Date__c は valueSet・length などを持たない
        const dueDate = fieldOf(await parseAfter('Invoice__c'), 'Due_Date__c');
        assert.deepEqual(Object.keys(dueDate).sort(), [
            'apiName',
            'kind',
            'label',
            'sourceKeys',
            'type',
        ]);
    });

    it('reads fields written inside object-meta.xml (metadata API format)', async () => {
        const result = await parseAfter('Payment__c');
        assert.deepEqual(
            result.result.base.fields!.map(
                (field) => field.kind === 'field' && [field.apiName, field.type],
            ),
            [
                ['Invoice__c', 'Lookup'],
                ['Paid_At__c', 'DateTime'],
            ],
        );
    });

    it('reads customSettingsType / customSettingsVisibility of custom settings', () => {
        const result = MetadataParser.parseObjectSource('Billing_Config__c', [
            {
                fileName: 'Billing_Config__c.object-meta.xml',
                filePath: 'Billing_Config__c/Billing_Config__c.object-meta.xml',
                source: [
                    '<?xml version="1.0" encoding="UTF-8"?>',
                    '<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">',
                    '    <customSettingsType>Hierarchy</customSettingsType>',
                    '    <customSettingsVisibility>Protected</customSettingsVisibility>',
                    '    <label>Billing Config</label>',
                    '    <visibility>Public</visibility>',
                    '</CustomObject>',
                ].join('\n'),
            },
        ]) as ObjectFileStructureType;
        const object = result.result.base;
        // objectType は接尾辞で決めたまま (custom)。カスタム設定かは customSettingsType で分かる
        assert.equal(object.objectType, 'custom');
        assert.equal(object.customSettingsType, 'Hierarchy');
        assert.equal(object.customSettingsVisibility, 'Protected');
        assert.equal(object.skippedElements, undefined);
    });

    it('drops unreadable files from the JSON and reports them in resolvedError', async () => {
        const result = await parseAfter('Broken__c');
        assert.equal(result.dataType, 'object');
        // 読めない項目は JSON に持たない (ほかに項目がないので fields ごと持たない)
        assert.equal(result.result.base.fields, undefined);
        assert.deepEqual(
            result.resolvedError.map((error) => [error.code, error.filePath, error.start.line]),
            [
                ['XML_SYNTAX', 'Broken__c/fields/Code__c.field-meta.xml', 5],
                ['UNEXPECTED_ROOT', 'Broken__c/fields/Misplaced__c.field-meta.xml', 2],
            ],
        );
    });

    describe('keys', () => {
        let tmp: string;
        before(async () => {
            tmp = await mkdtemp(path.join(os.tmpdir(), 'metadata-parse-'));
        });
        after(async () => {
            await rm(tmp, { recursive: true, force: true });
        });

        it('keeps objectKey when only the position changes, and ignores the line ending', async () => {
            const original = await parseAfter('Invoice__c');
            const copy = path.join(tmp, 'objects', 'Invoice__c');
            await cp(path.join(objectsOf('after'), 'Invoice__c'), copy, { recursive: true });

            // CRLF にしても sourceKey まで同じ
            const amountPath = path.join(copy, 'fields', 'Amount__c.field-meta.xml');
            const source = await readFile(amountPath, 'utf8');
            await writeFile(amountPath, source.replace(/\n/g, '\r\n'));
            const crlf = (await MetadataParser.parseObject(copy)) as ObjectFileStructureType;
            assert.deepEqual(
                fieldOf(crlf, 'Amount__c').sourceKeys,
                fieldOf(original, 'Amount__c').sourceKeys,
            );

            // 空行を足すと sourceKey だけが変わる
            await writeFile(amountPath, source.replace('<fullName>', '\n\n    <fullName>'));
            const shifted = (await MetadataParser.parseObject(copy)) as ObjectFileStructureType;
            const [a, b] = [fieldOf(original, 'Amount__c'), fieldOf(shifted, 'Amount__c')];
            assert.equal(a.sourceKeys.objectKey, b.sourceKeys.objectKey);
            assert.notEqual(a.sourceKeys.sourceKey, b.sourceKeys.sourceKey);
        });

        it('saves and reads the result as msgpack', async () => {
            const result = await parseAfter('Invoice__c');
            const [saved] = MetadataParser.saveObjectFile(tmp, result);
            await writeFile(saved!.outputPath, saved!.data as Uint8Array);
            assert.deepEqual(await MetadataParser.readObjectMsgPack(tmp, 'Invoice__c'), result);
        });
    });
});

describe('metadata analysis', () => {
    it('normalizes field types and adds implicit standard fields', async () => {
        const invoice = analyzeObject((await parseAfter('Invoice__c')).result.base);
        const byName = new Map(invoice.fields.map((field) => [field.apiName, field]));
        assert.deepEqual(
            [
                'Id',
                'CreatedById',
                'Amount__c',
                'Approved__c',
                'Due_Date__c',
                'Account__c',
                'Status__c',
            ].map((name) => [name, byName.get(name)?.valueType, byName.get(name)?.origin]),
            [
                ['Id', 'Id', 'implicit'],
                ['CreatedById', 'Reference', 'implicit'],
                ['Amount__c', 'Double', 'metadata'],
                ['Approved__c', 'Boolean', 'metadata'],
                ['Due_Date__c', 'Date', 'metadata'],
                ['Account__c', 'Reference', 'metadata'],
                ['Status__c', 'String', 'metadata'],
            ],
        );

        // カスタムメタデータ型は SystemModstamp / IsDeleted を持たない
        const setting = analyzeObject((await parseAfter('App_Setting__mdt')).result.base);
        assert.ok(!setting.fields.some((field) => field.apiName === 'IsDeleted'));
    });

    it('collects dependencies and follows them by depth', async () => {
        const results = await MetadataParser.parseObjects(objectsOf('after'));
        const objects = results.flatMap((r) =>
            r.dataType === 'object' ? [analyzeObject(r.result.base)] : [],
        );
        const dependencies = getObjectDependencies(objects).filter(
            (d) => d.childObjectApiName !== 'User',
        );
        assert.deepEqual(
            dependencies.map(
                (d) =>
                    `${d.parentObjectApiName}.${d.parentFieldApiName}->${d.childObjectApiName}:${d.type}`,
            ),
            [
                'Invoice_Line__c.Invoice__c->Invoice__c:MasterDetail',
                'Invoice_Line__c.Product__c->Product2:Lookup',
                'Invoice__c.Account__c->Account:Lookup',
                'Payment__c.Invoice__c->Invoice__c:Lookup',
            ],
        );
        assert.deepEqual(getRelatedObjectApiNames(dependencies, ['Payment__c'], 1), ['Payment__c']);
        assert.deepEqual(getRelatedObjectApiNames(dependencies, ['Payment__c'], 3), [
            'Payment__c',
            'Invoice__c',
            'Account',
        ]);
    });
});
