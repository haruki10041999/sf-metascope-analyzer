// JS / TS のモジュールの JSON (docs/lwc-implementation.md)。Apex の types/apex/unit.ts に当たる。
// Apex の unit と同じく、モジュールは境界ノードにせず kind / sourceKeys を持たない (ファイルごとに保存する単位のため)。
// モジュールの直下 (docs/lwc-json-types.md 5.2・6 章の段階 5):
// - import は imports、default export のクラスは component
// - 変数・関数の宣言は lwcDeclaration、コンポーネント以外のクラスは lwcClass (メンバーはコンポーネントと同じ形) で declarations に入れる
// - export はすべて exports (lwcExport。名前つき・default・export * ・再エクスポート。型だけの export も typeOnly で持つ)
// - 宣言でも import / export でもない直下の文 (registerX(...) などの式の文・if など) は statements (文の JSON)
// 入力は IR v2 (lwc_IR) のノード。v2 の木にはエラーのノードがない (構文エラーで壊れた部分は木から落ち、
// resolvedError にだけ出る) ので、JSON にもエラーのノードはない
import {
    makeJsonType,
    makeStructureJson,
    type ConvertKeys,
    type JsonType,
    type StructureJsonType,
} from '../commons/json';
import type { commons, standardizedVisitor } from '../lwc_IR';

import { nameOf, unwrapExpression, walkNodes, type LwcJsonContext, type LwcNode } from './commons';
import {
    makeLwcBodyContentJson,
    makeLwcClassMembersJson,
    makeLwcComponentJson,
    makeLwcFunctionContentJson,
    makeLwcImportTables,
    type LwcBodyContentJson,
    type LwcComponentJson,
    type LwcImportReferenceJson,
    type LwcImportTables,
    type LwcMemberJson,
    type LwcParameterJson,
} from './component';
import { makeLwcExpressionJson, type LwcJsExpressionJson } from './expression';
import { makeLwcImportJson, type LwcImportJson } from './import';
import { makeLwcStatementJson, type LwcJsStatementJson } from './statement';
import { makeLwcTypeJson, type LwcTypeJson } from './type';
import {
    makeLwcTypeDeclarationJson,
    type LwcTypeDeclarationJson,
    type LwcTypeDeclarationType,
    TYPE_DECLARATION_NODES,
} from './typeDeclaration';

/**
 * モジュールの直下の変数・関数の宣言 (export しないものも含む)。
 * 名前を持つ宣言なので StructureJsonType。関数 (と、関数を初期値にした変数) は本体を持つ
 */
export type LwcDeclarationJson = StructureJsonType<'lwcDeclaration', { name: ConvertKeys }> &
    LwcBodyContentJson & {
        /** 名前 (export default function () {} のように名前がなければ 'default') */
        name: string;
        declarationType: 'variable' | 'function';
        /** export したか (export const・export { a }・export default a) */
        exported: boolean;
        /** 変数の const / let / var */
        variableKind?: string;
        /** const x: T の T */
        variantType?: LwcTypeJson;
        /** 変数の初期値の式 (5.4)。初期値がそのまま関数のときは持たない (関数は本体の中身で表す) */
        init?: LwcJsExpressionJson;
        /** 初期値の中で使っている import */
        references: LwcImportReferenceJson[];
        /** 関数 (と、関数を初期値にした変数) の中身 (LwcFunctionContentJson と同じ) */
        arrow?: boolean;
        param?: LwcParameterJson[];
        returnType?: LwcTypeJson;
        async?: boolean;
        generator?: boolean;
        functionName?: string;
        expression?: LwcJsExpressionJson;
    };

/** コンポーネント以外のクラス (ユーティリティ・基底クラス)。メンバーはコンポーネントと同じ形 (5.2) */
export type LwcClassJson = StructureJsonType<'lwcClass', { name: ConvertKeys }> & {
    name: string;
    exported: boolean;
    /** extends の式 (ソースの文字列ではなく式の JSON) */
    superClass?: LwcJsExpressionJson;
    /** TS の implements */
    implement?: LwcTypeJson[];
    /** メンバー (ソースの順) */
    block: LwcMemberJson[];
};

/** モジュールの直下の宣言 */
export type LwcModuleDeclarationJson = LwcDeclarationJson | LwcClassJson;

/**
 * export 1 つ (5.2)。
 * named: export const a / export { a as b } / export { a as b } from 'x' / export v from 'x' (local は 'default')、
 * default: export default ...、all: export * from 'x' / export * as ns from 'x' (exported は ns)
 */
export type LwcExportJson = JsonType<'lwcExport'> & {
    exportType: 'named' | 'default' | 'all';
    /**
     * このモジュールの中の名前 (export { a as b } の a。再エクスポートは import 元での名前)。
     * export default <式> (名前のない式) と export * は持たない
     */
    local?: string;
    /** export した名前 (export { a as b } の b。default は 'default'。export * from 'x' は持たない) */
    exported?: string;
    /** 再エクスポートの import 元 */
    source?: string;
    /** 型だけの export (export type { A }・export interface A など) */
    typeOnly: boolean;
};

export type LwcModuleJson = {
    fileType: 'js' | 'ts';
    imports: LwcImportJson[];
    /** default export のクラス */
    component?: LwcComponentJson;
    /** export (ソースの順。型だけの export も含む) */
    exports: LwcExportJson[];
    /** モジュールの直下の宣言 (コンポーネント以外の変数・関数・クラス。export しないものも含む) */
    declarations: LwcModuleDeclarationJson[];
    /** TS・Flow の interface / type / enum (.js は Flow の宣言があるときだけ) */
    typeDeclarations?: LwcTypeDeclarationJson[];
    /** 宣言でも import / export でもない直下の文 (式の文・if など)。なければ持たない */
    statements?: LwcJsStatementJson[];
};

const isTypeDeclaration = (node: LwcNode): node is LwcTypeDeclarationType =>
    TYPE_DECLARATION_NODES.includes(node.kind);

/** モジュールの直下の宣言のうち、lwcDeclaration・lwcClass にするもの */
type DeclarationNode =
    | commons.VariableDeclarationTypeClass
    | commons.FunctionDeclarationTypeClass<commons.IdentifierTypeClass | null>
    | commons.ClassDeclarationTypeClass;

const isDeclarationNode = (node: LwcNode): node is DeclarationNode =>
    node.kind === 'variableDeclaration' ||
    node.kind === 'functionDeclaration' ||
    node.kind === 'classDeclaration';

/** コンポーネントのクラス (export default class {} のときは名前がない) */
type ComponentNode =
    | commons.ClassDeclarationTypeClass<commons.IdentifierTypeClass | null>
    | commons.ClassExpressionTypeClass;

/** 宣言 (export const a = 1, b = 2 / export function f / export class C) の名前と、その位置のノード */
const declaredNames = (
    declaration: DeclarationNode,
    context: LwcJsonContext,
): { name: string; node: LwcNode }[] => {
    switch (declaration.kind) {
        case 'variableDeclaration':
            return declaration
                .getFields()
                .declarations.map((d: standardizedVisitor.VariableDeclaratorTypeClass) => {
                    const { id } = d.getFields();
                    return { name: nameOf(id, context), node: id };
                });
        case 'functionDeclaration':
        case 'classDeclaration': {
            const { id } = declaration.getFields();
            return id ? [{ name: id.getFields().name, node: id }] : [];
        }
    }
};

/** 式の中で使っている import (識別子が import の名前のもの) */
const referencesIn = (node: LwcNode, tables: LwcImportTables): LwcImportReferenceJson[] => {
    const found = new Map<string, LwcImportReferenceJson>();
    walkNodes(node, (child) => {
        if (child.kind === 'identifier') {
            const name = (child as commons.IdentifierTypeClass).getFields().name;
            const reference = tables.imports.get(name);
            if (reference) found.set(name, reference);
        }
    });
    return [...found.values()];
};

/**
 * 変数 (と export default <式>) の宣言 → lwcDeclaration。
 * 初期値がそのまま関数なら関数の中身 (本体の文・引数など) で表し、初期値の式・文字列は持たない
 */
const makeVariableJson = (
    sourceKeys: { base: ConvertKeys; name: ConvertKeys },
    name: string,
    init: LwcNode | null,
    variable: { variableKind?: string; variantType?: LwcTypeJson },
    exported: boolean,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcDeclarationJson => {
    const fn = init ? makeLwcFunctionContentJson(unwrapExpression(init), tables, context) : null;
    const onlyFunction = fn !== null && init !== null && unwrapExpression(init) === init;
    // 変数の references は初期値全体 (関数なら引数の既定値も含む) の import の参照
    const { references: _bodyReferences, ...content } =
        fn ?? makeLwcBodyContentJson(init, tables, context);
    return makeStructureJson('lwcDeclaration', sourceKeys, {
        name,
        declarationType: fn ? ('function' as const) : ('variable' as const),
        exported,
        ...variable,
        ...(init && !onlyFunction ? { init: makeLwcExpressionJson(init, tables, context) } : {}),
        references: init ? referencesIn(init, tables) : [],
        ...content,
    });
};

/** 関数の宣言 (export default function () {} の名前のないものを含む) → lwcDeclaration */
const makeFunctionJson = (
    declaration: commons.FunctionDeclarationTypeClass<commons.IdentifierTypeClass | null>,
    exported: boolean,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcDeclarationJson => {
    const id = declaration.getFields().id;
    const sourceKeys = context.structureKeysOf(declaration, { name: id });
    // function 宣言の references は本体の中の import の参照
    const { references, ...content } = makeLwcFunctionContentJson(declaration, tables, context)!;
    return makeStructureJson('lwcDeclaration', sourceKeys, {
        name: id ? id.getFields().name : 'default',
        declarationType: 'function' as const,
        exported,
        references,
        ...content,
    });
};

/** コンポーネント以外のクラス → lwcClass */
const makeClassJson = (
    declaration: commons.ClassDeclarationTypeClass,
    exported: boolean,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcClassJson => {
    const fields = declaration.getFields();
    const implement = (fields.implements ?? []).map((i) => makeLwcTypeJson(i, context));
    return makeStructureJson(
        'lwcClass',
        context.structureKeysOf(declaration, { name: fields.id }),
        {
            name: fields.id.getFields().name,
            exported,
            ...(fields.heritage?.superClass
                ? { superClass: makeLwcExpressionJson(fields.heritage.superClass, tables, context) }
                : {}),
            ...(implement.length > 0 ? { implement } : {}),
            block: makeLwcClassMembersJson(fields.body.getFields().body, tables, context),
        },
    );
};

/**
 * モジュールの直下の宣言 → lwcDeclaration (変数は宣言子ごとに 1 つ)・lwcClass。
 * sourceKeys は { base: 宣言 (変数は宣言子), name: 名前 }
 */
const makeDeclarationsJson = (
    declaration: DeclarationNode,
    isExported: (name: string) => boolean,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcModuleDeclarationJson[] => {
    switch (declaration.kind) {
        case 'variableDeclaration': {
            const { kind: variableKind, declarations } = declaration.getFields();
            return declarations.map(
                (declarator: standardizedVisitor.VariableDeclaratorTypeClass) => {
                    const { id, init } = declarator.getFields();
                    const name = nameOf(id, context);
                    const annotation = (id.getFields() as { typeAnnotation?: LwcNode | null })
                        .typeAnnotation;
                    return makeVariableJson(
                        context.structureKeysOf(declarator, { name: id }),
                        name,
                        init,
                        {
                            variableKind,
                            ...(annotation
                                ? { variantType: makeLwcTypeJson(annotation, context) }
                                : {}),
                        },
                        isExported(name),
                        tables,
                        context,
                    );
                },
            );
        }
        case 'functionDeclaration': {
            const id = declaration.getFields().id;
            return [
                makeFunctionJson(
                    declaration,
                    isExported(id ? id.getFields().name : 'default'),
                    tables,
                    context,
                ),
            ];
        }
        case 'classDeclaration':
            return [
                makeClassJson(
                    declaration,
                    isExported(declaration.getFields().id.getFields().name),
                    tables,
                    context,
                ),
            ];
    }
};

/** File → モジュールの JSON */
export const makeLwcModuleJson = (
    file: standardizedVisitor.FileTypeClass,
    fileType: 'js' | 'ts',
    context: LwcJsonContext,
): LwcModuleJson => {
    const program = file.getFields().program;

    const imports: LwcImportJson[] = [];
    const exports: LwcExportJson[] = [];
    const typeDeclarations: LwcTypeDeclarationJson[] = [];
    const classes = new Map<string, commons.ClassDeclarationTypeClass>();
    // モジュールの直下の宣言・文。import をすべて読んでから JSON にする
    const declarationNodes: { node: DeclarationNode; exported: boolean }[] = [];
    /** export default <式> (クラス・名前の参照以外) */
    let defaultExpression: { node: LwcNode; statement: LwcNode } | null = null;
    const statementNodes: LwcNode[] = [];
    /** export { a } / export default a で export した、このモジュールの中の名前 (値のもの) */
    const exportedLocals = new Set<string>();
    let componentClass: ComponentNode | null = null;
    let defaultName: string | null = null;

    const exportJson = (
        node: LwcNode,
        properties: Omit<LwcExportJson, 'kind' | 'sourceKeys'>,
    ): void => {
        exports.push(
            makeJsonType<'lwcExport', LwcExportJson>('lwcExport', context.keysOf(node), properties),
        );
    };

    for (const statement of program.getFields().body) {
        switch (statement.kind) {
            case 'importDeclaration':
                imports.push(makeLwcImportJson(statement, context));
                break;
            case 'classDeclaration':
                classes.set(statement.getFields().id.getFields().name, statement);
                declarationNodes.push({ node: statement, exported: false });
                break;
            case 'variableDeclaration':
            case 'functionDeclaration':
                declarationNodes.push({ node: statement, exported: false });
                break;
            case 'exportDefaultDeclaration': {
                const fields = statement.getFields();
                const base = { exportType: 'default' as const, exported: 'default' };
                if (fields.kind === 'class') {
                    componentClass = fields.declaration;
                    const id = fields.declaration.getFields().id;
                    exportJson(statement, {
                        ...base,
                        ...(id ? { local: id.getFields().name } : {}),
                        typeOnly: false,
                    });
                } else if (fields.kind === 'function') {
                    // export default function f() {} / export default function () {}
                    const id = fields.declaration.getFields().id;
                    declarationNodes.push({ node: fields.declaration, exported: true });
                    exportJson(statement, {
                        ...base,
                        local: id ? id.getFields().name : 'default',
                        typeOnly: false,
                    });
                } else if (fields.kind === 'expression') {
                    const declaration: LwcNode = fields.declaration;
                    if (declaration.kind === 'classExpression') {
                        componentClass = declaration as commons.ClassExpressionTypeClass;
                        const id = (declaration as commons.ClassExpressionTypeClass).getFields().id;
                        exportJson(statement, {
                            ...base,
                            ...(id ? { local: id.getFields().name } : {}),
                            typeOnly: false,
                        });
                    } else if (declaration.kind === 'identifier') {
                        // class A {} ... export default A; / const a = ...; export default a;
                        defaultName = (declaration as commons.IdentifierTypeClass).getFields().name;
                        exportedLocals.add(defaultName);
                        exportJson(statement, { ...base, local: defaultName, typeOnly: false });
                    } else {
                        // export default { ... } / export default () => {...} は 'default' という名前の宣言にする
                        defaultExpression = { node: declaration, statement };
                        exportJson(statement, { ...base, local: 'default', typeOnly: false });
                    }
                } else {
                    // export default interface I {} (TS)・export default enum E {} (Flow)・export default function f(): T; (TS の宣言だけ)
                    const declaration: LwcNode = fields.declaration;
                    if (isTypeDeclaration(declaration)) {
                        typeDeclarations.push(
                            makeLwcTypeDeclarationJson(declaration, true, context),
                        );
                    }
                    const id = (declaration.getFields() as { id?: LwcNode | null }).id;
                    exportJson(statement, {
                        ...base,
                        ...(id ? { local: nameOf(id, context) } : {}),
                        typeOnly: declaration.kind === 'tSInterfaceDeclaration',
                    });
                }
                break;
            }
            case 'exportNamedDeclaration': {
                const fields = statement.getFields();
                const typeOnly = fields.exportKind === 'type';
                if (fields.kind === 'declaration') {
                    const declaration: LwcNode = fields.declaration;
                    if (isTypeDeclaration(declaration)) {
                        typeDeclarations.push(
                            makeLwcTypeDeclarationJson(declaration, true, context),
                        );
                        const name = declaration.getFields().id;
                        exportJson(name, {
                            exportType: 'named',
                            local: nameOf(name, context),
                            exported: nameOf(name, context),
                            typeOnly: true,
                        });
                    } else if (isDeclarationNode(declaration)) {
                        declarationNodes.push({ node: declaration, exported: true });
                        for (const { name, node } of declaredNames(declaration, context)) {
                            exportJson(node, {
                                exportType: 'named',
                                local: name,
                                exported: name,
                                typeOnly,
                            });
                        }
                    }
                    break;
                }
                const source =
                    fields.kind === 'reexport' ? { source: fields.source.getFields().value } : {};
                for (const specifier of fields.specifiers as LwcNode[]) {
                    const specifierFields = specifier.getFields() as unknown as {
                        local?: LwcNode;
                        exported: LwcNode;
                        exportKind?: string;
                    };
                    const exported = nameOf(specifierFields.exported, context);
                    const specifierTypeOnly = typeOnly || specifierFields.exportKind === 'type';
                    switch (specifier.kind) {
                        case 'exportNamespaceSpecifier':
                            // export * as ns from 'x'
                            exportJson(specifier, {
                                exportType: 'all',
                                exported,
                                ...source,
                                typeOnly: specifierTypeOnly,
                            });
                            break;
                        case 'exportDefaultSpecifier':
                            // export v from 'x' (default の再エクスポート)
                            exportJson(specifier, {
                                exportType: 'named',
                                local: 'default',
                                exported,
                                ...source,
                                typeOnly: specifierTypeOnly,
                            });
                            break;
                        default: {
                            const local = nameOf(specifierFields.local!, context);
                            if (fields.kind === 'local' && !specifierTypeOnly) {
                                exportedLocals.add(local);
                            }
                            exportJson(specifier, {
                                exportType: 'named',
                                local,
                                exported,
                                ...source,
                                typeOnly: specifierTypeOnly,
                            });
                        }
                    }
                }
                break;
            }
            case 'exportAllDeclaration': {
                const fields = statement.getFields();
                exportJson(statement, {
                    exportType: 'all',
                    source: fields.source.getFields().value,
                    typeOnly: fields.exportKind === 'type',
                });
                break;
            }
            default:
                if (isTypeDeclaration(statement)) {
                    typeDeclarations.push(makeLwcTypeDeclarationJson(statement, false, context));
                } else {
                    // 式の文 (registerX(...) など)・if など。TS の namespace などは jsUnsupportedStatement になる
                    statementNodes.push(statement);
                }
        }
    }

    const component: ComponentNode | null =
        componentClass ?? (defaultName ? (classes.get(defaultName) ?? null) : null);
    const tables = makeLwcImportTables(imports);
    const declarations: LwcModuleDeclarationJson[] = declarationNodes
        .filter(({ node }) => node !== component)
        .flatMap(({ node, exported }) =>
            makeDeclarationsJson(
                node,
                (name) => exported || exportedLocals.has(name),
                tables,
                context,
            ),
        );
    if (defaultExpression) {
        const { node, statement } = defaultExpression;
        declarations.push(
            makeVariableJson(
                context.structureKeysOf(statement, { name: node }),
                'default',
                node,
                {},
                true,
                tables,
                context,
            ),
        );
    }
    const statements = statementNodes.map((node) => makeLwcStatementJson(node, tables, context));
    return {
        fileType,
        imports,
        ...(component ? { component: makeLwcComponentJson(component, imports, context) } : {}),
        exports,
        declarations,
        // Flow (// @flow の .js) の型の宣言があれば、.js でも持つ
        ...(fileType === 'ts' || typeDeclarations.length > 0 ? { typeDeclarations } : {}),
        ...(statements.length > 0 ? { statements } : {}),
    };
};
