import { lwcShape } from './lwcShape';
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
    // 構文エラーも、LWC Compiler の検証のエラーもない (Flow の型を空白にしてから検証する。json-redesign-plan.md 4 章の 7)。
    // enum は TS と同じく型を空白にできない (実行時の値を作る) ので、検証しない旨の TS_UNSUPPORTED だけは出てよい
    deepEqual(
        parsed.resolvedError.filter((e) => e.code !== 'TS_UNSUPPORTED').map((e) => e.code),
        [],
    );
    const { module } = convertLwcModule(parsed);
    assert.ok(module);
    return module;
};

/** 位置と文字列 (sourceKeys・text) と、P1 で足したノードの kind を除いた形 (lwcShape.ts) */
const shape = (value: unknown): unknown => lwcShape(value, new Set(['text']));

/** 位置と、P1 で足したノードの kind を両側から除いて比べる (lwcShape.ts) */
const deepEqual = (actual: unknown, expected: unknown, message?: string) =>
    message === undefined
        ? assert.deepEqual(lwcShape(actual), lwcShape(expected))
        : assert.deepEqual(lwcShape(actual), lwcShape(expected), message);

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
            deepEqual(shape(fieldType(flow, name)), shape(fieldType(ts, name)), name);
        }
        deepEqual(shape(fieldType(flow, 'seen')), {
            kind: 'lwcType',
            type: 'typeof',
            target: ['Color'],
        });

        const method = (module: LwcModuleJson) =>
            componentOf(module).block.find(
                (m) => m.kind === 'lwcMethod' && (m as LwcMethodJson).name === 'handle',
            ) as LwcMethodJson;
        deepEqual(shape(method(flow).returnType), shape(method(ts).returnType));
        deepEqual(
            method(flow).param.map((p) => shape(p.variantType)),
            method(ts).param.map((p) => shape(p.variantType)),
        );

        for (const name of ['Row', 'Handler', 'Shape', 'Color']) {
            deepEqual(shape(typeDeclaration(flow, name)), shape(typeDeclaration(ts, name)), name);
        }
        deepEqual(shape(typeDeclaration(flow, 'Handler').variantType), {
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
        deepEqual(shape(fieldType(flow, 'a')), shape(fieldType(ts, 'a')));
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

        deepEqual(variant('Base'), {
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
        deepEqual(variant('Ext'), {
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
            spreads: [{ type: 'custom', customType: ['Base'] }],
            exactness: 'inexact',
        });
        deepEqual(variant('Keys'), {
            kind: 'lwcType',
            type: 'custom',
            customType: ['$Keys'],
            generic: [{ type: 'custom', customType: ['Base'] }],
        });
        deepEqual(variant('Any'), {
            kind: 'lwcType',
            type: 'primitive',
            primitiveType: '*',
        });
        deepEqual(variant('Fn'), {
            kind: 'lwcType',
            type: 'function',
            params: [
                { name: 'this', paramType: { type: 'custom', customType: ['Base'] } },
                { paramType: { type: 'primitive', primitiveType: 'string' } },
            ],
            returnType: { type: 'primitive', primitiveType: 'void' },
        });
        deepEqual(variant('Method'), {
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
                        customType: ['Promise'],
                        generic: [{ type: 'primitive', primitiveType: 'void' }],
                    },
                    optional: false,
                    method: true,
                },
            ],
        });
        deepEqual(variant('Big'), { kind: 'lwcType', type: 'literal', value: '1n' });

        const id = typeDeclaration(module, 'Id');
        assert.equal(id.declarationType, 'type');
        assert.equal(id.opaque, true);
        deepEqual(shape(id.supertype), {
            kind: 'lwcType',
            type: 'primitive',
            primitiveType: 'string',
        });

        const named = typeDeclaration(module, 'Named');
        assert.equal(named.declarationType, 'interface');
        deepEqual(
            named.extend?.map((t) => shape(t)),
            [{ kind: 'lwcType', type: 'custom', customType: ['Base'] }],
        );
        deepEqual(named.members, [
            {
                name: 'name',
                memberType: { type: 'primitive', primitiveType: 'string' },
                optional: false,
                method: false,
            },
        ]);
    });

    it('Flow の型を空白にしてから LWC Compiler で検証する (検証のエラーが出ない・本当の違反は出る)', () => {
        const source = `// @flow
import { LightningElement, api } from 'lwc';
import type { Row } from 'c/types';
import typeof Lib from 'c/lib';
import { type Other, helper } from 'c/helper';
export type Id = string;
opaque type Secret = string;
export interface Named { name: string }
declare var g: number;
function isText(x: mixed): boolean %checks {
    return typeof x === 'string';
}
export default class Sample extends LightningElement implements Named {
    @api record: ?Row = null;
    +name: string = 'x';
    static count: number = 0;
    declare later: string;
    pick<T>(items: Array<T>, index?: number = 0): T {
        const first = (items[0]: any);
        return first;
    }
    check(x: mixed): boolean {
        return isText(x);
    }
}
`;
        const parsed = parseLwcModule('sample/sample.js', source);
        deepEqual(
            parsed.resolvedError.map((e) => `${e.code}: ${e.errorMessage}`),
            [],
        );
        // Flow の declare のフィールド (TS と混ざったものとして扱わない)
        const later = componentOf(convertLwcModule(parsed).module!).block.find(
            (m) => m.kind === 'lwcField' && (m as LwcFieldJson).name === 'later',
        ) as LwcFieldJson | undefined;
        deepEqual(later?.modifier.declaration, ['declare']);
        assert.ok(later?.variantType);
        // 型を消しても LWC の違反 (@api の名前の禁止など) は出る
        const invalid = parseLwcModule(
            'sample/sample.js',
            `// @flow
import { LightningElement, api } from 'lwc';
export default class Sample extends LightningElement {
    @api slot: string;
}
`,
        );
        // 構文エラー (LWC1007) ではなく、本当の違反 (LWC1110: slot は予約の名前)
        deepEqual(
            invalid.resolvedError.map((e) => e.code),
            ['LWC1110'],
        );
    });

    it('@flow のない .js は型の宣言を持たない (今までどおり)', () => {
        const module = moduleOf('plain/plain.js', 'export const a = 1;\n');
        assert.equal(module.typeDeclarations, undefined);
    });
});

describe('LWC の型: 種類ごとの型 (other をなくした。lwc-json-types.md 8.8 の残り)', () => {
    it('条件型・マップ型・インデックスアクセス型・keyof・テンプレートリテラル型・import()・infer・型述語・コンストラクタの型', () => {
        const module = moduleOf(
            'lwc/c/types.ts',
            [
                "type Cond<T> = T extends string ? 'a' : 'b';",
                'type Mapped<T> = { readonly [K in keyof T]?: T[K] };',
                'type Index = Row["id"];',
                'type Keys = keyof Row;',
                'type Tpl = `id-${number}`;',
                "type Imp = import('./x').Y<string>;",
                'type Inf<T> = T extends Promise<infer U> ? U : never;',
                'type Pred = (x: unknown) => x is string;',
                'type Ctor = new (n: number) => Row;',
                'type Row = { id: string };',
            ].join('\n'),
        );
        const typeOf = (name: string) => shape(typeDeclaration(module, name).variantType) as never;
        deepEqual(typeOf('Cond'), {
            kind: 'lwcType',
            type: 'conditional',
            checkType: { type: 'custom', customType: ['T'] },
            extendsType: { type: 'primitive', primitiveType: 'string' },
            trueType: { type: 'literal', value: "'a'" },
            falseType: { type: 'literal', value: "'b'" },
        });
        deepEqual(typeOf('Mapped'), {
            kind: 'lwcType',
            type: 'mapped',
            key: 'K',
            constraint: {
                type: 'operator',
                operator: 'keyof',
                argument: { type: 'custom', customType: ['T'] },
            },
            valueType: {
                type: 'indexedAccess',
                objectType: { type: 'custom', customType: ['T'] },
                indexType: { type: 'custom', customType: ['K'] },
            },
            readonly: '+',
            optional: '+',
        });
        assert.equal((typeOf('Index') as { type: string }).type, 'indexedAccess');
        deepEqual(typeOf('Tpl'), {
            kind: 'lwcType',
            type: 'templateLiteral',
            quasis: ['id-', ''],
            types: [{ type: 'primitive', primitiveType: 'number' }],
        });
        deepEqual(typeOf('Imp'), {
            kind: 'lwcType',
            type: 'import',
            source: './x',
            qualifier: ['Y'],
            generic: [{ type: 'primitive', primitiveType: 'string' }],
        });
        assert.equal(JSON.stringify(typeOf('Inf')).includes('"type":"infer","name":"U"'), true);
        const pred = typeOf('Pred') as { returnType: unknown };
        deepEqual(pred.returnType, {
            type: 'predicate',
            parameterName: 'x',
            asserts: false,
            predicateType: { type: 'primitive', primitiveType: 'string' },
        });
        assert.equal((typeOf('Ctor') as { construct?: boolean }).construct, true);
        // どれにも当たらない型はない
        assert.ok(!JSON.stringify(module).includes('"type":"unknown"'));
    });
});
