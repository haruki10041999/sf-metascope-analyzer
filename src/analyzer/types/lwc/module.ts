// JS / TS のモジュールの JSON (docs/lwc-parse-plan.md 3.1.6)。Apex の types/apex/unit.ts に当たる。
// Apex の unit と同じく、モジュールは境界ノードにせず kind / sourceKeys を持たない (ファイルごとに保存する単位のため)。
// 直下の IR を作れなかったノードは、その位置 (errors) に ErrorJson として残す
import { isErrorNode } from '../apex/commons';
import {
    makeStructureJson,
    type ConvertKeys,
    type ErrorJson,
    type StructureJsonType,
} from '../commons/json';

import {
    convertLwcValue,
    nameOf,
    walkNodes,
    type LwcConvertNode,
    type LwcJsonContext,
    makeLwcErrorJson,
} from './commons';
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
import type { LwcFileType } from './converter';
import { makeLwcImportJson, type LwcImportJson } from './import';
import {
    makeLwcTypeDeclarationJson,
    type LwcTypeDeclarationJson,
    type LwcTypeDeclarationType,
} from './typeDeclaration';

const ERROR_KIND = 'lwcModule';

/**
 * モジュールの直下の宣言 (コンポーネント以外の変数・関数・クラス。export しないものも含む)。
 * 名前を持つ宣言なので StructureJsonType。関数 (と、関数を初期値にした変数) は本体を持つ
 */
export type LwcDeclarationJson = StructureJsonType<'lwcDeclaration', { name: ConvertKeys }> &
    LwcBodyContentJson & {
        name: string | ErrorJson;
        declarationType: 'variable' | 'function' | 'class';
        exported: boolean;
        /** 変数の const / let / var */
        variableKind?: string;
        /** 変数の初期値の式の文字列 */
        init?: string;
        /** 初期値の中で使っている import */
        references: LwcImportReferenceJson[];
        /** 関数 (と、関数を初期値にした変数) の引数・戻り値の型 */
        param?: (LwcParameterJson | ErrorJson)[];
        returnType?: LwcTypeJson | ErrorJson;
        async?: boolean;
    };

export type LwcModuleJson = {
    fileType: 'js' | 'ts';
    imports: (LwcImportJson | ErrorJson)[];
    /** default export のクラス */
    component?: LwcComponentJson | ErrorJson;
    /** default 以外に export した名前 (関数・変数・クラス。型は typeDeclarations) */
    otherExports: string[];
    /** モジュールの直下の宣言 (コンポーネント以外。export しないものも含む) */
    declarations: (LwcDeclarationJson | ErrorJson)[];
    /** TS の interface / type / enum */
    typeDeclarations?: (LwcTypeDeclarationJson | ErrorJson)[];
    /** モジュールの直下で IR を作れなかった文 */
    errors: ErrorJson[];
};

const isTypeDeclaration = (node: LwcConvertNode): node is LwcTypeDeclarationType =>
    node.type === 'tSInterfaceDeclaration' ||
    node.type === 'tSTypeAliasDeclaration' ||
    node.type === 'tSEnumDeclaration';

/** 宣言 (export const a = 1, b = 2 / export function f / export class C) の名前 */
const declaredNames = (declaration: LwcConvertNode, context: LwcJsonContext): string[] => {
    switch (declaration.type) {
        case 'variableDeclaration':
            return declaration.declarations.flatMap((d) =>
                d.type === 'variableDeclarator' ? [nameOf(d.id, context)] : [],
            );
        case 'functionDeclaration':
        case 'classDeclaration':
            return declaration.id && !isErrorNode(declaration.id) ? [declaration.id.name] : [];
        default:
            return [];
    }
};

/** 式の中で使っている import (識別子が import の名前のもの) */
const referencesIn = (node: LwcConvertNode, tables: LwcImportTables): LwcImportReferenceJson[] => {
    const found = new Map<string, LwcImportReferenceJson>();
    walkNodes(node, (child) => {
        if (child.type === 'identifier') {
            const reference = tables.imports.get(child.name);
            if (reference) found.set(child.name, reference);
        }
    });
    return [...found.values()];
};

/** 関数 (function / アロー関数) なら、引数・戻り値の型・async と本体。関数でなければ null */
const functionPartsOf = (
    node: LwcConvertNode | null,
    tables: LwcImportTables,
    context: LwcJsonContext,
) => {
    if (
        !node ||
        (node.type !== 'functionDeclaration' &&
            node.type !== 'functionExpression' &&
            node.type !== 'arrowFunctionExpression')
    ) {
        return null;
    }
    return {
        param: (node.params as LwcConvertNode[]).map((p) =>
            makeLwcParameterJson(p, tables, context),
        ),
        ...(node.returnType ? { returnType: makeLwcTypeJson(node.returnType, context) } : {}),
        async: node.async === true,
        ...makeLwcBodyContentJson(node.body as LwcConvertNode, tables, context),
    };
};

/** 宣言はノード自身だけを検査する (Apex の DECLARATION_OPTIONS と同じ) */
const DECLARATION_OPTIONS = { exclude: 'children', record: { name: 'id' } } as const;

/** モジュールの直下の宣言 → lwcDeclaration (変数は宣言子ごとに 1 つ) */
const makeDeclarationsJson = (
    declaration: LwcConvertNode,
    exported: boolean,
    tables: LwcImportTables,
    context: LwcJsonContext,
): (LwcDeclarationJson | ErrorJson)[] => {
    const nameJson = (id: LwcConvertNode | null | undefined): string | ErrorJson =>
        !id
            ? ''
            : isErrorNode(id)
              ? makeLwcErrorJson(id, ERROR_KIND, context)
              : nameOf(id, context);

    if (declaration.type === 'variableDeclaration') {
        return (declaration.declarations as LwcConvertNode[]).map((declarator) =>
            convertLwcValue(
                declarator,
                'lwcDeclaration',
                context,
                (node, sourceKeys): LwcDeclarationJson => {
                    const d = node as Extract<LwcConvertNode, { type: 'variableDeclarator' }>;
                    const init = (d.init as LwcConvertNode | null) ?? null;
                    const fn = functionPartsOf(init, tables, context);
                    return makeStructureJson('lwcDeclaration', sourceKeys, {
                        name: nameJson(d.id as LwcConvertNode),
                        declarationType: fn ? ('function' as const) : ('variable' as const),
                        exported,
                        variableKind: declaration.kind,
                        ...(init ? { init: context.textOf(init) } : {}),
                        references: init ? referencesIn(init, tables) : [],
                        ...(fn ?? makeLwcBodyContentJson(init, tables, context)),
                    });
                },
                DECLARATION_OPTIONS,
            ),
        );
    }
    if (declaration.type === 'functionDeclaration' || declaration.type === 'classDeclaration') {
        const isFunction = declaration.type === 'functionDeclaration';
        return [
            convertLwcValue(
                declaration,
                'lwcDeclaration',
                context,
                (node, sourceKeys): LwcDeclarationJson =>
                    makeStructureJson('lwcDeclaration', sourceKeys, {
                        name: nameJson(node.id as LwcConvertNode | null),
                        declarationType: isFunction ? ('function' as const) : ('class' as const),
                        exported,
                        references: [],
                        ...(isFunction
                            ? functionPartsOf(node, tables, context)!
                            : { calls: [], events: [] }),
                    }),
                DECLARATION_OPTIONS,
            ),
        ];
    }
    return [];
};

/** File → モジュールの JSON */
export const makeLwcModuleJson = (
    file: LwcFileType,
    fileType: 'js' | 'ts',
    context: LwcJsonContext,
): LwcModuleJson | ErrorJson => {
    const program = file.program;
    if (isErrorNode(program)) {
        return makeLwcErrorJson(program, ERROR_KIND, context);
    }

    const errors: ErrorJson[] = [];
    const imports: (LwcImportJson | ErrorJson)[] = [];
    const otherExports: string[] = [];
    const typeDeclarations: (LwcTypeDeclarationJson | ErrorJson)[] = [];
    const classes = new Map<string, LwcConvertNode>();
    // モジュールの直下の宣言。import をすべて読んでから JSON にする
    const declarationNodes: { node: LwcConvertNode; exported: boolean }[] = [];
    let componentClass: LwcConvertNode | null = null;
    let defaultName: string | null = null;

    for (const statement of program.body as LwcConvertNode[]) {
        switch (statement.type) {
            case 'error':
                errors.push(makeLwcErrorJson(statement, ERROR_KIND, context));
                break;
            case 'importDeclaration':
                imports.push(makeLwcImportJson(statement, context));
                break;
            case 'classDeclaration':
                if (statement.id && !isErrorNode(statement.id)) {
                    classes.set(statement.id.name, statement);
                }
                declarationNodes.push({ node: statement, exported: false });
                break;
            case 'variableDeclaration':
            case 'functionDeclaration':
                declarationNodes.push({ node: statement, exported: false });
                break;
            case 'exportDefaultDeclaration': {
                const declaration = statement.declaration;
                if (isErrorNode(declaration)) {
                    errors.push(makeLwcErrorJson(declaration, ERROR_KIND, context));
                } else if (
                    declaration.type === 'classDeclaration' ||
                    declaration.type === 'classExpression'
                ) {
                    componentClass = declaration;
                } else if (declaration.type === 'identifier') {
                    // class A {} ... export default A;
                    defaultName = declaration.name;
                }
                break;
            }
            case 'exportNamedDeclaration': {
                const declaration = statement.declaration;
                if (declaration && isErrorNode(declaration)) {
                    errors.push(makeLwcErrorJson(declaration, ERROR_KIND, context));
                } else if (declaration && isTypeDeclaration(declaration)) {
                    typeDeclarations.push(makeLwcTypeDeclarationJson(declaration, true, context));
                } else if (declaration) {
                    otherExports.push(...declaredNames(declaration, context));
                    declarationNodes.push({ node: declaration, exported: true });
                }
                for (const specifier of statement.specifiers) {
                    // export type { A } の型は otherExports に入れない
                    if (
                        specifier.type !== 'exportSpecifier' &&
                        specifier.type !== 'exportNamespaceSpecifier'
                    )
                        continue;
                    if (statement.exportKind === 'type') continue;
                    if (specifier.type === 'exportSpecifier' && specifier.exportKind === 'type')
                        continue;
                    otherExports.push(nameOf(specifier.exported, context));
                }
                break;
            }
            default:
                if (isTypeDeclaration(statement)) {
                    typeDeclarations.push(makeLwcTypeDeclarationJson(statement, false, context));
                }
        }
    }

    const component = componentClass ?? (defaultName ? (classes.get(defaultName) ?? null) : null);
    const tables = makeLwcImportTables(imports);
    const declarations = declarationNodes
        .filter(({ node }) => node !== component)
        .flatMap(({ node, exported }) => makeDeclarationsJson(node, exported, tables, context));
    return {
        fileType,
        imports,
        ...(component &&
        (component.type === 'classDeclaration' || component.type === 'classExpression')
            ? { component: makeLwcComponentJson(component, imports, context) }
            : {}),
        otherExports,
        declarations,
        ...(fileType === 'ts' ? { typeDeclarations } : {}),
        errors,
    };
};
