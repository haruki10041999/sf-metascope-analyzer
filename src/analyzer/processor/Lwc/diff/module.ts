import type {
    ErrorJson,
    LwcComponentJson,
    LwcDeclarationJson,
    LwcImportJson,
    LwcImportSpecifierJson,
    LwcModuleJson,
    LwcTypeDeclarationJson,
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
    makeSetDiff,
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
    LwcParametersDiff,
    LwcTypeDiff,
    makeLwcBodyContentDiff,
    makeLwcComponentDiff,
    makeLwcParametersDiff,
    makeOptionalValueDiff,
} from './component';

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
    before: LwcImportSpecifierJson | ErrorJson,
    after: LwcImportSpecifierJson | ErrorJson,
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
    before: LwcImportJson | ErrorJson,
    after: LwcImportJson | ErrorJson,
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
export const getLwcImportKey = (item: LwcImportJson | ErrorJson): string | undefined =>
    item.kind === 'error' ? undefined : `${item.typeOnly ? 'type ' : ''}${item.source}`;

// ---------------------------------------------------------------------------
// モジュールの直下の宣言
// ---------------------------------------------------------------------------

export type LwcDeclarationJsonDiff = NodeDiff<
    'lwcDeclaration',
    LwcDeclarationJson,
    LwcBodyContentDiff & {
        name: ValueDiff<string | ErrorJson>;
        declarationType: ValueDiff<LwcDeclarationJson['declarationType']>;
        exported: ValueDiff<boolean>;
        variableKind?: OptionalValueDiff<string>;
        init?: OptionalValueDiff<string>;
        references: TypedListDiff<LwcDeclarationJson['references'][number], never>;
        param?: PresentDiff<NonNullable<LwcDeclarationJson['param']>, LwcParametersDiff>;
        returnType?: LwcTypeDiff;
        async?: OptionalValueDiff<boolean>;
    }
>;

const makeDeclarationDiff = (
    before: LwcDeclarationJson | ErrorJson,
    after: LwcDeclarationJson | ErrorJson,
    match: Match,
    sources?: Sources,
): LwcDeclarationJsonDiff =>
    makeNodeDiff('lwcDeclaration', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        declarationType: makeValueDiff(b.declarationType, a.declarationType),
        exported: makeValueDiff(b.exported, a.exported),
        ...presentEntry('variableKind', makeOptionalValueDiff(b.variableKind, a.variableKind)),
        ...presentEntry('init', makeOptionalValueDiff(b.init, a.init)),
        references: makeUnorderedValuesDiff(b.references, a.references),
        ...presentEntry(
            'param',
            makePresentDiff(b.param, a.param, (x, y) => makeLwcParametersDiff(x, y, sources)),
        ),
        ...presentEntry('returnType', makeOptionalValueDiff(b.returnType, a.returnType)),
        ...presentEntry('async', makeOptionalValueDiff(b.async, a.async)),
        ...makeLwcBodyContentDiff(b, a, sources),
    }));

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
    before: LwcTypeDeclarationJson | ErrorJson,
    after: LwcTypeDeclarationJson | ErrorJson,
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

const byName = (node: { name: string | ErrorJson } | ErrorJson): string | undefined =>
    'name' in node && typeof node.name === 'string' ? node.name : undefined;

type ImportJson = LwcImportJson | ErrorJson;
type DeclarationJson = LwcDeclarationJson | ErrorJson;
type TypeDeclarationJson = LwcTypeDeclarationJson | ErrorJson;

/**
 * モジュールは kind を持たない入れ物なので TypedObjectDiff。
 * import・宣言は名前で D. キー対応、export 名は B. 集合、IR を作れなかった文 (errors) は B. 集合
 */
export type LwcModuleJsonDiff = TypedObjectDiff<
    LwcModuleJson,
    {
        fileType: ValueDiff<LwcModuleJson['fileType']>;
        imports: ListItemDiff<'lwcImport', ImportJson, LwcImportJsonDiff>[];
        component?: PresentDiff<LwcComponentJson | ErrorJson, LwcComponentJsonDiff>;
        otherExports: TypedListDiff<string, never>;
        declarations: ListItemDiff<'lwcDeclaration', DeclarationJson, LwcDeclarationJsonDiff>[];
        typeDeclarations?: PresentDiff<
            TypeDeclarationJson[],
            ListItemDiff<'lwcTypeDeclaration', TypeDeclarationJson, LwcTypeDeclarationJsonDiff>[]
        >;
        errors: ListItemDiff<'error', ErrorJson, never>[];
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
        otherExports: makeUnorderedValuesDiff(b.otherExports, a.otherExports),
        declarations: makeKeyedDiff(
            'lwcDeclaration',
            b.declarations,
            a.declarations,
            (x, y, m) => makeDeclarationDiff(x, y, m, sources),
            byName,
            sources,
        ),
        ...presentEntry(
            'typeDeclarations',
            makePresentDiff(b.typeDeclarations, a.typeDeclarations, (x, y) =>
                makeKeyedDiff('lwcTypeDeclaration', x, y, makeTypeDeclarationDiff, byName, sources),
            ),
        ),
        errors: makeSetDiff('error', b.errors, a.errors, () => undefined as never, sources),
    }));
