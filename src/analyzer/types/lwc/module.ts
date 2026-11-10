// JS / TS のモジュールの JSON (docs/lwc-implementation.md)。Apex の types/apex/unit.ts に当たる。
// Apex の unit と同じく、モジュールは境界ノードにせず kind / sourceKeys を持たない (ファイルごとに保存する単位のため)。
// 入力は IR v2 (lwc_IR) のノード。v2 の木にはエラーのノードがない (構文エラーで壊れた部分は木から落ち、
// resolvedError にだけ出る) ので、JSON にもエラーのノードはない
import { makeStructureJson, type ConvertKeys, type StructureJsonType } from '../commons/json';
import type { commons, standardizedVisitor } from '../lwc_IR';

import { nameOf, walkNodes, type LwcJsonContext, type LwcNode } from './commons';
import {
    makeLwcBodyContentJson,
    makeLwcComponentJson,
    makeLwcImportTables,
    makeLwcParameterJson,
    type LwcBodyContentJson,
    type LwcComponentJson,
    type LwcImportReferenceJson,
    type LwcImportTables,
    type LwcParameterJson,
} from './component';
import { makeLwcTypeJson, type LwcTypeJson } from './type';
import { makeLwcImportJson, type LwcImportJson } from './import';
import {
    makeLwcTypeDeclarationJson,
    type LwcTypeDeclarationJson,
    type LwcTypeDeclarationType,
} from './typeDeclaration';

/**
 * モジュールの直下の宣言 (コンポーネント以外の変数・関数・クラス。export しないものも含む)。
 * 名前を持つ宣言なので StructureJsonType。関数 (と、関数を初期値にした変数) は本体を持つ
 */
export type LwcDeclarationJson = StructureJsonType<'lwcDeclaration', { name: ConvertKeys }> &
    LwcBodyContentJson & {
        name: string;
        declarationType: 'variable' | 'function' | 'class';
        exported: boolean;
        /** 変数の const / let / var */
        variableKind?: string;
        /** 変数の初期値の式の文字列 */
        init?: string;
        /** 初期値の中で使っている import */
        references: LwcImportReferenceJson[];
        /** 関数 (と、関数を初期値にした変数) の引数・戻り値の型 */
        param?: LwcParameterJson[];
        returnType?: LwcTypeJson;
        async?: boolean;
    };

export type LwcModuleJson = {
    fileType: 'js' | 'ts';
    imports: LwcImportJson[];
    /** default export のクラス */
    component?: LwcComponentJson;
    /** default 以外に export した名前 (関数・変数・クラス。型は typeDeclarations) */
    otherExports: string[];
    /** モジュールの直下の宣言 (コンポーネント以外。export しないものも含む) */
    declarations: LwcDeclarationJson[];
    /** TS の interface / type / enum */
    typeDeclarations?: LwcTypeDeclarationJson[];
};

const isTypeDeclaration = (node: LwcNode): node is LwcTypeDeclarationType =>
    node.kind === 'tSInterfaceDeclaration' ||
    node.kind === 'tSTypeAliasDeclaration' ||
    node.kind === 'tSEnumDeclaration';

/** モジュールの直下の宣言のうち、lwcDeclaration にするもの */
type DeclarationNode =
    | commons.VariableDeclarationTypeClass
    | commons.FunctionDeclarationTypeClass
    | commons.ClassDeclarationTypeClass;

const isDeclarationNode = (node: LwcNode): node is DeclarationNode =>
    node.kind === 'variableDeclaration' ||
    node.kind === 'functionDeclaration' ||
    node.kind === 'classDeclaration';

/** コンポーネントのクラス (export default class {} のときは名前がない) */
type ComponentNode =
    | commons.ClassDeclarationTypeClass<commons.IdentifierTypeClass | null>
    | commons.ClassExpressionTypeClass;

/** 宣言 (export const a = 1, b = 2 / export function f / export class C) の名前 */
const declaredNames = (declaration: DeclarationNode, context: LwcJsonContext): string[] => {
    switch (declaration.kind) {
        case 'variableDeclaration':
            return declaration
                .getFields()
                .declarations.map((d: standardizedVisitor.VariableDeclaratorTypeClass) =>
                    nameOf(d.getFields().id, context),
                );
        case 'functionDeclaration':
        case 'classDeclaration':
            return [declaration.getFields().id.getFields().name];
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

/** 関数 (function / アロー関数) なら、引数・戻り値の型・async と本体。関数でなければ null */
const functionPartsOf = (
    node: LwcNode | null,
    tables: LwcImportTables,
    context: LwcJsonContext,
) => {
    if (!node) {
        return null;
    }
    let fields:
        | commons.FunctionDeclarationFields
        | commons.FunctionExpressionFields
        | commons.ArrowFunctionExpressionFields;
    let body: LwcNode;
    switch (node.kind) {
        case 'functionDeclaration':
        case 'functionExpression':
            fields = (
                node as commons.FunctionDeclarationTypeClass | commons.FunctionExpressionTypeClass
            ).getFields();
            body = fields.body;
            break;
        case 'arrowFunctionExpression': {
            const arrow = (node as commons.ArrowFunctionExpressionTypeClass).getFields();
            fields = arrow;
            // アロー関数の本体は、ブロックか式 (v1 の body と同じノード)
            body = arrow.body.kind === 'block' ? arrow.body.block : arrow.body.expression;
            break;
        }
        default:
            return null;
    }
    return {
        param: fields.params.map((p) => makeLwcParameterJson(p, tables, context)),
        ...(fields.returnType ? { returnType: makeLwcTypeJson(fields.returnType, context) } : {}),
        async: fields.async === true,
        ...makeLwcBodyContentJson(body, tables, context),
    };
};

/**
 * モジュールの直下の宣言 → lwcDeclaration (変数は宣言子ごとに 1 つ)。
 * sourceKeys は { base: 宣言 (変数は宣言子), name: 名前 }
 */
const makeDeclarationsJson = (
    declaration: DeclarationNode,
    exported: boolean,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcDeclarationJson[] => {
    switch (declaration.kind) {
        case 'variableDeclaration': {
            const { kind: variableKind, declarations } = declaration.getFields();
            return declarations.map(
                (
                    declarator: standardizedVisitor.VariableDeclaratorTypeClass,
                ): LwcDeclarationJson => {
                    const { id, init } = declarator.getFields();
                    const sourceKeys = context.structureKeysOf(declarator, { name: id });
                    const fn = functionPartsOf(init, tables, context);
                    return makeStructureJson('lwcDeclaration', sourceKeys, {
                        name: nameOf(id, context),
                        declarationType: fn ? ('function' as const) : ('variable' as const),
                        exported,
                        variableKind,
                        ...(init ? { init: context.textOf(init) } : {}),
                        references: init ? referencesIn(init, tables) : [],
                        ...(fn ?? makeLwcBodyContentJson(init, tables, context)),
                    });
                },
            );
        }
        case 'functionDeclaration': {
            const id = declaration.getFields().id;
            const sourceKeys = context.structureKeysOf(declaration, { name: id });
            return [
                makeStructureJson('lwcDeclaration', sourceKeys, {
                    name: nameOf(id, context),
                    declarationType: 'function' as const,
                    exported,
                    references: [],
                    ...functionPartsOf(declaration, tables, context)!,
                }),
            ];
        }
        case 'classDeclaration': {
            const id = declaration.getFields().id;
            const sourceKeys = context.structureKeysOf(declaration, { name: id });
            return [
                makeStructureJson('lwcDeclaration', sourceKeys, {
                    name: nameOf(id, context),
                    declarationType: 'class' as const,
                    exported,
                    references: [],
                    calls: [],
                    events: [],
                }),
            ];
        }
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
    const otherExports: string[] = [];
    const typeDeclarations: LwcTypeDeclarationJson[] = [];
    const classes = new Map<string, commons.ClassDeclarationTypeClass>();
    // モジュールの直下の宣言。import をすべて読んでから JSON にする
    const declarationNodes: { node: DeclarationNode; exported: boolean }[] = [];
    let componentClass: ComponentNode | null = null;
    let defaultName: string | null = null;

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
                if (fields.kind === 'class') {
                    componentClass = fields.declaration;
                } else if (fields.kind === 'expression') {
                    const declaration: LwcNode = fields.declaration;
                    if (declaration.kind === 'classExpression') {
                        componentClass = declaration as commons.ClassExpressionTypeClass;
                    } else if (declaration.kind === 'identifier') {
                        // class A {} ... export default A;
                        defaultName = (declaration as commons.IdentifierTypeClass).getFields().name;
                    }
                }
                break;
            }
            case 'exportNamedDeclaration': {
                const fields = statement.getFields();
                if (fields.kind === 'declaration') {
                    const declaration: LwcNode = fields.declaration;
                    if (isTypeDeclaration(declaration)) {
                        typeDeclarations.push(
                            makeLwcTypeDeclarationJson(declaration, true, context),
                        );
                    } else if (isDeclarationNode(declaration)) {
                        otherExports.push(...declaredNames(declaration, context));
                        declarationNodes.push({ node: declaration, exported: true });
                    }
                    break;
                }
                // export type { A } の型は otherExports に入れない
                if (fields.exportKind === 'type') break;
                for (const specifier of fields.specifiers) {
                    // export v from 'x' (default の再エクスポート) は入れない
                    if (specifier.kind === 'exportDefaultSpecifier') continue;
                    if (
                        specifier.kind !== 'exportNamespaceSpecifier' &&
                        specifier.getFields().exportKind === 'type'
                    )
                        continue;
                    otherExports.push(nameOf(specifier.getFields().exported, context));
                }
                break;
            }
            default:
                if (isTypeDeclaration(statement)) {
                    typeDeclarations.push(makeLwcTypeDeclarationJson(statement, false, context));
                }
        }
    }

    const component: ComponentNode | null =
        componentClass ?? (defaultName ? (classes.get(defaultName) ?? null) : null);
    const tables = makeLwcImportTables(imports);
    const declarations = declarationNodes
        .filter(({ node }) => node !== component)
        .flatMap(({ node, exported }) => makeDeclarationsJson(node, exported, tables, context));
    return {
        fileType,
        imports,
        ...(component ? { component: makeLwcComponentJson(component, imports, context) } : {}),
        otherExports,
        declarations,
        ...(fileType === 'ts' ? { typeDeclarations } : {}),
    };
};
