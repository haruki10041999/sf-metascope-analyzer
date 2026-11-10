import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseLwcBundleFolder } from '../../src/analyzer/parser/Lwc/bundle';
import type { LwcBundleFile } from '../../src/analyzer/parser/Lwc/folder';
import { convertLwcModule, parseLwcModule } from '../../src/analyzer/parser/Lwc/module';
import { analyzeLwcModuleCalls } from '../../src/analyzer/processor/Lwc/calls';
import { makeLwcModuleDiff } from '../../src/analyzer/processor/Lwc/diff/module';
import type { UnitReference } from '../../src/analyzer/processor/dependency/types';
import { getLwcDependencies } from '../../src/analyzer/processor/dependency/units';
import type {
    LwcClassJson,
    LwcDeclarationJson,
    LwcModuleJson,
    LwcStaticBlockJson,
} from '../../src/analyzer/types/lwc';

// モジュールの直下の JSON (docs/lwc-json-types.md 5.2・6 章、段階 5)。
// コンポーネント以外のクラス (lwcClass)・export (lwcExport)・export default function・直下の文 (statements)・動的 import

const moduleOf = (source: string, fileName = 'demo/demo.ts'): LwcModuleJson => {
    const parsed = parseLwcModule(fileName, source);
    const { module } = convertLwcModule(parsed);
    assert.ok(module, JSON.stringify(parsed.resolvedError));
    return module;
};

/** export を [種類, local, exported, source, typeOnly] の並びにする */
const exportsOf = (module: LwcModuleJson) =>
    module.exports.map((e) => [e.exportType, e.local, e.exported, e.source, e.typeOnly]);

const declarationOf = (module: LwcModuleJson, name: string): LwcDeclarationJson => {
    const declaration = module.declarations.find((d) => d.name === name);
    assert.ok(declaration?.kind === 'lwcDeclaration', name);
    return declaration;
};

describe('LWC のモジュールの直下の JSON (段階 5)', () => {
    it('export はすべて lwcExport (名前つき・別名・再エクスポート・export *・型だけ)', () => {
        const module = moduleOf(`import { a } from './a';
export const x = 1, y = 2;
export function f() {}
const local = 1;
export { local, a as renamed };
export { b as c, default as d } from 'c/other';
export * from 'c/all';
export * as ns from 'c/ns';
export type { Row } from 'c/utils';
export interface Shape { size: number }
`);
        assert.deepEqual(exportsOf(module), [
            ['named', 'x', 'x', undefined, false],
            ['named', 'y', 'y', undefined, false],
            ['named', 'f', 'f', undefined, false],
            ['named', 'local', 'local', undefined, false],
            ['named', 'a', 'renamed', undefined, false],
            ['named', 'b', 'c', 'c/other', false],
            ['named', 'default', 'd', 'c/other', false],
            ['all', undefined, undefined, 'c/all', false],
            ['all', undefined, 'ns', 'c/ns', false],
            ['named', 'Row', 'Row', 'c/utils', true],
            ['named', 'Shape', 'Shape', undefined, true],
        ]);
        // export { local } で export した宣言は exported: true
        assert.equal(declarationOf(module, 'local').exported, true);
        assert.ok(module.exports.every((e) => e.kind === 'lwcExport' && e.sourceKeys));
    });

    it('export default function は宣言 (名前がなければ default)、export default <式> は default という名前の宣言', () => {
        const named = moduleOf(
            `export default function format(value: number): string { return String(value); }\n`,
        );
        assert.deepEqual(exportsOf(named), [['default', 'format', 'default', undefined, false]]);
        const format = declarationOf(named, 'format');
        assert.equal(format.declarationType, 'function');
        assert.equal(format.exported, true);
        assert.deepEqual(
            format.block?.map((s) => s.kind),
            ['jsReturn'],
        );

        const anonymous = moduleOf(`export default function () { run(); }\n`);
        assert.equal(declarationOf(anonymous, 'default').declarationType, 'function');

        const arrow = moduleOf(`export default (rows) => rows.length;\n`);
        const value = declarationOf(arrow, 'default');
        assert.equal(value.declarationType, 'function');
        assert.equal(value.arrow, true);
        assert.equal(value.expression?.kind, 'jsMemberAccess');
        // 初期値がそのまま関数なら、初期値の式は持たない
        assert.equal(value.init, undefined);

        const object = moduleOf(`export default { size: 1 };\n`);
        const config = declarationOf(object, 'default');
        assert.equal(config.declarationType, 'variable');
        assert.equal(config.init?.kind, 'jsObject');

        const identifier = moduleOf(`const helper = () => 1;\nexport default helper;\n`);
        assert.deepEqual(exportsOf(identifier), [
            ['default', 'helper', 'default', undefined, false],
        ]);
        assert.equal(declarationOf(identifier, 'helper').exported, true);
    });

    it('変数の宣言は型 (variantType) と初期値の式 (init) を持つ', () => {
        const module = moduleOf(`export const limit: number = 10;\nlet name;\n`);
        const limit = declarationOf(module, 'limit');
        assert.equal(limit.variantType?.text, 'number');
        assert.deepEqual(limit.init?.kind === 'jsNumber' && limit.init.value, 10);
        const name = declarationOf(module, 'name');
        assert.equal(name.init, undefined);
        assert.equal(name.variableKind, 'let');
    });

    it('コンポーネント以外のクラスは lwcClass (メンバー・static ブロック・extends の式)', () => {
        const module = moduleOf(`import { LightningElement } from 'lwc';
import save from '@salesforce/apex/Ctrl.save';
export class Store extends Base implements Saver {
    static count = 0;
    static { Store.count = 1; }
    #items: string[] = [];
    constructor(private readonly id: string) { super(); }
    get size() { return this.#items.length; }
    async save() { await save({ id: this.id }); }
}
export default class Demo extends LightningElement {}
`);
        const store = module.declarations.find((d) => d.name === 'Store') as LwcClassJson;
        assert.equal(store.kind, 'lwcClass');
        assert.equal(store.exported, true);
        assert.deepEqual(store.superClass, {
            kind: 'jsIdentifier',
            sourceKeys: store.superClass!.sourceKeys,
            name: 'Base',
        });
        assert.deepEqual(
            store.implement?.map((t) => t.text),
            ['Saver'],
        );
        assert.deepEqual(
            store.block.map((m) => `${m.kind}:${'name' in m ? m.name : ''}`),
            [
                'lwcField:count',
                'lwcStaticBlock:',
                'lwcField:#items',
                'lwcConstructor:constructor',
                'lwcProperty:size',
                'lwcMethod:save',
            ],
        );
        const staticBlock = store.block[1] as LwcStaticBlockJson;
        assert.deepEqual(
            staticBlock.block?.map((s) => s.kind),
            ['jsExpression'],
        );
        const saveMethod = store.block[5]!;
        assert.ok(saveMethod.kind === 'lwcMethod');
        // 呼び出しは解析で出す (コンポーネント以外のクラスのメンバーも)
        assert.deepEqual(
            analyzeLwcModuleCalls(module)
                .filter((c) => c.ownerKind === 'lwcClass' && c.member === 'save')
                .flatMap((c) => c.calls.map((call) => `${call.callType}:${call.target}`)),
            ['apex:save'],
        );
        // コンポーネントのクラスは declarations に入れない
        assert.deepEqual(
            module.declarations.map((d) => d.name),
            ['Store'],
        );
        assert.equal(module.component?.name, 'Demo');
    });

    it('宣言でも import / export でもない直下の文は statements (なければ持たない)', () => {
        const module = moduleOf(`import { register } from 'c/registry';
register('demo');
if (window.flag) { register('flag'); }
export const x = 1;
`);
        assert.deepEqual(
            module.statements?.map((s) => s.kind),
            ['jsExpression', 'jsIf'],
        );
        assert.equal(moduleOf('export const x = 1;\n').statements, undefined);
        // 直下の文の呼び出しも解析で出す (段階 5 までの JSON は直下の文の呼び出しを持たなかった)
        const statements = analyzeLwcModuleCalls(module).find((c) => c.ownerKind === 'module');
        assert.deepEqual(
            statements?.calls.map((c) => [c.callType, c.target, c.context.nestingDepth]),
            [
                ['module', 'register', 0],
                ['module', 'register', 1],
            ],
        );
    });

    it('動的 import は式 (jsImportCall) と呼び出し (解析の importCall) になり、依存関係の参照にもなる', () => {
        const source = `import { LightningElement } from 'lwc';
export { format } from 'c/formatter';
export default class Demo extends LightningElement {
    async connectedCallback() {
        const { default: ctor } = await import('c/dynamicChild');
        this.ctor = ctor;
    }
}
`;
        const module = moduleOf(source, 'demo/demo.js');
        const method = module.component!.block[0]!;
        assert.ok(method.kind === 'lwcMethod');
        assert.deepEqual(
            analyzeLwcModuleCalls(module).flatMap((c) =>
                c.calls.map((call) => `${call.callType}:${call.target}`),
            ),
            ['importCall:c/dynamicChild'],
        );
        const json = JSON.stringify(method.block);
        assert.ok(json.includes('"kind":"jsImportCall"'), json);

        const files: LwcBundleFile[] = [
            { fileType: 'module', fileName: 'demo.js', filePath: 'demo/demo.js', source },
        ];
        const result = parseLwcBundleFolder({
            name: 'demo',
            bundleDir: 'demo',
            files,
            skippedFiles: [],
        });
        assert.equal(result.dataType, 'lwcBundle', JSON.stringify(result.resolvedError));
        const show = (r: UnitReference) => `${r.kind} ${r.refType}:${r.target} (${r.via})`;
        const references = getLwcDependencies(result).references.map(show);
        assert.ok(references.includes('imports lwc:formatter (export)'), references.join('\n'));
        assert.ok(
            references.includes('imports lwc:dynamicChild (importCall)'),
            references.join('\n'),
        );
    });

    it('Diff: export は外から見える名前で、クラスはメンバーで、直下の文は GumTree で比べる', () => {
        const before = moduleOf(`export { a } from 'c/a';
export class Store { size = 1; run() { return 1; } }
register('x');
`);
        const after = moduleOf(`export { a as b } from 'c/a';
export class Store { size = 2; run() { return 1; } }
register('y');
`);
        // モジュールの差分は kind のない入れ物 (TypedObjectDiff) なので、fields をそのまま見る
        const diff = makeLwcModuleDiff(before, after) as unknown as {
            fields: Record<string, { status: string; value?: { exported?: string } }[]>;
        };
        // export { a as b } は外から見える名前が変わるので、a の削除と b の追加
        assert.deepEqual(
            diff.fields.exports!.map((e) => [e.status, e.value?.exported]),
            [
                ['removed', 'a'],
                ['unchanged', 'Store'],
                ['added', 'b'],
            ],
        );
        const [store] = diff.fields.declarations as unknown as {
            status: string;
            fields: { block: { status: string }[] };
        }[];
        assert.equal(store?.status, 'changed');
        assert.deepEqual(
            store.fields.block.map((m) => m.status),
            ['changed', 'unchanged'],
        );
        // 直下の文の差分は GumTree の差分の並び (本体の block と同じ)
        const statements = diff.fields.statements as unknown as { label: string; status: string }[];
        assert.ok(Array.isArray(statements));
        assert.deepEqual(
            statements.map((s) => [s.label, s.status]),
            [['jsExpression', 'changed']],
        );
    });
});
