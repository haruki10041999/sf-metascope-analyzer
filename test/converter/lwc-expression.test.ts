import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { convertLwcModule, parseLwcModule } from '../../src/analyzer/parser/Lwc/module';
import { analyzeLwcBodyCalls } from '../../src/analyzer/processor/Lwc/calls';
import { makeLwcModuleDiff } from '../../src/analyzer/processor/Lwc/diff/module';
import {
    makeLwcImportTables,
    type LwcBodyContentJson,
    type LwcComponentJson,
    type LwcFieldJson,
    type LwcJsExpressionJson,
    type LwcMethodJson,
    type LwcModuleJson,
} from '../../src/analyzer/types/lwc';

// JS / TS の式の JSON (docs/lwc-json-types.md 5.4・7 章、段階 2)。
// 式は文字列を持たず、種類ごとの型 (kind: js*) で表す。段階 6 で、隣に置いていたソースの文字列
// (arg・value・detail・init) をなくし、式の JSON を init・value・arg に置いた

/** 最後に読んだモジュール (呼び出しの解析の import の表に使う) */
let lastModule: LwcModuleJson | undefined;

const moduleOf = (source: string, fileName = 'demo/demo.ts'): LwcModuleJson => {
    const parsed = parseLwcModule(fileName, source);
    const { module } = convertLwcModule(parsed);
    assert.ok(module, JSON.stringify(parsed.resolvedError));
    lastModule = module;
    return module;
};

/** 本体の呼び出しとイベント (解析。processor/Lwc/calls.ts) */
const analyze = (content: LwcBodyContentJson) =>
    analyzeLwcBodyCalls(content, makeLwcImportTables(lastModule!.imports));

const componentOf = (source: string, fileName?: string): LwcComponentJson => {
    const { component } = moduleOf(source, fileName);
    assert.ok(component);
    return component;
};

/** sourceKeys を除いた形 (比べやすくするため) */
const shape = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(shape);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(
        Object.entries(value)
            .filter(([key]) => key !== 'sourceKeys')
            .map(([key, child]) => [key, shape(child)]),
    );
};

/** フィールドの初期値の式 (class Demo { x = <式>; }) */
const initOf = (expression: string, header = ''): LwcJsExpressionJson => {
    const component = componentOf(`import { LightningElement } from 'lwc';
${header}
export default class Demo extends LightningElement {
    x = ${expression};
}
`);
    const field = component.block[0] as LwcFieldJson;
    assert.ok(field.init, expression);
    return field.init;
};

/** JSON の中に、ソースの文字列を持つプロパティ (text) がないか (型の lwcType は除く) */
const findText = (value: unknown, path = ''): string[] => {
    if (Array.isArray(value)) return value.flatMap((v, i) => findText(v, `${path}[${i}]`));
    if (!value || typeof value !== 'object') return [];
    if ((value as { kind?: unknown }).kind === 'lwcType') return [];
    return Object.entries(value).flatMap(([key, child]) =>
        key === 'text' ? [`${path}.${key}`] : findText(child, `${path}.${key}`),
    );
};

/**
 * 関数の式 (jsFunction)。フィールドの初期値がそのまま関数なら init を持たない (function だけで表す) ので、
 * 配列の要素にして式として取り出す
 */
const functionOf = (expression: string): Record<string, unknown> => {
    const array = initOf(`[${expression}]`);
    assert.ok(array.kind === 'jsArray', expression);
    return shape(array.elements[0]) as Record<string, unknown>;
};

const id = (name: string) => ({ kind: 'jsIdentifier', name });
const str = (value: string) => ({ kind: 'jsString', value });
const num = (value: number) => ({ kind: 'jsNumber', value });
const self = { kind: 'jsThis' };

describe('LWC の式の JSON (段階 2)', () => {
    it('リテラルは値の種類ごとの kind を持つ', () => {
        assert.deepEqual(shape(initOf("'a'")), str('a'));
        assert.deepEqual(shape(initOf('1.5')), num(1.5));
        assert.deepEqual(shape(initOf('true')), { kind: 'jsBoolean', value: true });
        assert.deepEqual(shape(initOf('null')), { kind: 'jsNull' });
        assert.deepEqual(shape(initOf('10n')), { kind: 'jsBigInt', value: '10' });
        assert.deepEqual(shape(initOf('/a+/gi')), { kind: 'jsRegExp', pattern: 'a+', flags: 'gi' });
        assert.deepEqual(shape(initOf('undefined')), id('undefined'));
        assert.deepEqual(shape(initOf('`c-${name}-x`')), {
            kind: 'jsTemplate',
            quasis: ['c-', '-x'],
            expressions: [id('name')],
        });
        assert.deepEqual(shape(initOf('html`<p>${a}</p>`')), {
            kind: 'jsTaggedTemplate',
            tag: id('html'),
            quasi: { kind: 'jsTemplate', quasis: ['<p>', '</p>'], expressions: [id('a')] },
        });
    });

    it('メンバーの参照・メソッドの呼び出しは jsMemberAccess (オプショナルチェーン・計算されたメンバー)', () => {
        assert.deepEqual(shape(initOf('this.record?.data')), {
            kind: 'jsMemberAccess',
            type: 'object',
            object: {
                kind: 'jsMemberAccess',
                type: 'object',
                object: self,
                operator: '.',
                member: 'record',
            },
            operator: '?.',
            member: 'data',
        });
        assert.deepEqual(shape(initOf('rows?.[0]')), {
            kind: 'jsMemberAccess',
            type: 'object',
            object: id('rows'),
            operator: '?.',
            computed: num(0),
        });
        assert.deepEqual(shape(initOf('this.refs.table?.focus?.(1, ...rest)')), {
            kind: 'jsMemberAccess',
            type: 'method',
            object: {
                kind: 'jsMemberAccess',
                type: 'object',
                object: {
                    kind: 'jsMemberAccess',
                    type: 'object',
                    object: self,
                    operator: '.',
                    member: 'refs',
                },
                operator: '.',
                member: 'table',
            },
            operator: '?.',
            member: 'focus',
            memberArg: [num(1), { kind: 'jsSpread', argument: id('rest') }],
            optionalCall: true,
        });
        // this[NavigationMixin.Navigate](...) の computed は jsMemberAccess
        const navigate = shape(initOf("this[NavigationMixin.Navigate]({ type: 'x' })")) as Record<
            string,
            unknown
        >;
        assert.equal(navigate.kind, 'jsMemberAccess');
        assert.equal(navigate.type, 'method');
        assert.deepEqual(navigate.computed, {
            kind: 'jsMemberAccess',
            type: 'object',
            object: id('NavigationMixin'),
            operator: '.',
            member: 'Navigate',
        });
    });

    it('識別子の呼び出し・new・動的 import・await', () => {
        assert.deepEqual(shape(initOf('save({ id }, ...rest)')), {
            kind: 'jsCall',
            callee: id('save'),
            arg: [
                {
                    kind: 'jsObject',
                    properties: [
                        { kind: 'jsProperty', key: 'id', value: id('id'), shorthand: true },
                    ],
                },
                { kind: 'jsSpread', argument: id('rest') },
            ],
        });
        assert.deepEqual(shape(initOf("new CustomEvent<Detail>('pick', { bubbles: true })")), {
            kind: 'jsNew',
            callee: id('CustomEvent'),
            arg: [
                str('pick'),
                {
                    kind: 'jsObject',
                    properties: [
                        {
                            kind: 'jsProperty',
                            key: 'bubbles',
                            value: { kind: 'jsBoolean', value: true },
                            shorthand: false,
                        },
                    ],
                },
            ],
            typeArguments: [
                { kind: 'lwcType', text: 'Detail', type: 'custom', customType: 'Detail' },
            ],
        });
        assert.deepEqual(shape(initOf("import('c/child')")), {
            kind: 'jsImportCall',
            source: str('c/child'),
        });
        const fn = functionOf('async () => await load()');
        assert.deepEqual(fn.expression, {
            kind: 'jsAwait',
            argument: { kind: 'jsCall', callee: id('load'), arg: [] },
        });
    });

    it('オブジェクト (計算されたキー・メソッド・スプレッド)・配列 (穴・スプレッド)', () => {
        const object = shape(initOf("{ [key]: 1, 'a-b': 2, 3: x, ...rest, run() { return 1; } }"));
        assert.deepEqual(object, {
            kind: 'jsObject',
            properties: [
                { kind: 'jsProperty', computed: id('key'), value: num(1), shorthand: false },
                { kind: 'jsProperty', key: 'a-b', value: num(2), shorthand: false },
                { kind: 'jsProperty', key: '3', value: id('x'), shorthand: false },
                { kind: 'jsSpread', argument: id('rest') },
                {
                    kind: 'jsObjectMethod',
                    key: 'run',
                    methodKind: 'method',
                    async: false,
                    generator: false,
                    param: [],
                    block: [{ kind: 'jsReturn', field: num(1) }],
                },
            ],
        });
        assert.deepEqual(shape(initOf('[a, , ...b]')), {
            kind: 'jsArray',
            elements: [id('a'), null, { kind: 'jsSpread', argument: id('b') }],
        });
    });

    it('関数 (アロー関数・function 式) は引数・本体 (文の並び block か式) を持つ', () => {
        const arrow = functionOf('async (event: Event): Promise<void> => { run(); }');
        assert.equal(arrow.kind, 'jsFunction');
        assert.equal(arrow.arrow, true);
        assert.equal(arrow.async, true);
        assert.deepEqual(
            (arrow.param as { variant: string }[]).map((p) => p.variant),
            ['event'],
        );
        assert.deepEqual((arrow.returnType as { text: string }).text, 'Promise<void>');
        assert.deepEqual(arrow.block, [
            { kind: 'jsExpression', value: { kind: 'jsCall', callee: id('run'), arg: [] } },
        ]);
        const named = functionOf('function* gen(a) { yield* a; }');
        assert.deepEqual([named.arrow, named.generator, named.name], [false, true, 'gen']);
    });

    it('演算子の式 (単項・++・二項・論理・三項・代入・分割代入・カンマ)', () => {
        assert.deepEqual(shape(initOf('!a')), {
            kind: 'jsUnary',
            operator: '!',
            operatorLocation: 'front',
            argument: id('a'),
        });
        assert.deepEqual(shape(initOf('i++')), {
            kind: 'jsUnary',
            operator: '++',
            operatorLocation: 'back',
            argument: id('i'),
        });
        assert.deepEqual(shape(initOf('typeof a === "string"')), {
            kind: 'jsBinary',
            left: {
                kind: 'jsUnary',
                operator: 'typeof',
                operatorLocation: 'front',
                argument: id('a'),
            },
            operator: '===',
            right: str('string'),
        });
        assert.deepEqual(shape(initOf('a ?? b')), {
            kind: 'jsLogical',
            left: id('a'),
            operator: '??',
            right: id('b'),
        });
        assert.deepEqual(shape(initOf('a ? 1 : 2')), {
            kind: 'jsConditional',
            condition: id('a'),
            trueValue: num(1),
            falseValue: num(2),
        });
        assert.deepEqual(shape(initOf('this.count += 1')), {
            kind: 'jsAssignment',
            left: {
                kind: 'jsMemberAccess',
                type: 'object',
                object: self,
                operator: '.',
                member: 'count',
            },
            operator: '+=',
            right: num(1),
        });
        assert.deepEqual(shape(initOf('({ a, b: [c = 1, ...d], ...e } = f)')), {
            kind: 'jsParenthesized',
            expression: {
                kind: 'jsAssignment',
                left: {
                    kind: 'jsObjectPattern',
                    properties: [
                        { kind: 'jsPatternProperty', key: 'a', value: id('a'), shorthand: true },
                        {
                            kind: 'jsPatternProperty',
                            key: 'b',
                            value: {
                                kind: 'jsArrayPattern',
                                elements: [
                                    { kind: 'jsAssignmentPattern', left: id('c'), right: num(1) },
                                    { kind: 'jsRest', argument: id('d') },
                                ],
                            },
                            shorthand: false,
                        },
                    ],
                    rest: { kind: 'jsRest', argument: id('e') },
                },
                operator: '=',
                right: id('f'),
            },
        });
        assert.deepEqual(shape(initOf('(a, b)')), {
            kind: 'jsParenthesized',
            expression: { kind: 'jsSequence', expressions: [id('a'), id('b')] },
        });
    });

    it('型を含む式 (as・satisfies・<T>x・x!・f<T>) は型を lwcType で持つ', () => {
        const cast = shape(initOf('value as string')) as Record<string, unknown>;
        assert.equal(cast.kind, 'jsTypeCast');
        assert.equal(cast.operator, 'as');
        assert.deepEqual(cast.expression, id('value'));
        assert.equal((cast.convertType as { kind: string }).kind, 'lwcType');
        assert.equal(
            (shape(initOf('value satisfies T')) as { operator: string }).operator,
            'satisfies',
        );
        assert.equal((shape(initOf('<T>value')) as { operator: string }).operator, '<>');
        assert.deepEqual(shape(initOf('value!')), { kind: 'jsNonNull', expression: id('value') });
        const instantiation = shape(initOf('make<Row>')) as Record<string, unknown>;
        assert.equal(instantiation.kind, 'jsInstantiation');
        assert.equal((instantiation.typeArguments as unknown[]).length, 1);
        // Flow の (x: T) (.js に @flow があるとき)
        const flow = componentOf(
            `// @flow
import { LightningElement } from 'lwc';
export default class Demo extends LightningElement {
    x = (value: string);
}
`,
            'demo/demo.js',
        );
        // Flow の型キャストは括弧が必須なので、括弧 (jsParenthesized) の中にある
        const flowCast = shape((flow.block[0] as LwcFieldJson).init) as {
            kind: string;
            expression: Record<string, unknown>;
        };
        assert.equal(flowCast.kind, 'jsParenthesized');
        assert.equal(flowCast.expression.kind, 'jsTypeCast');
        assert.equal(flowCast.expression.operator, ':');
        assert.deepEqual(flowCast.expression.expression, id('value'));
    });

    it('そのほかの式 (クラス式・new.target・super)', () => {
        assert.deepEqual(shape(initOf('class A extends B {}')), {
            kind: 'jsClass',
            name: 'A',
            superClass: id('B'),
            block: [],
        });
        const component = componentOf(`import { LightningElement } from 'lwc';
export default class Demo extends LightningElement {
    constructor() { super(); new.target; }
    run() { return super.run(1); }
}
`);
        const run = component.block[1] as LwcMethodJson;
        assert.equal(analyze(run).calls.length, 0);
        // 式の JSON はデコレーターの引数・wire の設定・フィールドの初期値に置く
        assert.deepEqual(shape(initOf('super.x')), {
            kind: 'jsMemberAccess',
            type: 'object',
            object: { kind: 'jsSuper' },
            operator: '.',
            member: 'x',
        });
    });

    it('wire の設定の値・デコレーターの引数は式で持ち、呼び出しの引数・イベントの detail は解析が式を指す', () => {
        const component = componentOf(`import { LightningElement, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import save from '@salesforce/apex/Ctrl.save';
import NAME_FIELD from '@salesforce/schema/Account.Name';
export default class Demo extends LightningElement {
    @wire(getRecord, { recordId: '$recordId', fields: [NAME_FIELD] }) record;
    async run() {
        await save({ id: this.recordId });
        this.dispatchEvent(new CustomEvent('saved', { detail: { id: this.recordId } }));
    }
}
`);
        const record = component.block[0] as LwcFieldJson;
        const config = record.modifier.decorator?.[0]?.wire?.config ?? [];
        assert.deepEqual(
            config.map((c) => shape(c.value)),
            [str('$recordId'), { kind: 'jsArray', elements: [id('NAME_FIELD')] }],
        );
        const decorator = record.modifier.decorator?.[0];
        assert.deepEqual(shape(decorator?.wire?.adapter), id('getRecord'));
        assert.deepEqual(
            decorator?.arg.map((a) => a.kind),
            ['jsIdentifier', 'jsObject'],
        );
        const run = component.block[1] as LwcMethodJson;
        const { calls, events } = analyze(run);
        const [apex] = calls;
        assert.deepEqual(shape(apex?.args), [
            {
                kind: 'jsObject',
                properties: [
                    {
                        kind: 'jsProperty',
                        key: 'id',
                        value: {
                            kind: 'jsMemberAccess',
                            type: 'object',
                            object: self,
                            operator: '.',
                            member: 'recordId',
                        },
                        shorthand: false,
                    },
                ],
            },
        ]);
        const [event] = events;
        assert.deepEqual(shape(event?.detail), shape(apex?.args[0]));
        // 解析の結果は本体の文の JSON のノードそのものを指す
        assert.ok(JSON.stringify(run.block).includes(JSON.stringify(event?.detail)));
        // 式の JSON はソースの文字列 (text) を持たない (型の lwcType の text は type.ts の担当)
        assert.deepEqual(findText(calls.map((c) => c.args)), []);
        assert.deepEqual(findText(component), []);
        // 式のノードの位置は sourceObject にある (kind と sourceKeys を持つ)
        assert.ok(apex?.args[0]?.sourceKeys.objectKey.startsWith('objectExpression_'));
    });

    it('式は値として比べ、中身が同じなら位置が変わっても unchanged', () => {
        const source = (detail: string, pad = '') => `import { LightningElement, wire } from 'lwc';
export default class Demo extends LightningElement {
${pad}    x = { detail: ${detail} };
    @wire(getData, { id: ${detail} }) data;
}
`;
        const fieldsOf = (diff: unknown) =>
            (diff as { fields: Record<string, any> }).fields.component.fields.block[0];
        const same = makeLwcModuleDiff(
            moduleOf(source('this.id')),
            moduleOf(source('this.id', '\n')),
        );
        assert.equal(same.status, 'unchanged');
        const changed = fieldsOf(
            makeLwcModuleDiff(moduleOf(source('this.id')), moduleOf(source('this?.id'))),
        );
        assert.equal(changed.fields.init.status, 'changed');
        assert.equal(changed.fields.init.after.properties[0].value.operator, '?.');
        // デコレーターの引数は C. 順序付き列。式が変わった引数は changed
        const data = (
            makeLwcModuleDiff(moduleOf(source('this.id')), moduleOf(source('this?.id'))) as {
                fields: Record<string, any>;
            }
        ).fields.component.fields.block[1];
        const decorator = data.fields.modifier.fields.decorator[0].fields;
        assert.deepEqual(
            decorator.arg.map((arg: { status: string }) => arg.status),
            ['unchanged', 'changed'],
        );
        assert.equal(decorator.wire.fields.config[0].fields.value.status, 'changed');
    });
});
