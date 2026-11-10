import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { convertLwcModule, parseLwcModule } from '../../src/analyzer/parser/Lwc/module';
import { analyzeLwcModuleCalls } from '../../src/analyzer/processor/Lwc/calls';
import type {
    LwcComponentJson,
    LwcFieldJson,
    LwcJsStatementJson,
    LwcMethodJson,
    LwcModuleJson,
    LwcStaticBlockJson,
} from '../../src/analyzer/types/lwc';

// JS / TS の文の JSON (docs/lwc-json-types.md 5.3・7 章、段階 4)。
// 本体は lwcBody (文の数) ではなく block: LwcJsStatementJson[]。文はすべて kind (js*) と sourceKeys を持ち、
// ソースの文字列を持たない

const moduleOf = (source: string, fileName = 'demo/demo.ts'): LwcModuleJson => {
    const parsed = parseLwcModule(fileName, source);
    const { module } = convertLwcModule(parsed);
    assert.ok(module, JSON.stringify(parsed.resolvedError));
    return module;
};

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

/** メソッド run() { <本体> } の本体の文 */
const bodyOf = (body: string, header = ''): LwcJsStatementJson[] => {
    const component = componentOf(`import { LightningElement } from 'lwc';
${header}
export default class Demo extends LightningElement {
    run() {
${body}
    }
}
`);
    const method = component.block[0] as LwcMethodJson;
    assert.equal(method.kind, 'lwcMethod');
    assert.ok(method.block, body);
    return method.block;
};

/** 本体の文 1 つ (sourceKeys を除いた形) */
const statementOf = (body: string, header?: string): Record<string, unknown> => {
    const block = bodyOf(body, header);
    assert.equal(block.length, 1, body);
    return shape(block[0]) as Record<string, unknown>;
};

/** JSON の中の、kind を持つノードがすべて sourceKeys を持つか・text (ソースの文字列) を持たないか (型の lwcType は除く) */
const checkNodes = (value: unknown, path = ''): string[] => {
    if (Array.isArray(value)) return value.flatMap((v, i) => checkNodes(v, `${path}[${i}]`));
    if (!value || typeof value !== 'object') return [];
    const record = value as Record<string, unknown>;
    if (record.kind === 'lwcType') return [];
    const own = [
        ...(typeof record.kind === 'string' && !record.sourceKeys ? [`${path}: sourceKeys`] : []),
        ...('text' in record ? [`${path}.text`] : []),
    ];
    return [
        ...own,
        ...Object.entries(record).flatMap(([key, child]) =>
            key === 'sourceKeys' ? [] : checkNodes(child, `${path}.${key}`),
        ),
    ];
};

const id = (name: string) => ({ kind: 'jsIdentifier', name });
const num = (value: number) => ({ kind: 'jsNumber', value });
const self = { kind: 'jsThis' };
const call = (name: string, ...arg: unknown[]) => ({ kind: 'jsCall', callee: id(name), arg });
const exprStatement = (value: unknown) => ({ kind: 'jsExpression', value });

describe('LWC の文の JSON (段階 4)', () => {
    it('式の文・return・throw は値を持つ (Apex の expression・return・throw と同じ名前)', () => {
        assert.deepEqual(shape(bodyOf('run(); return 1; throw error;')), [
            exprStatement(call('run')),
            { kind: 'jsReturn', field: num(1) },
            { kind: 'jsThrow', value: id('error') },
        ]);
        assert.deepEqual(statementOf('return;'), { kind: 'jsReturn' });
    });

    it('変数の宣言は宣言子ごとの jsVariant (分割代入のパターン・型・初期値)', () => {
        assert.deepEqual(
            statementOf('const { recordId, ...rest } = event.detail, n: number = 1;'),
            {
                kind: 'jsLocalVariable',
                variableKind: 'const',
                variants: [
                    {
                        kind: 'jsVariant',
                        target: {
                            kind: 'jsObjectPattern',
                            properties: [
                                {
                                    kind: 'jsPatternProperty',
                                    key: 'recordId',
                                    value: id('recordId'),
                                    shorthand: true,
                                },
                            ],
                            rest: { kind: 'jsRest', argument: id('rest') },
                        },
                        init: {
                            kind: 'jsMemberAccess',
                            type: 'object',
                            object: id('event'),
                            operator: '.',
                            member: 'detail',
                        },
                    },
                    {
                        kind: 'jsVariant',
                        target: id('n'),
                        variantType: {
                            kind: 'lwcType',
                            text: 'number',
                            type: 'primitive',
                            primitiveType: 'number',
                        },
                        init: num(1),
                    },
                ],
            },
        );
        const letDefinite = statementOf('let a!: string, b;');
        assert.equal(letDefinite.variableKind, 'let');
        assert.deepEqual(
            (letDefinite.variants as Record<string, unknown>[]).map((v) => [
                v.definite,
                'init' in v,
            ]),
            [
                [true, false],
                [undefined, false],
            ],
        );
    });

    it('if / else if / else は 1 つの conditionBlock の列 ({ } のない本体も文の配列)', () => {
        assert.deepEqual(statementOf('if (a) { run(); } else if (b) stop(); else { }'), {
            kind: 'jsIf',
            conditionBlock: [
                { condition: id('a'), block: [exprStatement(call('run'))] },
                { condition: id('b'), block: [exprStatement(call('stop'))] },
                { condition: 'else', block: [] },
            ],
        });
        // else { if } は else の中の if (else if と区別する)
        const nested = statementOf('if (a) {} else { if (b) {} }');
        const blocks = nested.conditionBlock as { condition: unknown; block: { kind: string }[] }[];
        assert.deepEqual(
            blocks.map((b) => [b.condition === 'else' ? 'else' : 'if', b.block.map((s) => s.kind)]),
            [
                ['if', []],
                ['else', ['jsIf']],
            ],
        );
    });

    it('for・for in・for of・for await・while・do while', () => {
        assert.deepEqual(statementOf('for (let i = 0; i < n; i++) continue;'), {
            kind: 'jsFor',
            condition: {
                initializer: {
                    kind: 'jsLocalVariable',
                    variableKind: 'let',
                    variants: [{ kind: 'jsVariant', target: id('i'), init: num(0) }],
                },
                condition: { kind: 'jsBinary', left: id('i'), operator: '<', right: id('n') },
                update: {
                    kind: 'jsUnary',
                    operator: '++',
                    operatorLocation: 'back',
                    argument: id('i'),
                },
            },
            block: [{ kind: 'jsContinue' }],
        });
        assert.deepEqual(statementOf('for (;;) {}'), { kind: 'jsFor', condition: {}, block: [] });
        assert.deepEqual(statementOf('for (const key in this.map) {}'), {
            kind: 'jsForIn',
            variableKind: 'const',
            left: id('key'),
            right: {
                kind: 'jsMemberAccess',
                type: 'object',
                object: self,
                operator: '.',
                member: 'map',
            },
            block: [],
        });
        assert.deepEqual(statementOf('for (x of rows) {}'), {
            kind: 'jsForOf',
            left: id('x'),
            right: id('rows'),
            await: false,
            block: [],
        });
        const forAwait = bodyOf(
            'async function f() { for await (const [k, v] of entries) {} }',
        )[0] as {
            block: Record<string, unknown>[];
        };
        assert.deepEqual(shape(forAwait.block[0]), {
            kind: 'jsForOf',
            variableKind: 'const',
            left: { kind: 'jsArrayPattern', elements: [id('k'), id('v')] },
            right: id('entries'),
            await: true,
            block: [],
        });
        assert.deepEqual(statementOf('while (a) a--;'), {
            kind: 'jsWhile',
            condition: id('a'),
            block: [
                exprStatement({
                    kind: 'jsUnary',
                    operator: '--',
                    operatorLocation: 'back',
                    argument: id('a'),
                }),
            ],
        });
        assert.deepEqual(statementOf('do { run(); } while (a);'), {
            kind: 'jsDoWhile',
            condition: id('a'),
            block: [exprStatement(call('run'))],
        });
    });

    it('switch は case の並び (test のないものは default)・break / continue のラベル・ラベル付きの文', () => {
        assert.deepEqual(
            statementOf("switch (mode) { case 'a': case 'b': run(); break; default: stop(); }"),
            {
                kind: 'jsSwitch',
                discriminant: id('mode'),
                cases: [
                    { test: { kind: 'jsString', value: 'a' }, block: [] },
                    {
                        test: { kind: 'jsString', value: 'b' },
                        block: [exprStatement(call('run')), { kind: 'jsBreak' }],
                    },
                    { block: [exprStatement(call('stop'))] },
                ],
            },
        );
        assert.deepEqual(statementOf('outer: for (;;) { break outer; }'), {
            kind: 'jsLabeled',
            label: 'outer',
            body: { kind: 'jsFor', condition: {}, block: [{ kind: 'jsBreak', label: 'outer' }] },
        });
    });

    it('try / catch / finally は節の並び (catch の引数・型・省略)', () => {
        assert.deepEqual(
            statementOf(
                'try { run(); } catch (error: unknown) { log(error); } finally { done(); }',
            ),
            {
                kind: 'jsTry',
                block: [
                    { condition: 'try', block: [exprStatement(call('run'))] },
                    {
                        condition: 'catch',
                        param: id('error'),
                        variantType: {
                            kind: 'lwcType',
                            text: 'unknown',
                            type: 'primitive',
                            primitiveType: 'unknown',
                        },
                        block: [exprStatement(call('log', id('error')))],
                    },
                    { condition: 'finally', block: [exprStatement(call('done'))] },
                ],
            },
        );
        assert.deepEqual(statementOf('try {} catch {}'), {
            kind: 'jsTry',
            block: [
                { condition: 'try', block: [] },
                { condition: 'catch', block: [] },
            ],
        });
        assert.deepEqual(
            (statementOf('try {} finally {}').block as { condition: string }[]).map(
                (b) => b.condition,
            ),
            ['try', 'finally'],
        );
    });

    it('入れ子のブロック・空の文・debugger・ディレクティブ', () => {
        assert.deepEqual(shape(bodyOf("'use strict'; { run(); } ; debugger;")), [
            { kind: 'jsDirective', value: 'use strict' },
            { kind: 'jsBlock', block: [exprStatement(call('run'))] },
            { kind: 'jsEmpty' },
            { kind: 'jsDebugger' },
        ]);
    });

    it('入れ子の function・class の宣言と、本体の中の型の宣言', () => {
        const [fn, cls, type] = bodyOf(
            'function helper(a: number): number { return a; } class Box extends Base { size = 1; get value() { return this.size; } } type T = string;',
        ).map((s) => shape(s) as Record<string, unknown>);
        assert.deepEqual(fn, {
            kind: 'jsFunctionDeclaration',
            name: 'helper',
            async: false,
            generator: false,
            param: [
                {
                    kind: 'lwcParameter',
                    variant: 'a',
                    variantType: {
                        kind: 'lwcType',
                        text: 'number',
                        type: 'primitive',
                        primitiveType: 'number',
                    },
                    optional: false,
                    modifier: {},
                },
            ],
            returnType: {
                kind: 'lwcType',
                text: 'number',
                type: 'primitive',
                primitiveType: 'number',
            },
            block: [{ kind: 'jsReturn', field: id('a') }],
        });
        assert.equal(cls?.kind, 'jsClassDeclaration');
        assert.equal(cls?.name, 'Box');
        assert.deepEqual(cls?.superClass, id('Base'));
        assert.deepEqual(
            (cls?.block as { kind: string; name: string }[]).map((m) => `${m.kind}:${m.name}`),
            ['lwcField:size', 'lwcProperty:value'],
        );
        assert.equal(type?.kind, 'lwcTypeDeclaration');
        assert.equal(type?.exported, false);
    });

    it('関数の式の本体も文の並び (アロー関数のブロック・function 式・オブジェクトのメソッド)', () => {
        const [statement] = bodyOf(
            'rows.then((r) => { use(r); }).catch(function onError() { return 1; });',
        );
        const json = JSON.stringify(shape(statement));
        assert.ok(!json.includes('lwcBody'), json);
        const outer = shape(statement) as { value: { memberArg: { block: unknown }[] } };
        assert.deepEqual(outer.value.memberArg[0]!.block, [{ kind: 'jsReturn', field: num(1) }]);
    });

    it('本体の文はすべて kind と sourceKeys を持ち、ソースの文字列 (text) を持たない', () => {
        const block = bodyOf(`const { a } = this.detail;
if (a) { for (const x of a) { try { this.save(x); } catch (e) { throw e; } } }
switch (a) { case 1: break; default: }
label: while (true) { continue label; }
`);
        assert.deepEqual(checkNodes(block), []);
    });

    it('static ブロックは lwcStaticBlock (本体の文。呼び出しは解析で出す)', () => {
        const module = moduleOf(`import { LightningElement } from 'lwc';
import save from '@salesforce/apex/Ctrl.save';
export default class Demo extends LightningElement {
    static { save(); }
}
`);
        const block = module.component!.block[0] as LwcStaticBlockJson;
        assert.equal(block.kind, 'lwcStaticBlock');
        assert.deepEqual(shape(block.block), [exprStatement(call('save'))]);
        assert.deepEqual(
            analyzeLwcModuleCalls(module).map((c) => [
                c.member,
                c.calls.map((x) => `${x.callType}:${x.target}`),
            ]),
            [['static', ['apex:save']]],
        );
    });

    it('関数を初期値にしたフィールドは function だけで表す (init に同じ関数を重ねない)', () => {
        const component = componentOf(`import { LightningElement } from 'lwc';
export default class Demo extends LightningElement {
    handleClick = async (event) => { this.run(event); };
    format = (x) => x.id;
    wrapped = ((x) => x) as Handler;
    value = 1;
}
`);
        const [handleClick, format, wrapped, value] = component.block as LwcFieldJson[];
        assert.equal(handleClick?.init, undefined);
        assert.deepEqual(
            [
                handleClick?.function?.arrow,
                handleClick?.function?.async,
                handleClick?.function?.block?.length,
            ],
            [true, true, 1],
        );
        // 式の本体のアロー関数は expression
        assert.equal(format?.function?.block, undefined);
        assert.deepEqual(shape(format?.function?.expression), {
            kind: 'jsMemberAccess',
            type: 'object',
            object: id('x'),
            operator: '.',
            member: 'id',
        });
        // 包んだ関数 (as など) は、包んだ形を残すため init も持つ
        assert.equal(wrapped?.init?.kind, 'jsTypeCast');
        assert.ok(wrapped?.function);
        assert.deepEqual(shape(value?.init), num(1));
    });
});
