import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { LwcParser, type LwcBundleStructureType } from '../../src/analyzer/parser/Lwc';
import { writeSaveDataInfo } from '../../src/analyzer/parser/commons';
import type {
    LwcComponentJson,
    LwcFieldJson,
    LwcMemberJson,
    LwcMethodJson,
    LwcModuleJson,
    LwcPropertyJson,
} from '../../src/analyzer/types/lwc';

const BUNDLES = 'docs/examples/repository/before/force-app/main/default/lwc';

const parseBundle = async (name: string): Promise<LwcBundleStructureType> => {
    const result = await LwcParser.parseLwcBundle(`${BUNDLES}/${name}`);
    assert.equal(result.dataType, 'lwcBundle');
    return result as LwcBundleStructureType;
};

const mainModule = (bundle: LwcBundleStructureType): LwcModuleJson => {
    const entry = bundle.result.base.modules.find((m) => m.main);
    assert.ok(entry && 'fileType' in entry.module);
    return entry.module as LwcModuleJson;
};

const componentOf = (module: LwcModuleJson): LwcComponentJson => {
    assert.ok(module.component && module.component.kind === 'lwcComponent');
    return module.component as LwcComponentJson;
};

/** block のメンバーを名前で引く */
const memberOf = <T extends LwcMemberJson>(
    component: LwcComponentJson,
    kind: T['kind'],
    name: string,
) => {
    const member = component.block.find((m) => m.kind === kind && 'name' in m && m.name === name);
    assert.ok(member, `${kind} ${name}`);
    return member as T;
};

const decoratorNames = (member: { modifier: { decorator?: { kind: string; name?: string }[] } }) =>
    (member.modifier.decorator ?? []).map((d) => (d.kind === 'lwcDecorator' ? d.name : d.kind));

/** 一時フォルダにバンドルを作る */
const withBundle = async (
    name: string,
    files: Record<string, string>,
    run: (bundleDir: string) => Promise<void>,
) => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'lwc-json-'));
    const bundleDir = path.join(dir, name);
    await fs.mkdir(bundleDir);
    for (const [file, content] of Object.entries(files)) {
        await fs.writeFile(path.join(bundleDir, file), content);
    }
    try {
        await run(bundleDir);
    } finally {
        await fs.rm(dir, { recursive: true, force: true });
    }
};

describe('LWC の JSON', () => {
    it('import を category ごとに分解する', async () => {
        const module = mainModule(await parseBundle('accountList'));
        const imports = module.imports.flatMap((i) => (i.kind === 'lwcImport' ? [i] : []));
        assert.deepEqual(
            imports.map((i) => i.category),
            [
                'lwc',
                'lightning',
                'lightning',
                'lightning',
                'apex',
                'apex',
                'schema',
                'schema',
                'label',
                'component',
                'component',
            ],
        );
        const apex = imports.find(
            (i) => i.source === '@salesforce/apex/AccountController.getAccounts',
        );
        assert.deepEqual(apex?.apex, { className: 'AccountController', methodName: 'getAccounts' });
        const schema = imports.find((i) => i.source === '@salesforce/schema/Account.Name');
        assert.deepEqual(schema?.schema, { objectApiName: 'Account', fieldApiName: 'Name' });
        // import type は typeOnly。specifier はソース位置を持つ
        assert.deepEqual(
            imports.map((i) => i.typeOnly),
            [false, false, false, false, false, false, false, false, false, true, false],
        );
        assert.equal(imports[0]!.specifiers[0]!.kind, 'lwcImportSpecifier');
        assert.deepEqual(
            imports[0]!.specifiers.map((s) => `${s.specifierType}:${s.local}`),
            ['named:LightningElement', 'named:api', 'named:wire', 'named:track'],
        );
    });

    it('コンポーネント: extend・mixins と、block (ソースの順のメンバー)', async () => {
        const component = componentOf(mainModule(await parseBundle('accountList')));
        assert.equal(component.name, 'AccountList');
        assert.equal(component.extend, 'LightningElement');
        assert.deepEqual(component.mixins, ['NavigationMixin']);
        assert.deepEqual(
            component.block.map((m) => `${m.kind}:${'name' in m ? m.name : ''}`),
            [
                'lwcField:recordId',
                'lwcField:title',
                'lwcField:maxRows',
                'lwcField:rows',
                'lwcField:viewMode',
                'lwcField:sortDirection',
                'lwcField:error',
                'lwcField:record',
                'lwcMethod:wiredAccounts',
                'lwcProperty:parentName',
                'lwcProperty:hasRows',
                'lwcProperty:isTable',
                'lwcProperty:totalAmount',
                'lwcMethod:handleSelect',
                'lwcMethod:handleDelete',
                'lwcMethod:refresh',
            ],
        );
    });

    it('フィールド・getter の型と修飾子 (Apex の variantType / modifier と同じ名前)', async () => {
        const component = componentOf(mainModule(await parseBundle('accountList')));
        const recordId = memberOf<LwcFieldJson>(component, 'lwcField', 'recordId');
        assert.deepEqual(decoratorNames(recordId), ['api']);
        assert.ok(recordId.variantType?.kind === 'lwcType');
        assert.equal(recordId.variantType.type, 'primitive');

        const rows = memberOf<LwcFieldJson>(component, 'lwcField', 'rows');
        assert.deepEqual(decoratorNames(rows), ['track']);
        assert.equal(rows.modifier.access, 'private');
        assert.equal(rows.init, '[]');
        assert.ok(rows.variantType?.kind === 'lwcType' && rows.variantType.type === 'array');
        assert.deepEqual(rows.variantType.elementType, { type: 'custom', customType: 'Row' });

        const maxRows = memberOf<LwcFieldJson>(component, 'lwcField', 'maxRows');
        assert.equal(maxRows.optional, true);
        assert.equal(maxRows.init, '10');

        const parentName = memberOf<LwcPropertyJson>(component, 'lwcProperty', 'parentName');
        assert.equal(parentName.isGetter, true);
        assert.equal(parentName.isSetter, false);
        assert.ok(parentName.variantType?.kind === 'lwcType');
        assert.equal(parentName.variantType.text, 'string | undefined');
    });

    it('@wire の設定はデコレーターに、イベント・呼び出しはメソッドに入る', async () => {
        const component = componentOf(mainModule(await parseBundle('accountList')));
        const record = memberOf<LwcFieldJson>(component, 'lwcField', 'record');
        const [wire] = record.modifier.decorator ?? [];
        assert.ok(wire?.kind === 'lwcDecorator' && wire.wire);
        assert.equal(wire.wire.adapter, 'getRecord');
        assert.equal(wire.wire.adapterSource, 'lightning/uiRecordApi');
        // 設定の項目は位置を持ち (lwcWireConfig)、値の中の import (項目) と結び付く
        assert.deepEqual(
            wire.wire.config.map((c) => [
                c.kind,
                c.key,
                c.reactive ?? null,
                c.references.map((r) => r.schema?.fieldApiName),
            ]),
            [
                ['lwcWireConfig', 'recordId', 'recordId', []],
                ['lwcWireConfig', 'fields', null, ['Name', 'Industry']],
            ],
        );
        // Apex のアダプターは、クラスとメソッドに解決する
        const wiredAccounts = memberOf<LwcMethodJson>(component, 'lwcMethod', 'wiredAccounts');
        const [apexWire] = wiredAccounts.modifier.decorator ?? [];
        assert.ok(apexWire?.kind === 'lwcDecorator');
        assert.deepEqual(apexWire.wire?.apex, {
            className: 'AccountController',
            methodName: 'getAccounts',
        });
        // 初期値の中の import (ラベル)
        const title = memberOf<LwcFieldJson>(component, 'lwcField', 'title');
        assert.deepEqual(
            title.references.map((r) => r.source),
            ['@salesforce/label/c.AccountListTitle'],
        );

        const methods = component.block.flatMap((m) => (m.kind === 'lwcMethod' ? [m] : []));
        assert.deepEqual(
            Object.fromEntries(
                methods.map((m) => [m.name, m.calls.map((c) => `${c.callType}:${c.target}`)]),
            ),
            {
                wiredAccounts: [],
                handleSelect: ['dispatchEvent:CustomEvent', 'navigate:Navigate'],
                handleDelete: ['apex:deleteAccount', 'dispatchEvent:ShowToastEvent'],
                refresh: ['refs:table'],
            },
        );
        // imperative な Apex の呼び出しは引数を持つ
        const handleDelete = memberOf<LwcMethodJson>(component, 'lwcMethod', 'handleDelete');
        assert.deepEqual(handleDelete.calls[0]?.arg, ['{ recordId }']);
        // 本体は lwcBody (位置と文の数)
        assert.equal(handleDelete.body?.kind, 'lwcBody');
        assert.equal(handleDelete.body?.statements, 2);
        const handleSelect = memberOf<LwcMethodJson>(component, 'lwcMethod', 'handleSelect');
        assert.deepEqual(
            handleSelect.events.map((e) => [e.name, e.bubbles, e.composed, e.detail]),
            [['accountselect', true, false, '{ recordId, index }']],
        );
        assert.ok(handleSelect.events[0]?.detailType?.kind === 'lwcType');
        assert.equal(handleSelect.events[0].detailType.text, 'SelectDetail');

        const wired = memberOf<LwcMethodJson>(component, 'lwcMethod', 'wiredAccounts');
        assert.deepEqual(decoratorNames(wired), ['wire']);
        // 分割代入の引数の名前は型注釈を含まない (Apex の ParameterJson と同じく variant)
        assert.ok(wired.param[0]?.kind === 'lwcParameter');
        assert.equal(wired.param[0].variant, '{ data, error }');
        const refresh = memberOf<LwcMethodJson>(component, 'lwcMethod', 'refresh');
        assert.deepEqual(decoratorNames(refresh), ['api']);
    });

    it('本体を変えると、JSON の中身 (lwcBody の objectKey) が変わる', async () => {
        const source = (body: string) =>
            `import { LightningElement } from 'lwc';
export default class Hello extends LightningElement {
    get isTable() { ${body} }
}
`;
        const bodies: unknown[] = [];
        for (const body of ["return this.mode === 'table';", "return this.mode !== 'table';"]) {
            await withBundle('hello', { 'hello.js': source(body) }, async (dir) => {
                const component = componentOf(
                    mainModule((await LwcParser.parseLwcBundle(dir)) as LwcBundleStructureType),
                );
                bodies.push(
                    memberOf<LwcPropertyJson>(component, 'lwcProperty', 'isTable').getterContent
                        ?.body,
                );
            });
        }
        const [before, after] = bodies as { kind: string; sourceKeys: { objectKey: string } }[];
        assert.equal(before?.kind, 'lwcBody');
        assert.notEqual(before?.sourceKeys.objectKey, after?.sourceKeys.objectKey);
    });

    it('innerHTML への代入を lwcCall にする', async () => {
        const source = `import { LightningElement } from 'lwc';
export default class Hello extends LightningElement {
    renderedCallback() { this.template.querySelector('div').innerHTML = this.html; }
}
`;
        await withBundle('hello', { 'hello.js': source }, async (dir) => {
            const component = componentOf(
                mainModule((await LwcParser.parseLwcBundle(dir)) as LwcBundleStructureType),
            );
            const method = memberOf<LwcMethodJson>(component, 'lwcMethod', 'renderedCallback');
            assert.deepEqual(
                method.calls.map((c) => `${c.callType}:${c.target}`),
                ["innerHTML:this.template.querySelector('div').innerHTML", "querySelector:'div'"],
            );
        });
    });

    it('モジュールの直下の宣言 (export しないものも含む) を declarations に持つ', async () => {
        const utils = mainModule(await parseBundle('utils'));
        assert.deepEqual(
            utils.declarations.map((d) =>
                d.kind === 'lwcDeclaration'
                    ? `${d.name}:${d.declarationType}:${d.exported}`
                    : d.kind,
            ),
            ['formatter:variable:false', 'formatAmount:function:true', 'toRows:function:true'],
        );
        const toRows = utils.declarations.find(
            (d) => d.kind === 'lwcDeclaration' && d.name === 'toRows',
        );
        assert.ok(toRows?.kind === 'lwcDeclaration');
        assert.equal(toRows.body?.kind, 'lwcBody');
        assert.deepEqual(
            toRows.param?.map((p) => (p.kind === 'lwcParameter' ? p.variant : p.kind)),
            ['records'],
        );
        // コンポーネントのクラスは declarations に入れない
        const accountList = mainModule(await parseBundle('accountList'));
        assert.deepEqual(accountList.declarations, []);
    });

    it('同じ名前の getter と setter は 1 つの lwcProperty にまとめる', async () => {
        const source = `import { LightningElement, api } from 'lwc';\nexport default class Hello extends LightningElement {\n    @api\n    get value() { return this._v; }\n    set value(v) { this._v = v; }\n}\n`;
        await withBundle('hello', { 'hello.js': source }, async (dir) => {
            const component = componentOf(
                mainModule((await LwcParser.parseLwcBundle(dir)) as LwcBundleStructureType),
            );
            assert.equal(component.block.length, 1);
            const value = memberOf<LwcPropertyJson>(component, 'lwcProperty', 'value');
            assert.equal(value.isGetter, true);
            assert.equal(value.isSetter, true);
            assert.deepEqual(decoratorNames(value.getterContent!), ['api']);
        });
    });

    it('TS の型の宣言と、default 以外の export', async () => {
        const accountList = mainModule(await parseBundle('accountList'));
        assert.deepEqual(
            accountList.typeDeclarations?.map((t) =>
                t.kind === 'lwcTypeDeclaration' ? [t.name, t.declarationType, t.exported] : t.kind,
            ),
            [
                ['ViewMode', 'type', false],
                ['SelectDetail', 'interface', false],
            ],
        );
        const utils = mainModule(await parseBundle('utils'));
        assert.equal(utils.component, undefined);
        assert.deepEqual(utils.otherExports, ['formatAmount', 'toRows']);
        assert.deepEqual(
            utils.typeDeclarations?.map((t) =>
                t.kind === 'lwcTypeDeclaration' ? `${t.name}:${t.exported}` : t.kind,
            ),
            ['SortDirection:true', 'Row:true'],
        );
    });

    it('JSON の sourceKeys はすべて sourceObject にあり、ファイル全体のソースは持たない', async () => {
        const bundle = await parseBundle('accountList');
        const sourceKeys = new Set(
            bundle.result.sourceObject.flatMap((o) =>
                o.source.map((s) => `${o.objectKey}/${s.sourceKey}`),
            ),
        );
        const missing: string[] = [];
        const walk = (value: unknown): void => {
            if (Array.isArray(value)) return value.forEach(walk);
            if (!value || typeof value !== 'object') return;
            const record = value as Record<string, unknown>;
            const keys = record.sourceKeys as Record<string, unknown> | undefined;
            if (keys && record.kind !== 'error') {
                const list = 'objectKey' in keys ? [keys] : Object.values(keys);
                for (const k of list as { objectKey: string; sourceKey: string }[]) {
                    if (!sourceKeys.has(`${k.objectKey}/${k.sourceKey}`)) missing.push(k.objectKey);
                }
            }
            Object.entries(record).forEach(([key, child]) => key !== 'sourceKeys' && walk(child));
        };
        walk(bundle.result.base);
        assert.deepEqual(missing, []);
        assert.ok(bundle.result.sourceObject.every((o) => !o.objectKey.startsWith('file_')));
        // 位置はバンドルのどれかのファイルのもの (JS / HTML / CSS)。ルート (lwcTemplate / lwcStylesheet) は空の範囲。ファイル全体を context に持つものはない
        const files = [
            'accountList/accountList.ts',
            'accountList/accountList.html',
            'accountList/accountList.css',
            'accountList/accountList.js-meta.xml',
        ];
        assert.ok(
            bundle.result.sourceObject.every((o) =>
                o.source.every((s) => files.includes(s.filePath)),
            ),
        );
        assert.ok(
            bundle.result.sourceObject
                .filter((o) => /^(lwcStylesheet|lwcTemplate)_/.test(o.objectKey))
                .every((o) => o.context === ''),
        );
    });

    it('位置だけが変わっても objectKey は変わらず、sourceKey は変わる', async () => {
        const source = `import { LightningElement, api } from 'lwc';\nexport default class Hello extends LightningElement {\n    @api name;\n}\n`;
        let first: LwcComponentJson | undefined;
        await withBundle('hello', { 'hello.js': source }, async (dir) => {
            first = componentOf(
                mainModule((await LwcParser.parseLwcBundle(dir)) as LwcBundleStructureType),
            );
        });
        await withBundle('hello', { 'hello.js': `\n\n${source}` }, async (dir) => {
            const second = componentOf(
                mainModule((await LwcParser.parseLwcBundle(dir)) as LwcBundleStructureType),
            );
            assert.equal(second.sourceKeys.base.objectKey, first!.sourceKeys.base.objectKey);
            assert.notEqual(second.sourceKeys.base.sourceKey, first!.sourceKeys.base.sourceKey);
        });
    });

    it('回復できない構文エラーのモジュールは ErrorJson、メインのモジュールがなければバンドルが error', async () => {
        await withBundle(
            'hello',
            {
                'hello.js': 'export default class A {\n    x = ;\n}\n',
                'shared.js': 'export const x = 1;\n',
            },
            async (dir) => {
                const result = (await LwcParser.parseLwcBundle(dir)) as LwcBundleStructureType;
                assert.equal(result.dataType, 'lwcBundle');
                const hello = result.result.base.modules.find((m) => m.fileName === 'hello.js');
                assert.ok(hello && 'kind' in hello.module && hello.module.kind === 'error');
                assert.equal(result.resolvedError[0]?.code, 'JS_SYNTAX');
                const shared = result.result.base.modules.find((m) => m.fileName === 'shared.js');
                assert.ok(shared && 'fileType' in shared.module);
            },
        );
        await withBundle('hello', { 'other.js': 'export const x = 1;\n' }, async (dir) => {
            const result = await LwcParser.parseLwcBundle(dir);
            assert.equal(result.dataType, 'error');
            assert.equal(result.result.base.kind, 'error');
        });
    });

    it('IR を作れなかったノードは境界で止める (field は部分木全体、メソッドは自身だけを検査)', async () => {
        const source = `import { LightningElement, api } from 'lwc';\nexport default class Hello extends LightningElement {\n    @api a = 1;\n    b = (1 = 2);\n    run() { 1 = 3; this.refs.r; }\n}\n`;
        await withBundle('hello', { 'hello.js': source }, async (dir) => {
            const result = (await LwcParser.parseLwcBundle(dir)) as LwcBundleStructureType;
            const component = componentOf(mainModule(result));
            assert.deepEqual(
                component.block.map((m) =>
                    m.kind === 'error' ? `error:${m.kindType}` : `${m.kind}:${m.name}`,
                ),
                ['lwcField:a', 'error:lwcField', 'lwcMethod:run'],
            );
            const run = memberOf<LwcMethodJson>(component, 'lwcMethod', 'run');
            assert.deepEqual(
                run.calls.map((c) => `${c.callType}:${c.target}`),
                ['refs:r'],
            );
            // IR のエラー (1 の UNSUPPORTED_CONTEXT) は構文エラーと重なるので、resolvedError は構文エラーだけ
            assert.deepEqual(
                result.resolvedError.map((e) => `${e.phase}:${e.contextType}`),
                ['syntax:InvalidLhs', 'syntax:InvalidLhs'],
            );
        });
    });

    it('msgpack に保存して読み戻せる', async () => {
        const bundle = await parseBundle('accountRow');
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'lwc-save-'));
        try {
            await writeSaveDataInfo(LwcParser.saveLwcBundle(dir, bundle));
            const read = await LwcParser.readLwcMsgPack(dir, 'lwc_accountRow');
            assert.deepEqual(read, JSON.parse(JSON.stringify(bundle)));
        } finally {
            await fs.rm(dir, { recursive: true, force: true });
        }
    });
});
