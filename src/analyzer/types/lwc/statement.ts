// JS / TS の文の JSON (docs/lwc-json-types.md 5.3・7 章、段階 4)。
// Apex の types/apex/statement.ts に合わせる:
// - 文はすべて境界ノード (kind と sourceKeys を持つ)。kind は js で始める (7 章の 1)
// - 文はソースの文字列を持たず、すべて構造で表す (7 章の 2)。式は expression.ts の LwcJsExpressionJson
// - Apex と同じ考え方の文は、プロパティ名も Apex に合わせる (if の conditionBlock、try の block、return の field、throw の value)
// - 制御構造の本体 (if・for・while などの中) は文の配列 (block)。{ } のブロックはその中の文、{ } のない 1 文は要素 1 つの配列にする
//   (Apex の GumTree の block と同じ考え方)。文の並びの中に書いた { } だけは jsBlock にする
// - 入れ子の関数の宣言・クラスの宣言は jsFunctionDeclaration・jsClassDeclaration (式の jsFunction・jsClass と kind を分ける)
// - TS・Flow の型の宣言 (本体の中の type / interface / enum) は lwcTypeDeclaration (exported: false)
// - 本体に書けても LWC で使わない宣言 (TS の namespace・declare・Flow の declare など) は jsUnsupportedStatement (種類だけ)
// 入力は IR v2 (lwc_IR) のノード。v2 の木にはエラーのノードがないので、JSON にもエラーのノードはない
import { makeJsonType, type JsonType } from '../commons/json';
import type { commons as ir, standardizedVisitor } from '../lwc_IR';

import { nameOf, type LwcJsonContext, type LwcNode } from './commons';
import {
    makeLwcClassMembersJson,
    makeLwcParameterJson,
    type LwcImportTables,
    type LwcMemberJson,
    type LwcParameterJson,
    type LwcParameterNode,
} from './component';
import {
    makeLwcExpressionJson,
    makeLwcPatternJson,
    type LwcJsExpressionJson,
    type LwcJsPatternJson,
} from './expression';
import { makeLwcTypeJson, type LwcTypeJson } from './type';
import {
    makeLwcTypeDeclarationJson,
    TYPE_DECLARATION_NODES,
    type LwcTypeDeclarationJson,
    type LwcTypeDeclarationType,
} from './typeDeclaration';

// ---------------------------------------------------------------------------
// JSON の型
// ---------------------------------------------------------------------------

/** 式の文 (Apex の expression) */
export type LwcJsExpressionStatementJson = JsonType<'jsExpression'> & {
    value: LwcJsExpressionJson;
};

/** 変数の宣言子 1 つ (Apex の VariantJson に当たる。名前の代わりにパターン) */
export type LwcJsVariantJson = JsonType<'jsVariant'> & {
    /** 宣言する名前 (jsIdentifier) か分割代入のパターン */
    target: LwcJsPatternJson;
    /** const x: T の T */
    variantType?: LwcTypeJson;
    /** let x!: T */
    definite?: true;
    init?: LwcJsExpressionJson;
};

/** 変数の宣言 (const / let / var / using。Apex の localVariable に当たる) */
export type LwcJsLocalVariableJson = JsonType<'jsLocalVariable'> & {
    variableKind: 'var' | 'let' | 'const' | 'using' | 'await using';
    /** TS の declare const x: T */
    declare?: true;
    variants: LwcJsVariantJson[];
};

/** if / else if / else。else if は 1 つの列にする (Apex の if と同じ形) */
export type LwcJsIfStatementJson = JsonType<'jsIf'> & {
    conditionBlock: {
        condition: 'else' | LwcJsExpressionJson;
        block: LwcJsStatementJson[];
    }[];
};

/** for (初期化; 条件; 更新) */
export type LwcJsForStatementJson = JsonType<'jsFor'> & {
    condition: {
        /** let i = 0 は jsLocalVariable、i = 0 は式 */
        initializer?: LwcJsLocalVariableJson | LwcJsExpressionJson;
        condition?: LwcJsExpressionJson;
        update?: LwcJsExpressionJson;
    };
    block: LwcJsStatementJson[];
};

/** for (x in y) / for (x of y) / for await (x of y) の共通の形 */
type LwcJsForXJson = {
    /** for (const x of y) の const。左辺が宣言でなければ (for (x of y)) 持たない */
    variableKind?: 'var' | 'let' | 'const' | 'using' | 'await using';
    left: LwcJsPatternJson;
    right: LwcJsExpressionJson;
    block: LwcJsStatementJson[];
};

export type LwcJsForInStatementJson = JsonType<'jsForIn'> & LwcJsForXJson;

export type LwcJsForOfStatementJson = JsonType<'jsForOf'> &
    LwcJsForXJson & {
        /** for await */
        await: boolean;
    };

export type LwcJsWhileStatementJson = JsonType<'jsWhile'> & {
    condition: LwcJsExpressionJson;
    block: LwcJsStatementJson[];
};

export type LwcJsDoWhileStatementJson = JsonType<'jsDoWhile'> & {
    condition: LwcJsExpressionJson;
    block: LwcJsStatementJson[];
};

/** switch。case の文は次の case に続く (fall-through) ので、Apex の when とは形が違う */
export type LwcJsSwitchStatementJson = JsonType<'jsSwitch'> & {
    discriminant: LwcJsExpressionJson;
    /** test がないものは default */
    cases: { test?: LwcJsExpressionJson; block: LwcJsStatementJson[] }[];
};

/** try / catch / finally (Apex の try と同じく節の並び。JS の catch は 1 つで、引数は省略できる) */
export type LwcJsTryStatementJson = JsonType<'jsTry'> & {
    block: (
        | { condition: 'try'; block: LwcJsStatementJson[] }
        | {
              condition: 'catch';
              /** catch (error) の error (分割代入も書ける)。catch { } では持たない */
              param?: LwcJsPatternJson;
              /** catch (error: unknown) の unknown */
              variantType?: LwcTypeJson;
              block: LwcJsStatementJson[];
          }
        | { condition: 'finally'; block: LwcJsStatementJson[] }
    )[];
};

export type LwcJsThrowStatementJson = JsonType<'jsThrow'> & { value: LwcJsExpressionJson };

/** return (Apex の return と同じく値は field) */
export type LwcJsReturnStatementJson = JsonType<'jsReturn'> & { field?: LwcJsExpressionJson };

export type LwcJsBreakStatementJson = JsonType<'jsBreak'> & { label?: string };

export type LwcJsContinueStatementJson = JsonType<'jsContinue'> & { label?: string };

/** label: 文 */
export type LwcJsLabeledStatementJson = JsonType<'jsLabeled'> & {
    label: string;
    body: LwcJsStatementJson;
};

/** 文の並びの中に書いた { } */
export type LwcJsBlockStatementJson = JsonType<'jsBlock'> & { block: LwcJsStatementJson[] };

/** ; だけの文 */
export type LwcJsEmptyStatementJson = JsonType<'jsEmpty'>;

export type LwcJsDebuggerStatementJson = JsonType<'jsDebugger'>;

/** with (object) 文 (モジュールでは書けないが、構文解析は木を作る) */
export type LwcJsWithStatementJson = JsonType<'jsWith'> & {
    object: LwcJsExpressionJson;
    block: LwcJsStatementJson[];
};

/** 'use strict' などのディレクティブ (本体の先頭) */
export type LwcJsDirectiveJson = JsonType<'jsDirective'> & { value: string };

/** 本体の中の function 宣言 */
export type LwcJsFunctionDeclarationJson = JsonType<'jsFunctionDeclaration'> & {
    name: string;
    async: boolean;
    generator: boolean;
    param: LwcParameterJson[];
    returnType?: LwcTypeJson;
    block: LwcJsStatementJson[];
};

/** 本体の中の class 宣言。メンバーはコンポーネントと同じ形 (段階 5) */
export type LwcJsClassDeclarationJson = JsonType<'jsClassDeclaration'> & {
    name: string;
    superClass?: LwcJsExpressionJson;
    implement?: LwcTypeJson[];
    block: LwcMemberJson[];
};

/** 本体に書けても LWC で使わない宣言 (TS の namespace・declare function・Flow の declare など)。種類 (IR の kind) だけを持つ */
export type LwcJsUnsupportedStatementJson = JsonType<'jsUnsupportedStatement'> & {
    nodeType: string;
};

export type LwcJsStatementJson =
    | LwcJsExpressionStatementJson
    | LwcJsLocalVariableJson
    | LwcJsIfStatementJson
    | LwcJsForStatementJson
    | LwcJsForInStatementJson
    | LwcJsForOfStatementJson
    | LwcJsWhileStatementJson
    | LwcJsDoWhileStatementJson
    | LwcJsSwitchStatementJson
    | LwcJsTryStatementJson
    | LwcJsThrowStatementJson
    | LwcJsReturnStatementJson
    | LwcJsBreakStatementJson
    | LwcJsContinueStatementJson
    | LwcJsLabeledStatementJson
    | LwcJsBlockStatementJson
    | LwcJsEmptyStatementJson
    | LwcJsDebuggerStatementJson
    | LwcJsWithStatementJson
    | LwcJsDirectiveJson
    | LwcJsFunctionDeclarationJson
    | LwcJsClassDeclarationJson
    | LwcTypeDeclarationJson
    | LwcJsUnsupportedStatementJson;

// ---------------------------------------------------------------------------
// 部品
// ---------------------------------------------------------------------------

type StatementContext = { tables: LwcImportTables; context: LwcJsonContext };

const expressionOf = (node: LwcNode, { tables, context }: StatementContext) =>
    makeLwcExpressionJson(node, tables, context);

const patternOf = (node: LwcNode, { tables, context }: StatementContext) =>
    makeLwcPatternJson(node, tables, context);

/** パターン (識別子・分割代入) が持つ型注釈 (const x: T・catch (e: unknown)) */
const annotationOf = (node: LwcNode, context: LwcJsonContext): { variantType?: LwcTypeJson } => {
    const annotation = (node.getFields() as { typeAnnotation?: LwcNode | null }).typeAnnotation;
    return annotation ? { variantType: makeLwcTypeJson(annotation, context) } : {};
};

/** ラベル (break label など) */
const labelOf = (label: LwcNode | null | undefined): { label?: string } =>
    label ? { label: (label as ir.IdentifierTypeClass).getFields().name } : {};

/** 制御構造の本体。{ } のブロックはその中の文、{ } のない 1 文は要素 1 つの配列 */
const bodyOf = (node: LwcNode, scope: StatementContext): LwcJsStatementJson[] =>
    node.kind === 'blockStatement'
        ? makeBlock(node as ir.BlockStatementTypeClass, scope)
        : [makeStatement(node, scope)];

/** ブロック ({ }) の中の文 (先頭のディレクティブを含む) */
const makeBlock = (
    node: ir.BlockStatementTypeClass,
    scope: StatementContext,
): LwcJsStatementJson[] => {
    const { directives, body } = node.getFields();
    return [
        ...directives.map((directive) =>
            makeJsonType<'jsDirective', LwcJsDirectiveJson>(
                'jsDirective',
                scope.context.keysOf(directive),
                { value: directive.getFields().value.getFields().value },
            ),
        ),
        ...(body as LwcNode[]).map((statement) => makeStatement(statement, scope)),
    ];
};

/** 変数の宣言 (variableDeclaration) */
const makeLocalVariable = (
    node: ir.VariableDeclarationTypeClass,
    scope: StatementContext,
): LwcJsLocalVariableJson => {
    const { context } = scope;
    const { kind, declare, declarations } = node.getFields();
    return makeJsonType<'jsLocalVariable', LwcJsLocalVariableJson>(
        'jsLocalVariable',
        context.keysOf(node),
        {
            variableKind: kind,
            ...(declare ? { declare: true as const } : {}),
            variants: (declarations as standardizedVisitor.VariableDeclaratorTypeClass[]).map(
                (declarator) => {
                    const { id, init, definite } = declarator.getFields();
                    return makeJsonType<'jsVariant', LwcJsVariantJson>(
                        'jsVariant',
                        context.keysOf(declarator),
                        {
                            target: patternOf(id, scope),
                            ...annotationOf(id, context),
                            ...(definite ? { definite: true as const } : {}),
                            ...(init ? { init: expressionOf(init, scope) } : {}),
                        },
                    );
                },
            ),
        },
    );
};

/** if / else if / else を 1 つの列にする */
const makeIf = (node: ir.IfStatementTypeClass, scope: StatementContext): LwcJsIfStatementJson => {
    const conditionBlock: LwcJsIfStatementJson['conditionBlock'] = [];
    let current: ir.IfStatementTypeClass | null = node;
    while (current) {
        const { test, consequent, alternate } = current.getFields();
        conditionBlock.push({
            condition: expressionOf(test, scope),
            block: bodyOf(consequent, scope),
        });
        current = null;
        if (alternate?.kind === 'ifStatement') {
            current = alternate as ir.IfStatementTypeClass;
        } else if (alternate) {
            conditionBlock.push({ condition: 'else', block: bodyOf(alternate, scope) });
        }
    }
    return makeJsonType<'jsIf', LwcJsIfStatementJson>('jsIf', scope.context.keysOf(node), {
        conditionBlock,
    });
};

/** for-in・for-of の左辺 (宣言なら const などと宣言子のパターン、宣言でなければパターン) */
const makeForXLeft = (
    left: LwcNode,
    scope: StatementContext,
): Pick<LwcJsForXJson, 'variableKind' | 'left'> => {
    if (left.kind === 'forHeadDeclaration') {
        const { kind, declarator } = (left as ir.ForHeadDeclarationTypeClass).getFields();
        return {
            variableKind: kind,
            left: patternOf((declarator.getFields() as unknown as { id: LwcNode }).id, scope),
        };
    }
    return { left: patternOf(left, scope) };
};

const makeTry = (
    node: ir.TryStatementTypeClass,
    scope: StatementContext,
): LwcJsTryStatementJson => {
    const { block, handler, finalizer } = node.getFields();
    const blocks: LwcJsTryStatementJson['block'] = [
        { condition: 'try', block: makeBlock(block, scope) },
    ];
    if (handler) {
        const { param, body } = handler.getFields();
        blocks.push({
            condition: 'catch',
            ...(param
                ? { param: patternOf(param, scope), ...annotationOf(param, scope.context) }
                : {}),
            block: makeBlock(body, scope),
        });
    }
    if (finalizer) {
        blocks.push({ condition: 'finally', block: makeBlock(finalizer, scope) });
    }
    return makeJsonType<'jsTry', LwcJsTryStatementJson>('jsTry', scope.context.keysOf(node), {
        block: blocks,
    });
};

/** 本体の中の function 宣言 */
const makeFunctionDeclaration = (
    node: ir.FunctionDeclarationTypeClass,
    scope: StatementContext,
): LwcJsFunctionDeclarationJson => {
    const { tables, context } = scope;
    const fields = node.getFields();
    return makeJsonType<'jsFunctionDeclaration', LwcJsFunctionDeclarationJson>(
        'jsFunctionDeclaration',
        context.keysOf(node),
        {
            name: fields.id.getFields().name,
            async: fields.async === true,
            generator: fields.generator === true,
            param: (fields.params as LwcParameterNode[]).map((param) =>
                makeLwcParameterJson(param, tables, context),
            ),
            ...(fields.returnType
                ? { returnType: makeLwcTypeJson(fields.returnType, context) }
                : {}),
            block: makeBlock(fields.body, scope),
        },
    );
};

/** 本体の中の class 宣言 */
const makeClassDeclaration = (
    node: ir.ClassDeclarationTypeClass,
    scope: StatementContext,
): LwcJsClassDeclarationJson => {
    const { tables, context } = scope;
    const fields = node.getFields();
    const implement = (fields.implements ?? []).map((i) => makeLwcTypeJson(i, context));
    return makeJsonType<'jsClassDeclaration', LwcJsClassDeclarationJson>(
        'jsClassDeclaration',
        context.keysOf(node),
        {
            name: fields.id.getFields().name,
            ...(fields.heritage?.superClass
                ? { superClass: expressionOf(fields.heritage.superClass, scope) }
                : {}),
            ...(implement.length > 0 ? { implement } : {}),
            block: makeLwcClassMembersJson(fields.body.getFields().body, tables, context),
        },
    );
};

// ---------------------------------------------------------------------------
// 文
// ---------------------------------------------------------------------------

const makeStatement = (node: LwcNode, scope: StatementContext): LwcJsStatementJson => {
    const { context } = scope;
    const keys = () => context.keysOf(node);
    const fields = node.getFields() as Record<string, unknown>;
    const child = (name: string) => expressionOf(fields[name] as LwcNode, scope);
    const body = (name = 'body') => bodyOf(fields[name] as LwcNode, scope);
    switch (node.kind) {
        case 'expressionStatement':
            return makeJsonType<'jsExpression', LwcJsExpressionStatementJson>(
                'jsExpression',
                keys(),
                { value: child('expression') },
            );
        case 'variableDeclaration':
            return makeLocalVariable(node as ir.VariableDeclarationTypeClass, scope);
        case 'ifStatement':
            return makeIf(node as ir.IfStatementTypeClass, scope);
        case 'forStatement': {
            const { init, test, update } = (node as ir.ForStatementTypeClass).getFields();
            return makeJsonType<'jsFor', LwcJsForStatementJson>('jsFor', keys(), {
                condition: {
                    ...(init
                        ? {
                              initializer:
                                  init.kind === 'variableDeclaration'
                                      ? makeLocalVariable(
                                            init as ir.VariableDeclarationTypeClass,
                                            scope,
                                        )
                                      : expressionOf(init, scope),
                          }
                        : {}),
                    ...(test ? { condition: expressionOf(test, scope) } : {}),
                    ...(update ? { update: expressionOf(update, scope) } : {}),
                },
                block: body(),
            });
        }
        case 'forInStatement':
            return makeJsonType<'jsForIn', LwcJsForInStatementJson>('jsForIn', keys(), {
                ...makeForXLeft(fields.left as LwcNode, scope),
                right: child('right'),
                block: body(),
            });
        case 'forOfStatement':
            return makeJsonType<'jsForOf', LwcJsForOfStatementJson>('jsForOf', keys(), {
                ...makeForXLeft(fields.left as LwcNode, scope),
                right: child('right'),
                await: fields.await === true,
                block: body(),
            });
        case 'whileStatement':
            return makeJsonType<'jsWhile', LwcJsWhileStatementJson>('jsWhile', keys(), {
                condition: child('test'),
                block: body(),
            });
        case 'doWhileStatement':
            return makeJsonType<'jsDoWhile', LwcJsDoWhileStatementJson>('jsDoWhile', keys(), {
                condition: child('test'),
                block: body(),
            });
        case 'switchStatement': {
            const { discriminant, cases } = (node as ir.SwitchStatementTypeClass).getFields();
            return makeJsonType<'jsSwitch', LwcJsSwitchStatementJson>('jsSwitch', keys(), {
                discriminant: expressionOf(discriminant, scope),
                cases: cases.map((switchCase) => {
                    const { test, consequent } = switchCase.getFields();
                    return {
                        ...(test ? { test: expressionOf(test, scope) } : {}),
                        block: (consequent as LwcNode[]).map((s) => makeStatement(s, scope)),
                    };
                }),
            });
        }
        case 'tryStatement':
            return makeTry(node as ir.TryStatementTypeClass, scope);
        case 'throwStatement':
            return makeJsonType<'jsThrow', LwcJsThrowStatementJson>('jsThrow', keys(), {
                value: child('argument'),
            });
        case 'returnStatement':
            return makeJsonType<'jsReturn', LwcJsReturnStatementJson>('jsReturn', keys(), {
                ...(fields.argument ? { field: child('argument') } : {}),
            });
        case 'breakStatement':
            return makeJsonType<'jsBreak', LwcJsBreakStatementJson>(
                'jsBreak',
                keys(),
                labelOf(fields.label as LwcNode | null),
            );
        case 'continueStatement':
            return makeJsonType<'jsContinue', LwcJsContinueStatementJson>(
                'jsContinue',
                keys(),
                labelOf(fields.label as LwcNode | null),
            );
        case 'labeledStatement':
            return makeJsonType<'jsLabeled', LwcJsLabeledStatementJson>('jsLabeled', keys(), {
                label: nameOf(fields.label as LwcNode, context),
                body: makeStatement(fields.body as LwcNode, scope),
            });
        case 'blockStatement':
            return makeJsonType<'jsBlock', LwcJsBlockStatementJson>('jsBlock', keys(), {
                block: makeBlock(node as ir.BlockStatementTypeClass, scope),
            });
        case 'emptyStatement':
            return makeJsonType<'jsEmpty', LwcJsEmptyStatementJson>('jsEmpty', keys());
        case 'debuggerStatement':
            return makeJsonType<'jsDebugger', LwcJsDebuggerStatementJson>('jsDebugger', keys());
        case 'withStatement':
            return makeJsonType<'jsWith', LwcJsWithStatementJson>('jsWith', keys(), {
                object: child('object'),
                block: body(),
            });
        case 'functionDeclaration':
            return makeFunctionDeclaration(node as ir.FunctionDeclarationTypeClass, scope);
        case 'classDeclaration':
            return makeClassDeclaration(node as ir.ClassDeclarationTypeClass, scope);
        default:
            if (TYPE_DECLARATION_NODES.includes(node.kind)) {
                return makeLwcTypeDeclarationJson(node as LwcTypeDeclarationType, false, context);
            }
            // TS の namespace・declare function・import x = require()・Flow の declare など
            return makeJsonType<'jsUnsupportedStatement', LwcJsUnsupportedStatementJson>(
                'jsUnsupportedStatement',
                keys(),
                { nodeType: node.kind },
            );
    }
};

/** 文 → JSON (5.3) */
export const makeLwcStatementJson = (
    node: LwcNode,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcJsStatementJson => makeStatement(node, { tables, context });

/** 関数・メソッドの本体のブロック ({ }) → 文の並び (先頭のディレクティブを含む) */
export const makeLwcBlockJson = (
    node: ir.BlockStatementTypeClass,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcJsStatementJson[] => makeBlock(node, { tables, context });
