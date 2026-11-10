import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseLwcBundleFolder } from '../../src/analyzer/parser/Lwc/bundle';
import type { LwcBundleFile } from '../../src/analyzer/parser/Lwc/folder';
import { convertLwcModule, parseLwcModule } from '../../src/analyzer/parser/Lwc/module';
import { analyzeLwcComponent } from '../../src/analyzer/processor/Lwc/analysis';
import { analyzeLwcBodyCalls, type LwcBodyCalls } from '../../src/analyzer/processor/Lwc/calls';
import { makeLwcModuleDiff } from '../../src/analyzer/processor/Lwc/diff/module';
import {
    composeLwcVisitors,
    walkLwcModuleJson,
    type LwcWalkContext,
} from '../../src/analyzer/processor/Lwc/walker';
import {
    makeLwcImportTables,
    type LwcBodyContentJson,
    type LwcComponentJson,
    type LwcDeclarationJson,
    type LwcFieldJson,
    type LwcMethodJson,
    type LwcModuleJson,
    type LwcPropertyJson,
} from '../../src/analyzer/types/lwc';

// LWC の JS の本体の中身 (docs/lwc-json-types.md 6 章の段階 1): 関数を初期値にしたフィールド・
// 本体の import の参照 (references)・callType (lds / refreshApex / messageService / platformResource / module /
// listener / importCall)。段階 3: ナビゲーション・セレクター・wire の文字列の項目・イベントのクラスと発行。
// 段階 6 で呼び出し・イベントは JSON から解析 (processor/Lwc/calls.ts) に移したので、解析の結果で確かめる。
// ファイルシステムに触らず、メモリ上のソースを読む

/** 最後に読んだモジュール (呼び出しの解析の import の表に使う) */
let lastModule: LwcModuleJson | undefined;

/** 1 つの JS / TS を JSON にする */
const moduleOf = (source: string, fileName = 'demo/demo.js'): LwcModuleJson => {
    const parsed = parseLwcModule(fileName, source);
    const { module } = convertLwcModule(parsed);
    assert.ok(module, JSON.stringify(parsed.resolvedError));
    lastModule = module;
    return module;
};

/** 本体の呼び出しとイベント (最後に読んだモジュールの import で解析する) */
const analyze = (content: LwcBodyContentJson): LwcBodyCalls =>
    analyzeLwcBodyCalls(content, makeLwcImportTables(lastModule!.imports));

const componentOf = (source: string, fileName?: string): LwcComponentJson => {
    const { component } = moduleOf(source, fileName);
    assert.ok(component);
    return component;
};

const memberOf = <T>(component: LwcComponentJson, name: string): T => {
    const member = component.block.find((m) => 'name' in m && m.name === name);
    assert.ok(member, name);
    return member as T;
};

const callsOf = (content: LwcBodyContentJson) =>
    analyze(content).calls.map((c) => `${c.callType}:${c.target}`);

/** メモリ上のバンドル (ファイル名 → ソース) を読む */
const bundleOf = (name: string, sources: Record<string, string>) => {
    const files: LwcBundleFile[] = Object.entries(sources).map(([fileName, source]) => ({
        fileType: fileName.endsWith('.html') ? 'template' : 'module',
        fileName,
        filePath: `${name}/${fileName}`,
        source,
    }));
    return parseLwcBundleFolder({ name, bundleDir: name, files, skippedFiles: [] });
};

describe('LWC の本体の中身 (段階 1)', () => {
    it('関数を初期値にしたフィールドは、メソッドと同じ本体の中身 (function) を持つ', () => {
        const component = componentOf(`import { LightningElement } from 'lwc';
import save from '@salesforce/apex/Ctrl.save';
export default class Demo extends LightningElement {
    label = 'x';
    handleClick = async (event) => {
        await save({ id: event.detail });
        this.dispatchEvent(new CustomEvent('saved'));
        this.refs.box.focus();
    };
    handleKey = function (event) { return event.key; };
    format = (value) => value.trim();
}
`);
        const label = memberOf<LwcFieldJson>(component, 'label');
        assert.equal(label.function, undefined);

        const handleClick = memberOf<LwcFieldJson>(component, 'handleClick');
        assert.ok(handleClick.function);
        assert.equal(handleClick.function.async, true);
        assert.deepEqual(
            handleClick.function.param.map((p) => p.variant),
            ['event'],
        );
        // 本体は文の並び (段階 4)
        assert.equal(handleClick.function.arrow, true);
        assert.equal(handleClick.function.block?.length, 3);
        assert.deepEqual(callsOf(handleClick.function), [
            'apex:save',
            'dispatchEvent:CustomEvent',
            'refs:box',
        ]);
        assert.deepEqual(
            analyze(handleClick.function).events.map((e) => e.name),
            ['saved'],
        );
        assert.deepEqual(
            handleClick.function.references.map((r) => r.local),
            ['save'],
        );
        // function 式・式の本体のアロー関数 (block はなく、式の本体は expression)
        assert.equal(memberOf<LwcFieldJson>(component, 'handleKey').function?.async, false);
        const format = memberOf<LwcFieldJson>(component, 'format');
        assert.ok(format.function);
        assert.equal(format.function.block, undefined);
        assert.ok(format.function.expression);
    });

    it('本体の中で使っている import を references に持つ (getter の getFieldValue(..., NAME_FIELD) など)', () => {
        const component = componentOf(`import { LightningElement, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import NAME_FIELD from '@salesforce/schema/Account.Name';
export default class Demo extends LightningElement {
    @wire(getRecord, { recordId: '$recordId', fields: [NAME_FIELD] }) record;
    get name() { return getFieldValue(this.record.data, NAME_FIELD); }
    run() { return 1; }
}
`);
        const name = memberOf<LwcPropertyJson>(component, 'name');
        assert.deepEqual(
            name.getterContent?.references.map((r) => [r.local, r.schema?.fieldApiName ?? null]),
            [
                ['getFieldValue', null],
                ['NAME_FIELD', 'Name'],
            ],
        );
        assert.deepEqual(memberOf<LwcMethodJson>(component, 'run').references, []);
    });

    it('import 元と import した名前で callType を決める (lds / refreshApex / messageService / platformResource / module)', () => {
        const component = componentOf(`import { LightningElement, wire } from 'lwc';
import { updateRecord, deleteRecord as remove, getFieldValue } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import { publish, subscribe, MessageContext } from 'lightning/messageService';
import CHANNEL from '@salesforce/messageChannel/Demo__c';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import LIB from '@salesforce/resourceUrl/lib';
import { formatAmount } from 'c/utils';
import * as helpers from './helpers';
import format from 'c/format';
export default class Demo extends LightningElement {
    @wire(MessageContext) context;
    async run() {
        await updateRecord({ fields: {} });
        await remove('001');
        getFieldValue(this.record, 'x');
        await refreshApex(this.wired);
        publish(this.context, CHANNEL, { id: 1 });
        this.subscription = subscribe(this.context, CHANNEL, (m) => m);
        await Promise.all([loadScript(this, LIB + '/a.js'), loadStyle(this, LIB + '/a.css')]);
        formatAmount(1);
        helpers.toRows([]);
        format(1);
    }
}
`);
        const run = memberOf<LwcMethodJson>(component, 'run');
        assert.deepEqual(
            analyze(run).calls.map((c) => [c.callType, c.target, c.source, c.imported]),
            [
                ['lds', 'updateRecord', 'lightning/uiRecordApi', 'updateRecord'],
                ['lds', 'remove', 'lightning/uiRecordApi', 'deleteRecord'],
                ['refreshApex', 'refreshApex', '@salesforce/apex', 'refreshApex'],
                ['messageService', 'publish', 'lightning/messageService', 'publish'],
                ['messageService', 'subscribe', 'lightning/messageService', 'subscribe'],
                [
                    'platformResource',
                    'loadScript',
                    'lightning/platformResourceLoader',
                    'loadScript',
                ],
                ['platformResource', 'loadStyle', 'lightning/platformResourceLoader', 'loadStyle'],
                ['module', 'formatAmount', 'c/utils', 'formatAmount'],
                ['module', 'helpers.toRows', './helpers', 'toRows'],
                ['module', 'format', 'c/format', 'default'],
            ],
        );
        // 引数は式の JSON (ソースの文字列は持たない) と、その中の import の参照
        const publishCall = analyze(run).calls.find((c) => c.target === 'publish');
        assert.deepEqual(
            publishCall?.args.map((a) => a.kind),
            ['jsMemberAccess', 'jsIdentifier', 'jsObject'],
        );
        assert.deepEqual(
            publishCall?.references.map((r) => r.local),
            ['CHANNEL'],
        );
    });

    it('addEventListener / removeEventListener (listener) と動的 import (importCall)', () => {
        const component = componentOf(`import { LightningElement } from 'lwc';
export default class Demo extends LightningElement {
    connectedCallback() {
        window.addEventListener('resize', this.handleResize);
        this.template.addEventListener(\`click\`, () => {});
        this.addEventListener(this.eventName, this.handle);
    }
    disconnectedCallback() {
        window.removeEventListener('resize', this.handleResize);
    }
    async load() {
        const { default: ctor } = await import('c/dynamicChild');
        await import(this.name);
    }
}
`);
        const connected = memberOf<LwcMethodJson>(component, 'connectedCallback');
        assert.deepEqual(
            analyze(connected).calls.map((c) => [c.callType, c.target, c.listener]),
            [
                ['listener', 'resize', 'add'],
                ['listener', 'click', 'add'],
                ['listener', '', 'add'],
            ],
        );
        const disconnected = memberOf<LwcMethodJson>(component, 'disconnectedCallback');
        assert.deepEqual(
            analyze(disconnected).calls.map((c) => [c.callType, c.target, c.listener]),
            [['listener', 'resize', 'remove']],
        );
        assert.deepEqual(callsOf(memberOf<LwcMethodJson>(component, 'load')), [
            'importCall:c/dynamicChild',
            'importCall:',
        ]);
    });

    it('function 宣言の references は本体の import の参照、変数は初期値全体の参照', () => {
        const module = moduleOf(`import { formatAmount } from 'c/utils';
import LABEL from '@salesforce/label/c.Title';
export function total(rows) { return formatAmount(rows.length); }
export const title = (prefix = LABEL) => prefix;
`);
        const [total, title] = module.declarations as LwcDeclarationJson[];
        assert.deepEqual(
            total?.references.map((r) => r.local),
            ['formatAmount'],
        );
        assert.deepEqual(callsOf(total!), ['module:formatAmount']);
        assert.deepEqual(
            title?.references.map((r) => r.local),
            ['LABEL'],
        );
    });

    it('関数のフィールドのイベント・this.refs を、解析 (events) と検証 (lwc:ref) が見る', () => {
        const result = bundleOf('demo', {
            'demo.js': `import { LightningElement } from 'lwc';
export default class Demo extends LightningElement {
    handleClick = () => {
        this.refs.missing.focus();
        this.dispatchEvent(new CustomEvent('picked'));
    };
}
`,
            'demo.html': `<template><button onclick={handleClick} lwc:ref="button">a</button></template>`,
        });
        assert.equal(result.dataType, 'lwcBundle');
        assert.deepEqual(analyzeLwcComponent(result.result.base).events, ['picked']);
        assert.deepEqual(
            result.resolvedError
                .filter((e) => e.phase === 'bundle')
                .map((e) => [e.code, e.contextType]),
            [['TEMPLATE_UNKNOWN_REF', 'missing']],
        );
    });

    it('関数のフィールドの本体の差分は、メソッドと同じく文の差分 (GumTree) に出る', () => {
        const source = (event: string) => `import { LightningElement } from 'lwc';
export default class Demo extends LightningElement {
    handleClick = () => { this.dispatchEvent(new CustomEvent('${event}')); };
}
`;
        const diff = makeLwcModuleDiff(moduleOf(source('a')), moduleOf(source('b')));
        assert.equal(diff.status, 'changed');
        const component = (diff as { fields: Record<string, any> }).fields.component as {
            fields: { block: Record<string, any>[] };
        };
        const field = component.fields.block[0]!;
        assert.equal(field.status, 'changed');
        // 呼び出し・イベントは JSON に持たないので、イベント名の文字列のリテラルの変更として出る
        const block = field.fields.function.fields.block as Record<string, any>[];
        assert.ok(
            JSON.stringify(block).includes('"before":"a"') &&
                JSON.stringify(block).includes('"after":"b"'),
            JSON.stringify(block),
        );
    });
});

/** sourceKeys を除いた形 */
const shape = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(shape);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(
        Object.entries(value)
            .filter(([key]) => key !== 'sourceKeys')
            .map(([key, child]) => [key, shape(child)]),
    );
};

describe('LWC に固有のもの (段階 3)', () => {
    it('ナビゲーションのページ参照 (lwcNavigation)', () => {
        const component = componentOf(`import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
export default class Demo extends NavigationMixin(LightningElement) {
    open() {
        this[NavigationMixin.Navigate](
            {
                type: 'standard__objectPage',
                attributes: { objectApiName: 'Account', actionName: this.action },
                state: { filterName: 'Recent' },
            },
            true,
        );
        this[NavigationMixin.GenerateUrl](this.pageRef);
    }
}
`);
        const open = memberOf<LwcMethodJson>(component, 'open');
        const [navigate, generate] = analyze(open).calls;
        assert.deepEqual(shape(navigate?.navigation), {
            method: 'Navigate',
            pageType: 'standard__objectPage',
            attributes: {
                objectApiName: 'Account',
                actionName: {
                    kind: 'jsMemberAccess',
                    type: 'object',
                    object: { kind: 'jsThis' },
                    operator: '.',
                    member: 'action',
                },
            },
            state: { filterName: 'Recent' },
            replace: true,
        });
        // ページ参照が変数のときは pageType も attributes の中身もない
        assert.deepEqual(shape(generate?.navigation), {
            method: 'GenerateUrl',
            attributes: {},
        });
    });

    it('querySelector のセレクター (lwcQuery。this.template と light DOM の this)', () => {
        const component = componentOf(`import { LightningElement } from 'lwc';
export default class Demo extends LightningElement {
    find() {
        this.template.querySelector('c-account-row[data-id="a b"]').refresh();
        this.template.querySelectorAll('lightning-input, .x > c-child');
        this.querySelector(this.selector);
        document.querySelector('div');
    }
}
`);
        const find = memberOf<LwcMethodJson>(component, 'find');
        assert.deepEqual(
            analyze(find).calls.map((c) => shape(c.query)),
            [
                {
                    root: 'template',
                    all: false,
                    selector: 'c-account-row[data-id="a b"]',
                    tags: ['c-account-row'],
                    dataAttributes: ['data-id'],
                },
                {
                    root: 'template',
                    all: true,
                    selector: 'lightning-input, .x > c-child',
                    tags: ['lightning-input', 'c-child'],
                },
                { root: 'host', all: false },
            ],
        );
    });

    it('wire の設定の、文字列で書いた項目 (fieldNames)', () => {
        const component = componentOf(`import { LightningElement, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
export default class Demo extends LightningElement {
    @wire(getRecord, { recordId: '$recordId', fields: ['Account.Name', 'Account.Owner.Email'], optionalFields: 'Account.Industry', layoutTypes: ['Full'] })
    record;
}
`);
        const config = memberOf<LwcFieldJson>(component, 'record').modifier.decorator?.[0]?.wire
            ?.config;
        assert.deepEqual(
            config?.map((c) => [c.key, c.fieldNames ?? null]),
            [
                ['recordId', null],
                ['fields', ['Account.Name', 'Account.Owner.Email']],
                ['optionalFields', ['Account.Industry']],
                ['layoutTypes', null],
            ],
        );
    });

    it('イベントのクラス (CustomEvent / Event) と、同じ本体で発行するか (dispatched)', () => {
        const component = componentOf(`import { LightningElement } from 'lwc';
export default class Demo extends LightningElement {
    fire() {
        this.dispatchEvent(new CustomEvent('direct'));
        const evt = new Event('later', { bubbles: true });
        this.dispatchEvent(evt);
        this.pending = new CustomEvent('stored');
    }
}
`);
        const fire = memberOf<LwcMethodJson>(component, 'fire');
        assert.deepEqual(
            analyze(fire).events.map((e) => [
                e.name,
                e.eventClass,
                e.dispatched,
                e.bubbles ?? null,
            ]),
            [
                ['direct', 'CustomEvent', true, null],
                ['later', 'Event', true, true],
                ['stored', 'CustomEvent', false, null],
            ],
        );
    });
});

describe('LWC の JSON の走査と、呼び出しの解析 (段階 6)', () => {
    const source = `import { LightningElement } from 'lwc';
import save from '@salesforce/apex/Ctrl.save';
export default class Demo extends LightningElement {
    async run(rows) {
        save({});
        try {
            for (const row of rows) { await save({ row }); }
        } catch (error) {
            save({ error });
        }
        rows.forEach(() => save({}));
    }
}
`;

    it('走査は kind ごとの処理を呼び、文脈 (メンバー・ループ・try・入れ子の関数) を渡す', () => {
        const module = moduleOf(source);
        const seen: [string, LwcWalkContext][] = [];
        const loops: string[] = [];
        walkLwcModuleJson(
            module,
            composeLwcVisitors(
                {
                    jsCall: (node, context) => {
                        if (node.callee.kind === 'jsIdentifier')
                            seen.push([node.callee.name, context]);
                    },
                },
                { jsForOf: () => void loops.push('for of') },
            ),
        );
        assert.deepEqual(
            seen.map(([name, c]) => [
                name,
                c.owner?.name,
                c.member,
                c.loopDepth,
                c.inTry,
                c.functionDepth,
            ]),
            [
                ['save', 'Demo', 'run', 0, false, 0],
                ['save', 'Demo', 'run', 1, true, 0],
                ['save', 'Demo', 'run', 0, false, 0],
                // コールバックの中は別の文脈 (ループ・try を持ち込まない)
                ['save', 'Demo', 'run', 0, false, 1],
            ],
        );
        assert.deepEqual(loops, ['for of']);
    });

    it('呼び出しの解析は文脈を持つ (try の中の Apex の呼び出しなど)', () => {
        const module = moduleOf(source);
        const run = memberOf<LwcMethodJson>(module.component!, 'run');
        assert.deepEqual(
            analyze(run).calls.map((c) => [c.callType, c.context.inTry, c.context.loopDepth]),
            [
                ['apex', false, 0],
                ['apex', true, 1],
                ['apex', false, 0],
                ['apex', false, 0],
            ],
        );
        // 解析の結果は JSON に入らない (calls / events は JSON の型にない)
        assert.equal('calls' in run, false);
        assert.equal('events' in run, false);
    });
});
