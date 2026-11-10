import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseLwcBundleFolder } from '../../src/analyzer/parser/Lwc/bundle';
import type { LwcBundleFile } from '../../src/analyzer/parser/Lwc/folder';
import {
    type GraphUnit,
    buildDependencyGraph,
} from '../../src/analyzer/processor/dependency/graph';
import type { UnitReference } from '../../src/analyzer/processor/dependency/types';
import { getLwcDependencies } from '../../src/analyzer/processor/dependency/units';

// LWC の参照の残り (docs/json-gaps.md 4.2): js-meta.xml の targetConfigs・子の @api・apexContinuation・@wire の文字列。
// ファイルシステムに触らず、メモリ上のバンドルを解析して確かめる

/** メモリ上のバンドル (ファイル名 → ソース) を解析する */
const parseBundle = (name: string, sources: Record<string, string>) => {
    const files: LwcBundleFile[] = Object.entries(sources).map(([fileName, source]) => ({
        fileType: fileName.endsWith('.js-meta.xml')
            ? 'meta'
            : fileName.endsWith('.html')
              ? 'template'
              : fileName.endsWith('.css')
                ? 'stylesheet'
                : 'module',
        fileName,
        filePath: `${name}/${fileName}`,
        source,
    }));
    const result = parseLwcBundleFolder({ name, bundleDir: name, files, skippedFiles: [] });
    assert.equal(result.dataType, 'lwcBundle', JSON.stringify(result.resolvedError));
    return result;
};

const show = (r: UnitReference) => `${r.kind} ${r.refType}:${r.target} (${r.via})`;

const PARENT_JS = `import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import startRequest from '@salesforce/apexContinuation/ContinuationController.startRequest';

export default class Parent extends LightningElement {
    @api recordId;
    label = 'x';
    @wire(getRecord, { recordId: '$recordId', fields: ['Account.Name', "Account.Owner.Email"], optionalFields: ['Account.Industry'] })
    record;
    @wire(getObjectInfo, { objectApiName: 'Contact' })
    info;
    load() {
        return startRequest();
    }
}
`;

const PARENT_HTML = `<template>
    <c-child child-label={label} size="small" title="t" aria-label="a" class="c" onselect={load}></c-child>
    <lightning-button label="b"></lightning-button>
</template>
`;

const PARENT_META = `<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>61.0</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__RecordPage</target>
        <target>lightning__FlowScreen</target>
    </targets>
    <targetConfigs>
        <targetConfig targets="lightning__RecordPage">
            <property name="mode" type="String" datasource="apex://ModePicklist"/>
            <property name="size" type="String" datasource="small,large"/>
            <objects>
                <object>Account</object>
                <object>Invoice__c</object>
            </objects>
        </targetConfig>
        <targetConfig targets="lightning__FlowScreen">
            <property name="payload" type="apex://PayloadWrapper" role="inputOnly"/>
            <property name="accounts" type="@salesforce/schema/Account[]"/>
        </targetConfig>
    </targetConfigs>
</LightningComponentBundle>
`;

const CHILD_JS = `import { LightningElement, api } from 'lwc';

export default class Child extends LightningElement {
    @api childLabel;
    @api
    get size() {
        return this._size;
    }
    set size(value) {
        this._size = value;
    }
    _size;
}
`;

describe('LWC references (js-meta.xml・子の @api・apexContinuation・@wire)', () => {
    const parent = parseBundle('parent', {
        'parent.js': PARENT_JS,
        'parent.html': PARENT_HTML,
        'parent.js-meta.xml': PARENT_META,
    });
    const child = parseBundle('child', { 'child.js': CHILD_JS });
    const refs = getLwcDependencies(parent).references.map(show);

    it('references objects and Apex classes in js-meta.xml targetConfigs', () => {
        for (const expected of [
            'uses object:Account (meta.objects)',
            'uses object:Invoice__c (meta.objects)',
            'uses apexClass:ModePicklist (meta.datasource)',
            'uses apexClass:PayloadWrapper (meta.type)',
            'uses object:Account (meta.type)',
        ]) {
            assert.ok(refs.includes(expected), `${expected}\n${refs.join('\n')}`);
        }
        // datasource の静的な値の並びは参照にしない
        assert.ok(!refs.some((r) => r.includes('small,large')));
    });

    it('references @api properties of child components from template attributes', () => {
        assert.ok(refs.includes('places lwc:child (template)'));
        assert.deepEqual(
            refs.filter((r) => r.includes('lwcProperty')),
            [
                'writes lwcProperty:child.childLabel (template.attribute)',
                'writes lwcProperty:child.size (template.attribute)',
            ],
        );
        // 基本コンポーネント (lightning-*) の属性は参照にしない
        assert.ok(!refs.some((r) => r.includes('lightning')));
    });

    it('references apexContinuation imports as Apex methods', () => {
        assert.ok(
            refs.includes('calls apexMethod:ContinuationController.startRequest (import)'),
            refs.join('\n'),
        );
    });

    it('references fields and objects in string literals of @wire config', () => {
        for (const expected of [
            'reads field:Account.Name (wire.fields)',
            'reads field:Account.Owner (wire.fields)',
            'reads field:Account.Industry (wire.optionalFields)',
            'uses object:Contact (wire.objectApiName)',
        ]) {
            assert.ok(refs.includes(expected), `${expected}\n${refs.join('\n')}`);
        }
        // '$recordId' は項目ではない
        assert.ok(!refs.some((r) => r.includes('recordId')));
    });

    it('resolves child @api properties in the graph and reports missing ones', () => {
        const unitOf = (unit: typeof parent): GraphUnit => ({
            type: 'lwc',
            id: unit.result.id,
            dependencies: getLwcDependencies(unit),
        });
        const graph = buildDependencyGraph([unitOf(parent), unitOf(child)]);
        const to = (id: string) => graph.edges.filter((e) => e.to === id);
        assert.equal(graph.nodes.get('lwcProperty:child.childLabel')?.origin, 'repository');
        assert.equal(graph.nodes.get('lwcProperty:child.size')?.origin, 'repository');
        assert.equal(to('lwcProperty:child.childLabel')[0]?.kind, 'writes');
        assert.equal(to('lwcProperty:child.size').length, 1);

        // 子が @api を持たないとき (名前の変更など) は UNKNOWN_LWC_PROPERTY
        const renamed = parseBundle('child', {
            'child.js': CHILD_JS.replace('@api childLabel', '@api heading'),
        });
        const broken = buildDependencyGraph([unitOf(parent), unitOf(renamed)]);
        assert.deepEqual(
            broken.findings.filter((f) => f.code === 'UNKNOWN_LWC_PROPERTY').map((f) => f.target),
            ['lwcProperty:child.childLabel'],
        );

        // 子のコンポーネント自体がないときは UNKNOWN_LWC だけ (同じ原因で @api の指摘を重ねない)
        const orphan = buildDependencyGraph([unitOf(parent)]);
        assert.ok(
            orphan.findings.some((f) => f.code === 'UNKNOWN_LWC' && f.target === 'lwc:child'),
        );
        assert.deepEqual(
            orphan.findings.filter((f) => f.code === 'UNKNOWN_LWC_PROPERTY'),
            [],
        );
    });
});

describe('LWC references (段階 3: ナビゲーション・querySelector・wire の文字列の項目)', () => {
    const unit = parseBundle('nav', {
        'nav.js': `import { LightningElement, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getRecord } from 'lightning/uiRecordApi';
export default class Nav extends NavigationMixin(LightningElement) {
    @wire(getRecord, { recordId: '$recordId', fields: ['Contact.Name', 'Contact.Account.Name'] })
    record;
    open = () => {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: { objectApiName: 'Invoice__c', actionName: 'list' },
        });
        this[NavigationMixin.Navigate]({ type: 'standard__recordPage', attributes: { objectApiName: this.objectName } });
    };
    refresh() {
        this.template.querySelector('c-account-row').refresh();
        this.template.querySelectorAll('lightning-input');
    }
}
`,
    });
    const refs = getLwcDependencies(unit).references.map(show);

    it('references objects of navigation page references (string literals only)', () => {
        assert.ok(refs.includes('uses object:Invoice__c (navigation)'), refs.join('\n'));
        assert.equal(refs.filter((r) => r.endsWith('(navigation)')).length, 1);
    });

    it('references child components of querySelector selectors (c-* only)', () => {
        assert.ok(refs.includes('uses lwc:accountRow (query)'), refs.join('\n'));
        assert.ok(!refs.some((r) => r.includes('lightning')));
    });

    it('references fields from fieldNames of @wire config', () => {
        assert.ok(refs.includes('reads field:Contact.Name (wire.fields)'), refs.join('\n'));
        assert.ok(refs.includes('reads field:Contact.Account (wire.fields)'));
    });
});
