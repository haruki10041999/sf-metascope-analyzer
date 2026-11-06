import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { LwcParser, type LwcBundleParseResult } from '../../src/analyzer/parser/Lwc';
import {
    analyzeLwcBundles,
    type LwcBundleAnalysis,
} from '../../src/analyzer/processor/Lwc/analysis';
import type { ObjectInfo } from '../../src/analyzer/processor/Metadata/analysis';

// バンドルをまたぐ解析 (docs/lwc-implementation.md)

const BUNDLES: Record<string, Record<string, string>> = {
    child: {
        'child.js': `import { LightningElement, api } from 'lwc';
export default class Child extends LightningElement {
    @api recordId;
    @api get label() { return this._label; }
    set label(value) { this._label = value; }
    internal = 1;
    handleClick() { this.dispatchEvent(new CustomEvent('pick')); }
}`,
        'child.html': '<template><slot name="header"></slot><slot></slot></template>',
    },
    parent: {
        'parent.js': `import { LightningElement } from 'lwc';
import INVOICE_OBJECT from '@salesforce/schema/Invoice__c';
import AMOUNT_FIELD from '@salesforce/schema/Invoice__c.Amount__c';
import MISSING_FIELD from '@salesforce/schema/Invoice__c.Missing__c';
export default class Parent extends LightningElement {
    objectApiName = INVOICE_OBJECT;
    fields = [AMOUNT_FIELD, MISSING_FIELD];
    handlePick() {}
}`,
        'parent.html': `<template>
    <c-child record-id="1" label="a" internal="2" title="t" aria-label="x" onpick={handlePick} onother={handlePick}>
        <span slot="header">h</span>
        <span slot="footer">f</span>
    </c-child>
    <c-missing></c-missing>
    <lightning-cardz></lightning-cardz>
    <lightning-record-form object-api-name={objectApiName} fields={fields}></lightning-record-form>
    <lightning-record-edit-form object-api-name="Account">
        <lightning-input-field field-name="Industry"></lightning-input-field>
        <lightning-input-field field-name="Tier__c"></lightning-input-field>
    </lightning-record-edit-form>
    <acme-chart></acme-chart>
</template>`,
    },
};

const OBJECTS: ObjectInfo[] = [
    {
        apiName: 'Account',
        objectType: 'standard',
        fields: [],
        sourceKeys: { objectKey: 'o', sourceKey: 's' },
    },
    {
        apiName: 'Invoice__c',
        objectType: 'custom',
        fields: [{ apiName: 'Amount__c', origin: 'metadata', valueType: 'Double' }],
        sourceKeys: { objectKey: 'o', sourceKey: 's' },
    },
];

let root: string;
let bundles: LwcBundleParseResult[];
let analyses: LwcBundleAnalysis[];
const of = (name: string) => analyses.find((a) => a.bundle === name)!;

describe('LWC のバンドルをまたぐ解析', () => {
    before(async () => {
        root = await mkdtemp(path.join(os.tmpdir(), 'lwc-analysis-'));
        bundles = [];
        for (const [name, files] of Object.entries(BUNDLES)) {
            await mkdir(path.join(root, name));
            for (const [file, content] of Object.entries(files)) {
                await writeFile(path.join(root, name, file), content);
            }
            bundles.push(await LwcParser.parseLwcBundle(path.join(root, name)));
        }
        analyses = analyzeLwcBundles(bundles, OBJECTS);
    });
    after(async () => {
        await rm(root, { recursive: true, force: true });
    });

    it('子コンポーネントの @api・イベント・slot を集める', () => {
        assert.deepEqual(of('child').component, {
            name: 'child',
            namespace: 'c',
            apiProperties: ['recordId', 'label'],
            events: ['pick'],
            slots: ['header', ''],
        });
    });

    it('子の @api・イベント・slot にないもの、ないバンドル・カタログにないタグを見つける', () => {
        assert.deepEqual(
            of('parent')
                .findings.filter((f) => !['UNKNOWN_OBJECT', 'UNKNOWN_FIELD'].includes(f.code))
                .map((f) => [f.code, f.target, f.filePath]),
            [
                // title / aria-label は HTML の標準のプロパティなので出さない
                ['UNKNOWN_PROPERTY', 'c/child.internal', 'parent/parent.html'],
                ['UNKNOWN_EVENT', 'c/child:other', 'parent/parent.html'],
                ['UNKNOWN_SLOT', 'c/child:footer', 'parent/parent.html'],
                ['UNKNOWN_COMPONENT', 'c/missing', 'parent/parent.html'],
                ['UNKNOWN_LIGHTNING_COMPONENT', 'lightning-cardz', 'parent/parent.html'],
            ],
        );
    });

    it('メタデータへの参照: 式は @salesforce/schema の import から解決し、カスタムのものだけをメタデータと突き合わせる', () => {
        const parent = of('parent');
        assert.deepEqual(
            parent.metadataDependencies
                .filter((d) => d.origin === 'template')
                .map((d) => [d.attribute, d.refType, d.value, d.resolvedFrom]),
            [
                ['object-api-name', 'object', 'Invoice__c', '{objectApiName}'],
                ['fields', 'field', 'Invoice__c.Amount__c', '{fields}'],
                ['fields', 'field', 'Invoice__c.Missing__c', '{fields}'],
                ['object-api-name', 'object', 'Account', undefined],
                ['field-name', 'field', 'Account.Industry', undefined],
                ['field-name', 'field', 'Account.Tier__c', undefined],
            ],
        );
        // 標準項目 (Account.Industry) は出さない。カスタム項目でメタデータにないものは出す (import とテンプレートの両方)
        assert.deepEqual(
            parent.findings
                .filter((f) => ['UNKNOWN_OBJECT', 'UNKNOWN_FIELD'].includes(f.code))
                .map((f) => [f.code, f.target, f.filePath]),
            [
                ['UNKNOWN_FIELD', 'Invoice__c.Missing__c', 'parent/parent.js'],
                ['UNKNOWN_FIELD', 'Invoice__c.Missing__c', 'parent/parent.html'],
                ['UNKNOWN_FIELD', 'Account.Tier__c', 'parent/parent.html'],
            ],
        );
    });

    it('使っているコンポーネントの一覧', () => {
        const parent = of('parent');
        assert.deepEqual(parent.localComponents, ['c/child', 'c/missing']);
        assert.deepEqual(parent.lightningComponents, [
            'lightning/cardz',
            'lightning/inputField',
            'lightning/recordEditForm',
            'lightning/recordForm',
        ]);
        assert.deepEqual(parent.dataAccessComponents, [
            'lightning/inputField',
            'lightning/recordEditForm',
            'lightning/recordForm',
        ]);
        assert.deepEqual(parent.packageComponents, ['acme/chart']);
    });
});
