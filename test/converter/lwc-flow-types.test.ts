// Flow の型注釈の JSON (docs/lwc-json-types.md 7 章の 8)。
// // @flow の .js を LwcParser と同じ道 (parseLwcModule → convertLwcModule) で読み、TS と同じ形の JSON になるかを確かめる
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { convertLwcModule, parseLwcModule } from '../../src/analyzer/parser/Lwc/module';
import { hasFlowPragma, parseScript } from '../../src/analyzer/parser/Lwc/script';
import type {
    LwcComponentJson,
    LwcFieldJson,
    LwcMethodJson,
    LwcModuleJson,
    LwcTypeDeclarationJson,
} from '../../src/analyzer/types/lwc';

const moduleOf = (file: string, source: string): LwcModuleJson => {
    const parsed = parseLwcModule(file, source);
    // 構文エラーはない (LWC Compiler は Flow を読まないので、検証の LWC1007 は出てよい)
    assert.deepEqual(
        parsed.resolvedError.filter((e) => e.code === 'JS_SYNTAX' || e.code === 'TS_SYNTAX'),
        [],
    );
    const { module } = convertLwcModule(parsed);
    assert.ok(module);
    return module;
};

/** 位置と文字列 (sourceKeys・text) を除いた形 */
const shape = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(shape);
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value)
                .filter(([key]) => key !== 'sourceKeys' && key !== 'text')
                .map(([key, v]) => [key, shape(v)]),
        );
    }
    return value;
};

const componentOf = (module: LwcModuleJson): LwcComponentJson => {
    assert.ok(module.component && module.component.kind === 'lwcComponent');
    return module.component as LwcComponentJson;
};

const fieldType = (module: LwcModuleJson, name: string) => {
    const field = componentOf(module).block.find(
        (m) => m.kind === 'lwcField' && (m as LwcFieldJson).name === name,
    ) as LwcFieldJson | undefined;
    assert.ok(field?.variantType, name);
    return field.variantType;
};

const typeDeclaration = (module: LwcModuleJson, name: string): LwcTypeDeclarationJson => {
    const declaration = (module.typeDeclarations ?? []).find((d) => d.name === name);
    assert.ok(declaration, name);
    return declaration;
};

const FLOW = `// @flow
import { LightningElement, api } from 'lwc';

export type Row = { id: string, name?: number, tags: Array<string> };
type Handler = (x: number, ...rest: string[]) => boolean;
export interface Shape { area(): number; label: string }
enum Color { Red, Green }

export default class Sample extends LightningElement {
    @api record: Row | null = null;
    items: Row[] = [];
    pair: [string, number];
    mode: 'a' | 'b' | -1 = 'a';
    both: Row & Shape;
    seen: typeof Color;
    handle(e: Event, count: number): Promise<void> {
        return Promise.resolve();
    }
}
`;

const TS = `import { LightningElement, api } from 'lwc';

export type Row = { id: string; name?: number; tags: Array<string> };
type Handler = (x: number, ...rest: string[]) => boolean;
export interface Shape { area(): number; label: string }
enum Color { Red, Green }

export default class Sample extends LightningElement {
    @api record: Row | null = null;
    items: Row[] = [];
    pair: [string, number];
    mode: 'a' | 'b' | -1 = 'a';
    both: Row & Shape;
    seen: typeof Color;
    handle(e: Event, count: number): Promise<void> {
        return Promise.resolve();
    }
}
`;

describe('LWC の JSON: Flow の型', () => {
    it('@flow があるときだけ flow プラグインで読む', () => {
        assert.equal(hasFlowPragma('// @flow\nconst a = 1;'), true);
        assert.equal(hasFlowPragma('/**\n * @flow strict\n */\nconst a = 1;'), true);
        assert.equal(hasFlowPragma('#!/usr/bin/env node\n// @flow\n'), true);
        assert.equal(hasFlowPragma('// @noflow\nconst a = 1;'), false);
        assert.equal(hasFlowPragma('const a = 1; // @flow'), false);
        assert.equal(hasFlowPragma('const a = 1;'), false);
        // @flow のない .js の Flow の構文は、今までどおり構文エラー
        assert.ok(parseScript('const a: number = 1;', 'js').syntaxErrors.length > 0);
        assert.equal(parseScript('// @flow\nconst a: number = 1;', 'js').syntaxErrors.length, 0);
    });

    it('フィールド・引数・戻り値・型の宣言が TS と同じ JSON になる', () => {
        const flow = moduleOf('sample/sample.js', FLOW);
        const ts = moduleOf('sample/sample.ts', TS);
        assert.equal(flow.fileType, 'js');

        for (const name of ['record', 'items', 'pair', 'mode', 'both', 'seen']) {
            assert.deepEqual(shape(fieldType(flow, name)), shape(fieldType(ts, name)), name);
        }
        assert.deepEqual(shape(fieldType(flow, 'seen')), {
            kind: 'lwcType',
            type: 'typeof',
            target: 'Color',
        });

        const method = (module: LwcModuleJson) =>
            componentOf(module).block.find(
                (m) => m.kind === 'lwcMethod' && (m as LwcMethodJson).name === 'handle',
            ) as LwcMethodJson;
        assert.deepEqual(shape(method(flow).returnType), shape(method(ts).returnType));
        assert.deepEqual(
            method(flow).param.map((p) => shape(p.variantType)),
            method(ts).param.map((p) => shape(p.variantType)),
        );

        for (const name of ['Row', 'Handler', 'Shape', 'Color']) {
            assert.deepEqual(
                shape(typeDeclaration(flow, name)),
                shape(typeDeclaration(ts, name)),
                name,
            );
        }
        assert.deepEqual(shape(typeDeclaration(flow, 'Handler').variantType), {
            kind: 'lwcType',
            type: 'function',
            params: [
                { name: 'x', paramType: { type: 'primitive', primitiveType: 'number' } },
                {
                    name: '...rest',
                    paramType: {
                        type: 'array',
                        elementType: { type: 'primitive', primitiveType: 'string' },
                    },
                },
            ],
            returnType: { type: 'primitive', primitiveType: 'boolean' },
        });
    });

    it('?T は T | null | void の union', () => {
        const flow = moduleOf(
            'sample/sample.js',
            '// @flow\nexport default class Sample { a: ?string; }\n',
        );
        const ts = moduleOf(
            'sample/sample.ts',
            'export default class Sample { a: string | null | void; }\n',
        );
        assert.deepEqual(shape(fieldType(flow, 'a')), shape(fieldType(ts, 'a')));
    });

    it('Flow だけの型は構造で表す (exact・スプレッド・variance・indexer・* ・$Keys など)', () => {
        const module = moduleOf(
            'util/util.js',
            `// @flow
type Base = {| +id: string, -count: number |};
type Ext = { ...Base, [key: string]: mixed, +[number]: empty, ... };
type Keys = $Keys<Base>;
type Any = *;
type Fn = (string, this: Base) => void;
type Method = { get size(): number, set size(v: number): void, run(): Promise<void> };
opaque type Id: string = string;
interface Named extends Base { name: string }
type Big = 1n;
`,
        );
        const variant = (name: string) => shape(typeDeclaration(module, name).variantType);

        assert.deepEqual(variant('Base'), {
            kind: 'lwcType',
            type: 'object',
            members: [
                {
                    name: 'id',
                    memberType: { type: 'primitive', primitiveType: 'string' },
                    optional: false,
                    method: false,
                    variance: 'plus',
                },
                {
                    name: 'count',
                    memberType: { type: 'primitive', primitiveType: 'number' },
                    optional: false,
                    method: false,
                    variance: 'minus',
                },
            ],
            exactness: 'exact',
        });
        assert.deepEqual(variant('Ext'), {
            kind: 'lwcType',
            type: 'object',
            members: [],
            indexers: [
                {
                    name: 'key',
                    keyType: { type: 'primitive', primitiveType: 'string' },
                    valueType: { type: 'primitive', primitiveType: 'mixed' },
                },
                {
                    keyType: { type: 'primitive', primitiveType: 'number' },
                    valueType: { type: 'primitive', primitiveType: 'empty' },
                    variance: 'plus',
                },
            ],
            spreads: [{ type: 'custom', customType: 'Base' }],
            exactness: 'inexact',
        });
        assert.deepEqual(variant('Keys'), {
            kind: 'lwcType',
            type: 'custom',
            customType: '$Keys',
            generic: [{ type: 'custom', customType: 'Base' }],
        });
        assert.deepEqual(variant('Any'), {
            kind: 'lwcType',
            type: 'primitive',
            primitiveType: '*',
        });
        assert.deepEqual(variant('Fn'), {
            kind: 'lwcType',
            type: 'function',
            params: [
                { name: 'this', paramType: { type: 'custom', customType: 'Base' } },
                { paramType: { type: 'primitive', primitiveType: 'string' } },
            ],
            returnType: { type: 'primitive', primitiveType: 'void' },
        });
        assert.deepEqual(variant('Method'), {
            kind: 'lwcType',
            type: 'object',
            members: [
                {
                    name: 'size',
                    memberType: { type: 'primitive', primitiveType: 'number' },
                    optional: false,
                    method: true,
                },
                { name: 'size', optional: false, method: true },
                {
                    name: 'run',
                    memberType: {
                        type: 'custom',
                        customType: 'Promise',
                        generic: [{ type: 'primitive', primitiveType: 'void' }],
                    },
                    optional: false,
                    method: true,
                },
            ],
        });
        assert.deepEqual(variant('Big'), { kind: 'lwcType', type: 'literal', value: '1n' });

        const id = typeDeclaration(module, 'Id');
        assert.equal(id.declarationType, 'type');
        assert.equal(id.opaque, true);
        assert.deepEqual(shape(id.supertype), {
            kind: 'lwcType',
            type: 'primitive',
            primitiveType: 'string',
        });

        const named = typeDeclaration(module, 'Named');
        assert.equal(named.declarationType, 'interface');
        assert.deepEqual(named.extend, ['Base']);
        assert.deepEqual(named.members, [
            {
                name: 'name',
                memberType: { type: 'primitive', primitiveType: 'string' },
                optional: false,
                method: false,
            },
        ]);
    });

    it('@flow のない .js は型の宣言を持たない (今までどおり)', () => {
        const module = moduleOf('plain/plain.js', 'export const a = 1;\n');
        assert.equal(module.typeDeclarations, undefined);
    });
});
