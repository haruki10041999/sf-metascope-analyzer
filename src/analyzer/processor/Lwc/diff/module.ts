import type {
    LwcClassJson,
    LwcComponentJson,
    LwcDeclarationJson,
    LwcExportJson,
    LwcImportJson,
    LwcImportSpecifierJson,
    LwcJsExpressionJson,
    LwcJsStatementJson,
    LwcModuleDeclarationJson,
    LwcModuleJson,
    LwcTypeDeclarationJson,
    LwcTypeJson,
    LwcTypeMemberJson,
} from '../../../types';

import {
    ListItemDiff,
    Match,
    NodeDiff,
    Sources,
    ValueDiff,
    getValueKey,
    makeKeyedDiff,
    makeNodeDiff,
    makeValueDiff,
    pairByKey,
} from '../../commons/diff/commons';
import {
    TypedListDiff,
    TypedObjectDiff,
    makeTypedListDiff,
    makeTypedObjectDiff,
} from '../../commons/diff/list';
import {
    PresentDiff,
    makeOrderedValuesDiff,
    makePresentDiff,
    makeUnorderedValuesDiff,
    presentEntry,
} from '../../commons/diff/present';
import {
    LwcBodyContentDiff,
    LwcComponentJsonDiff,
    LwcMembersDiff,
    LwcParametersDiff,
    LwcTypeDiff,
    makeLwcBodyContentDiff,
    makeLwcComponentDiff,
    makeLwcMembersDiff,
    makeLwcParametersDiff,
    makeOptionalValueDiff,
} from './component';
import { LwcBlockDiff, makeLwcBlockDiff } from './gumtree/tree';

// LWC のモジュール (1 つの JS / TS) の差分。方針: docs/lwc-implementation.md

type OptionalValueDiff<T> = PresentDiff<T, ValueDiff<T>>;

// ---------------------------------------------------------------------------
// import
// ---------------------------------------------------------------------------

export type LwcImportSpecifierJsonDiff = NodeDiff<
    'lwcImportSpecifier',
    LwcImportSpecifierJson,
    {
        specifierType: ValueDiff<LwcImportSpecifierJson['specifierType']>;
        local: ValueDiff<string>;
        imported?: OptionalValueDiff<string>;
        typeOnly: ValueDiff<boolean>;
    }
>;

const makeSpecifierDiff = (
    before: LwcImportSpecifierJson,
    after: LwcImportSpecifierJson,
    match: Match,
): LwcImportSpecifierJsonDiff =>
    makeNodeDiff('lwcImportSpecifier', before, after, match, (b, a) => ({
        specifierType: makeValueDiff(b.specifierType, a.specifierType),
        local: makeValueDiff(b.local, a.local),
        ...presentEntry('imported', makeOptionalValueDiff(b.imported, a.imported)),
        typeOnly: makeValueDiff(b.typeOnly, a.typeOnly),
    }));

export type LwcImportJsonDiff = NodeDiff<
    'lwcImport',
    LwcImportJson,
    {
        source: ValueDiff<string>;
        category: ValueDiff<LwcImportJson['category']>;
        /** D. キー対応 (モジュールの中の名前 local) */
        specifiers: ListItemDiff<
            'lwcImportSpecifier',
            LwcImportSpecifierJson,
            LwcImportSpecifierJsonDiff
        >[];
        typeOnly: ValueDiff<boolean>;
        apex?: OptionalValueDiff<NonNullable<LwcImportJson['apex']>>;
        schema?: OptionalValueDiff<NonNullable<LwcImportJson['schema']>>;
        component?: OptionalValueDiff<string>;
    }
>;

const makeImportDiff = (
    before: LwcImportJson,
    after: LwcImportJson,
    match: Match,
    sources?: Sources,
): LwcImportJsonDiff =>
    makeNodeDiff('lwcImport', before, after, match, (b, a) => ({
        source: makeValueDiff(b.source, a.source),
        category: makeValueDiff(b.category, a.category),
        specifiers: makeKeyedDiff(
            'lwcImportSpecifier',
            b.specifiers,
            a.specifiers,
            makeSpecifierDiff,
            (specifier) => specifier.local,
            sources,
        ),
        typeOnly: makeValueDiff(b.typeOnly, a.typeOnly),
        ...presentEntry('apex', makeOptionalValueDiff(b.apex, a.apex)),
        ...presentEntry('schema', makeOptionalValueDiff(b.schema, a.schema)),
        ...presentEntry('component', makeOptionalValueDiff(b.component, a.component)),
    }));

/** import 文の識別キー。同じ import 元を値と型で 2 回 import できるので typeOnly も含める */
export const getLwcImportKey = (item: LwcImportJson): string =>
    `${item.typeOnly ? 'type ' : ''}${item.source}`;

// ---------------------------------------------------------------------------
// モジュールの直下の宣言
// ---------------------------------------------------------------------------

export type LwcDeclarationJsonDiff = NodeDiff<
    'lwcDeclaration',
    LwcDeclarationJson,
    LwcBodyContentDiff & {
        name: ValueDiff<string>;
        declarationType: ValueDiff<LwcDeclarationJson['declarationType']>;
        exported: ValueDiff<boolean>;
        variableKind?: OptionalValueDiff<string>;
        variantType?: LwcTypeDiff;
        /** 初期値の式は値として比べる */
        init?: OptionalValueDiff<LwcJsExpressionJson>;
        arrow?: OptionalValueDiff<boolean>;
        param?: PresentDiff<NonNullable<LwcDeclarationJson['param']>, LwcParametersDiff>;
        returnType?: LwcTypeDiff;
        async?: OptionalValueDiff<boolean>;
        generator?: OptionalValueDiff<boolean>;
        functionName?: OptionalValueDiff<string>;
        expression?: OptionalValueDiff<LwcJsExpressionJson>;
    }
>;

const makeDeclarationDiff = (
    before: LwcDeclarationJson,
    after: LwcDeclarationJson,
    match: Match,
    sources?: Sources,
): LwcDeclarationJsonDiff =>
    makeNodeDiff('lwcDeclaration', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        declarationType: makeValueDiff(b.declarationType, a.declarationType),
        exported: makeValueDiff(b.exported, a.exported),
        ...presentEntry('variableKind', makeOptionalValueDiff(b.variableKind, a.variableKind)),
        ...presentEntry('variantType', makeOptionalValueDiff(b.variantType, a.variantType)),
        ...presentEntry('init', makeOptionalValueDiff(b.init, a.init)),
        ...presentEntry('arrow', makeOptionalValueDiff(b.arrow, a.arrow)),
        // references は本体の中身の差分 (makeLwcBodyContentDiff) に入る
        ...presentEntry(
            'param',
            makePresentDiff(b.param, a.param, (x, y) => makeLwcParametersDiff(x, y, sources)),
        ),
        ...presentEntry('returnType', makeOptionalValueDiff(b.returnType, a.returnType)),
        ...presentEntry('async', makeOptionalValueDiff(b.async, a.async)),
        ...presentEntry('generator', makeOptionalValueDiff(b.generator, a.generator)),
        ...presentEntry('functionName', makeOptionalValueDiff(b.functionName, a.functionName)),
        ...presentEntry('expression', makeOptionalValueDiff(b.expression, a.expression)),
        ...makeLwcBodyContentDiff(b, a, sources),
    }));

export type LwcClassJsonDiff = NodeDiff<
    'lwcClass',
    LwcClassJson,
    {
        name: ValueDiff<string>;
        exported: ValueDiff<boolean>;
        /** extends の式は値として比べる */
        superClass?: OptionalValueDiff<LwcJsExpressionJson>;
        /** B. 集合 */
        implement?: PresentDiff<LwcTypeJson[], TypedListDiff<LwcTypeJson, never>>;
        /** D. キー対応 (メンバー名)。コンポーネントの block と同じ */
        block: LwcMembersDiff;
    }
>;

const makeClassDiff = (
    before: LwcClassJson,
    after: LwcClassJson,
    match: Match,
    sources?: Sources,
): LwcClassJsonDiff =>
    makeNodeDiff('lwcClass', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        exported: makeValueDiff(b.exported, a.exported),
        ...presentEntry('superClass', makeOptionalValueDiff(b.superClass, a.superClass)),
        ...presentEntry(
            'implement',
            makePresentDiff(b.implement, a.implement, makeUnorderedValuesDiff),
        ),
        block: makeLwcMembersDiff(b.block, a.block, sources),
    }));

export type LwcModuleDeclarationJsonDiff = LwcDeclarationJsonDiff | LwcClassJsonDiff;

/** 宣言 1 組の差分。同じ名前で種類が変わった (変数 → クラス) ものは、値を丸ごと before / after に入れる */
const makeModuleDeclarationDiff = (
    before: LwcModuleDeclarationJson,
    after: LwcModuleDeclarationJson,
    match: Match,
    sources?: Sources,
): LwcModuleDeclarationJsonDiff =>
    before.kind === 'lwcClass'
        ? makeClassDiff(before, after as LwcClassJson, match, sources)
        : makeDeclarationDiff(before, after as LwcDeclarationJson, match, sources);

// ---------------------------------------------------------------------------
// export
// ---------------------------------------------------------------------------

export type LwcExportJsonDiff = NodeDiff<
    'lwcExport',
    LwcExportJson,
    {
        exportType: ValueDiff<LwcExportJson['exportType']>;
        local?: OptionalValueDiff<string>;
        exported?: OptionalValueDiff<string>;
        source?: OptionalValueDiff<string>;
        typeOnly: ValueDiff<boolean>;
    }
>;

const makeExportDiff = (
    before: LwcExportJson,
    after: LwcExportJson,
    match: Match,
): LwcExportJsonDiff =>
    makeNodeDiff('lwcExport', before, after, match, (b, a) => ({
        exportType: makeValueDiff(b.exportType, a.exportType),
        ...presentEntry('local', makeOptionalValueDiff(b.local, a.local)),
        ...presentEntry('exported', makeOptionalValueDiff(b.exported, a.exported)),
        ...presentEntry('source', makeOptionalValueDiff(b.source, a.source)),
        typeOnly: makeValueDiff(b.typeOnly, a.typeOnly),
    }));

/**
 * export の識別キー。外から見える名前 (exported) で決まる。export * from 'x' は名前がないので import 元で決める
 * (export { a as b } の a を変えたものは、同じ b の changed になる)
 */
export const getLwcExportKey = (item: LwcExportJson): string =>
    item.exported !== undefined ? `name:${item.exported}` : `all:${item.source ?? ''}`;

// ---------------------------------------------------------------------------
// interface / type / enum
// ---------------------------------------------------------------------------

/** interface のメンバー (kind を持たない) は名前で対応付け、型ごと値として比べる */
export type LwcTypeMembersDiff = TypedListDiff<LwcTypeMemberJson, ValueDiff<LwcTypeMemberJson>>;

const makeTypeMembersDiff = (
    before: LwcTypeMemberJson[],
    after: LwcTypeMemberJson[],
): LwcTypeMembersDiff =>
    makeTypedListDiff(
        before,
        after,
        pairByKey(
            before.map((m) => m.name),
            after.map((m) => m.name),
            before.map(getValueKey),
            after.map(getValueKey),
        ),
        makeValueDiff,
    );

export type LwcTypeDeclarationJsonDiff = NodeDiff<
    'lwcTypeDeclaration',
    LwcTypeDeclarationJson,
    {
        name: ValueDiff<string>;
        declarationType: ValueDiff<LwcTypeDeclarationJson['declarationType']>;
        exported: ValueDiff<boolean>;
        /** B. 集合 */
        extend?: PresentDiff<string[], TypedListDiff<string, never>>;
        /** D. キー対応 (メンバー名) */
        members?: PresentDiff<LwcTypeMemberJson[], LwcTypeMembersDiff>;
        variantType?: LwcTypeDiff;
        /** C. 順序付き列 (enum の値は並び順で決まる) */
        enumMembers?: PresentDiff<string[], TypedListDiff<string, ValueDiff<string>>>;
    }
>;

const makeTypeDeclarationDiff = (
    before: LwcTypeDeclarationJson,
    after: LwcTypeDeclarationJson,
    match: Match,
): LwcTypeDeclarationJsonDiff =>
    makeNodeDiff('lwcTypeDeclaration', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        declarationType: makeValueDiff(b.declarationType, a.declarationType),
        exported: makeValueDiff(b.exported, a.exported),
        ...presentEntry('extend', makePresentDiff(b.extend, a.extend, makeUnorderedValuesDiff)),
        ...presentEntry('members', makePresentDiff(b.members, a.members, makeTypeMembersDiff)),
        ...presentEntry('variantType', makeOptionalValueDiff(b.variantType, a.variantType)),
        ...presentEntry(
            'enumMembers',
            makePresentDiff(b.enumMembers, a.enumMembers, makeOrderedValuesDiff),
        ),
    }));

// ---------------------------------------------------------------------------
// モジュール
// ---------------------------------------------------------------------------

const byName = (node: { name: string }): string => node.name;

/**
 * モジュールは kind を持たない入れ物なので TypedObjectDiff。
 * import・宣言・export は名前で D. キー対応、直下の文は本体と同じく GumTree
 */
export type LwcModuleJsonDiff = TypedObjectDiff<
    LwcModuleJson,
    {
        fileType: ValueDiff<LwcModuleJson['fileType']>;
        imports: ListItemDiff<'lwcImport', LwcImportJson, LwcImportJsonDiff>[];
        component?: PresentDiff<LwcComponentJson, LwcComponentJsonDiff>;
        exports: ListItemDiff<'lwcExport', LwcExportJson, LwcExportJsonDiff>[];
        declarations: ListItemDiff<
            'lwcDeclaration',
            LwcModuleDeclarationJson,
            LwcModuleDeclarationJsonDiff
        >[];
        typeDeclarations?: PresentDiff<
            LwcTypeDeclarationJson[],
            ListItemDiff<'lwcTypeDeclaration', LwcTypeDeclarationJson, LwcTypeDeclarationJsonDiff>[]
        >;
        statements?: PresentDiff<LwcJsStatementJson[], LwcBlockDiff>;
    }
>;

export const makeLwcModuleDiff = (
    before: LwcModuleJson,
    after: LwcModuleJson,
    sources?: Sources,
): LwcModuleJsonDiff =>
    makeTypedObjectDiff(before, after, (b, a) => ({
        fileType: makeValueDiff(b.fileType, a.fileType),
        imports: makeKeyedDiff(
            'lwcImport',
            b.imports,
            a.imports,
            (x, y, m) => makeImportDiff(x, y, m, sources),
            getLwcImportKey,
            sources,
        ),
        ...presentEntry(
            'component',
            makePresentDiff(b.component, a.component, (x, y) =>
                makeLwcComponentDiff(x, y, 'slot', sources),
            ),
        ),
        exports: makeKeyedDiff(
            'lwcExport',
            b.exports,
            a.exports,
            makeExportDiff,
            getLwcExportKey,
            sources,
        ),
        declarations: makeKeyedDiff(
            'lwcDeclaration',
            b.declarations,
            a.declarations,
            (x, y, m) => makeModuleDeclarationDiff(x, y, m, sources),
            byName,
            sources,
        ),
        ...presentEntry(
            'typeDeclarations',
            makePresentDiff(b.typeDeclarations, a.typeDeclarations, (x, y) =>
                makeKeyedDiff('lwcTypeDeclaration', x, y, makeTypeDeclarationDiff, byName, sources),
            ),
        ),
        ...presentEntry(
            'statements',
            makePresentDiff(b.statements, a.statements, (x, y) => makeLwcBlockDiff(x, y, sources)),
        ),
    }));
