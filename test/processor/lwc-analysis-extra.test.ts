import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseLwcBundleFolder } from '../../src/analyzer/parser/Lwc/bundle';
import type { LwcBundleFile } from '../../src/analyzer/parser/Lwc/folder';
import { convertLwcModule, parseLwcModule } from '../../src/analyzer/parser/Lwc/module';
import {
    analyzeLwcBundles,
    analyzeLwcComponent,
    lwcWireReactiveParamsOf,
} from '../../src/analyzer/processor/Lwc/analysis';
import { analyzeLwcModuleCalls } from '../../src/analyzer/processor/Lwc/calls';
import type { UnitReference } from '../../src/analyzer/processor/dependency/types';
import { getLwcDependencies } from '../../src/analyzer/processor/dependency/units';

// LWC の解析に足したもの (docs/json-redesign-plan.md 4 章の 6): トースト・refs の使い方・Promise の扱い方
// (Apex の呼び出しの await / then / catch)・@wire の設定の '$x' の確かめ・ナビゲーションのタブ / コンポーネントの依存関係

const callsOf = (source: string) => {
    const { module } = convertLwcModule(parseLwcModule('demo/demo.js', source));
    assert.ok(module);
    return analyzeLwcModuleCalls(module);
};

/** メモリ上のバンドル (ファイル名 → ソース) を読む */
const parseBundle = (name: string, sources: Record<string, string>) => {
    const files: LwcBundleFile[] = Object.entries(sources).map(([fileName, source]) => ({
        fileType: fileName.endsWith('.html') ? 'template' : 'module',
        fileName,
        filePath: `${name}/${fileName}`,
        source,
    }));
    const result = parseLwcBundleFolder({ name, bundleDir: name, files, skippedFiles: [] });
    assert.equal(result.dataType, 'lwcBundle', JSON.stringify(result.resolvedError));
    return result;
};

describe('LWC の解析に足したもの (4 章の 6)', () => {
    it('トースト (ShowToastEvent) の値と、ラベルの import の参照', () => {
        const [content] = callsOf(`import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import SAVED from '@salesforce/label/c.Saved';
export default class Demo extends LightningElement {
    save(name) {
        this.dispatchEvent(new ShowToastEvent({ title: SAVED, message: name, variant: 'success' }));
    }
}
`);
        const [toast] = content!.events;
        assert.equal(toast!.eventClass, 'ShowToastEvent');
        assert.equal(toast!.name, 'lightning__showtoast');
        assert.equal(toast!.dispatched, true);
        assert.equal(toast!.toast?.variant, 'success');
        assert.equal((toast!.toast?.title as { kind: string }).kind, 'jsIdentifier');
        assert.deepEqual(
            toast!.toast?.references.map((r) => r.source),
            ['@salesforce/label/c.Saved'],
        );
    });

    it('トーストは、親が受け取れるイベント (component.events) に入れない', () => {
        const bundle = parseBundle('demo', {
            'demo.js': `import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class Demo extends LightningElement {
    save() {
        this.dispatchEvent(new ShowToastEvent({ title: 'ok' }));
        this.dispatchEvent(new CustomEvent('saved'));
    }
}
`,
            'demo.html': '<template></template>',
        });
        assert.deepEqual(analyzeLwcComponent(bundle.result.base).events, ['saved']);
    });

    it('refs の使い方 (this.refs.<名前> に対して使ったメンバー)', () => {
        const [content] = callsOf(`import { LightningElement } from 'lwc';
export default class Demo extends LightningElement {
    run() {
        this.refs.input.focus();
        this.refs.input.value = '';
        const v = this.refs.input.value;
        this.refs.box;
    }
}
`);
        const refs = content!.calls.filter((c) => c.callType === 'refs');
        assert.deepEqual(
            refs.map((c) => [c.target, c.refUses ?? []]),
            [
                [
                    'input',
                    [
                        { member: 'focus', access: 'call' },
                        { member: 'value', access: 'property' },
                    ],
                ],
                ['box', []],
            ],
        );
    });

    it('Apex の呼び出しの結果の扱い方 (await / then / catch / finally / return)', () => {
        const contents = callsOf(`import { LightningElement } from 'lwc';
import getA from '@salesforce/apex/C.getA';
import getB from '@salesforce/apex/C.getB';
import getC from '@salesforce/apex/C.getC';
import getD from '@salesforce/apex/C.getD';
import getE from '@salesforce/apex/C.getE';
export default class Demo extends LightningElement {
    async a() { const x = await getA(); }
    b() { getB().then((r) => r).catch((e) => e).finally(() => {}); }
    c() { getC().then((r) => r, (e) => e); }
    d() { return getD(); }
    e() { getE(); }
}
`);
        const promise = (target: string) =>
            contents.flatMap((c) => c.calls).find((c) => c.target === target)?.promise;
        assert.deepEqual(promise('getA'), {
            awaited: true,
            then: false,
            catch: false,
            finally: false,
            returned: false,
        });
        assert.deepEqual(promise('getB'), {
            awaited: false,
            then: true,
            catch: true,
            finally: true,
            returned: false,
        });
        // .then(成功, 失敗) の失敗のハンドラーは catch
        assert.equal(promise('getC')?.catch, true);
        assert.equal(promise('getD')?.returned, true);
        // 結果を使わない呼び出しは promise を持たない
        assert.equal(promise('getE'), undefined);
    });

    it("@wire の設定の '$x' を集め、コンポーネントのプロパティにないものを UNKNOWN_WIRE_PARAM にする", () => {
        const bundle = parseBundle('wired', {
            'wired.js': `import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
export default class Wired extends LightningElement {
    @api recordId;
    fields = [];
    @wire(getRecord, { recordId: '$recordId', fields: '$fields', optionalFields: ['$missing.list'] })
    record;
}
`,
            'wired.html': '<template></template>',
        });
        const [analysis] = analyzeLwcBundles([bundle]);
        assert.deepEqual(
            analysis!.findings.map((f) => [f.code, f.target]),
            [['UNKNOWN_WIRE_PARAM', 'missing.list']],
        );
        assert.deepEqual(lwcWireReactiveParamsOf({ kind: 'jsString', value: '$a.b' }), ['a.b']);
    });

    it('ナビゲーションの standard__navItemPage はタブ、standard__component は Aura のコンポーネントへの参照', () => {
        const unit = parseBundle('nav', {
            'nav.js': `import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
export default class Nav extends NavigationMixin(LightningElement) {
    open() {
        this[NavigationMixin.Navigate]({ type: 'standard__navItemPage', attributes: { apiName: 'Invoices' } });
        this[NavigationMixin.Navigate]({ type: 'standard__component', attributes: { componentName: 'c__invoiceApp' } });
        this[NavigationMixin.Navigate]({ type: 'standard__navItemPage', attributes: { apiName: this.tab } });
    }
}
`,
        });
        const show = (r: UnitReference) => `${r.kind} ${r.refType}:${r.target} (${r.via})`;
        const refs = getLwcDependencies(unit).references.map(show);
        assert.ok(refs.includes('uses customTab:Invoices (navigation)'), refs.join('\n'));
        assert.ok(refs.includes('uses aura:invoiceApp (navigation)'), refs.join('\n'));
        assert.equal(refs.filter((r) => r.endsWith('(navigation)')).length, 2);
    });

    it('SLDS にないアイコン名 (icon-name の <種類>:<名前>) を UNKNOWN_SLDS_ICON にする (式の値・ほかの種類は見ない)', () => {
        const bundle = parseBundle('icons', {
            'icons.js': `import { LightningElement } from 'lwc';
export default class Icons extends LightningElement {
    name = 'utility:add';
}
`,
            'icons.html': `<template>
    <lightning-icon icon-name="utility:add"></lightning-icon>
    <lightning-icon icon-name="standard:account"></lightning-icon>
    <lightning-icon icon-name="utility:not_a_real_icon"></lightning-icon>
    <lightning-button-icon icon-name={name}></lightning-button-icon>
    <lightning-icon icon-name="mycompany:logo"></lightning-icon>
</template>`,
        });
        const [analysis] = analyzeLwcBundles([bundle]);
        assert.deepEqual(
            analysis!.findings.filter((f) => f.code === 'UNKNOWN_SLDS_ICON').map((f) => f.target),
            ['utility:not_a_real_icon'],
        );
    });

    it('照合済みの基本コンポーネントにない属性 (書き間違い) を UNKNOWN_LIGHTNING_ATTRIBUTE にする', () => {
        const bundle = parseBundle('attrs', {
            'attrs.js': `import { LightningElement } from 'lwc';
export default class Attrs extends LightningElement {
    value = '';
    handleChange() {}
}
`,
            'attrs.html': `<template>
    <lightning-input lable="Name" label="Name" value={value} onchange={handleChange}
        class="wide" data-id="name" aria-describedby="help" title="t" lwc:ref="input"></lightning-input>
    <lightning-modal-body unknown-attribute="x"></lightning-modal-body>
</template>`,
        });
        const [analysis] = analyzeLwcBundles([bundle]);
        assert.deepEqual(
            analysis!.findings
                .filter((f) => f.code === 'UNKNOWN_LIGHTNING_ATTRIBUTE')
                .map((f) => f.target),
            // lightning-modal-body は照合済みでない (言語サーバーの一覧に載らない子のコンポーネント) ので見ない
            ['lightning-input.lable'],
        );
    });
});
