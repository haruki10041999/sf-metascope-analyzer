// import の JSON (docs/lwc-implementation.md)。LWC だけのもの。
// 入力は IR v2 (lwc_IR) のノード。v2 の木にはエラーのノードがないので、部分木の検査はしない
import { makeJsonType, type JsonType } from '../commons/json';
import type { commons } from '../lwc_IR';

import { nameOf, type LwcJsonContext } from './commons';

export type LwcImportCategory =
    | 'lwc'
    | 'apex'
    | 'schema'
    | 'label'
    | 'customPermission'
    | 'resourceUrl'
    | 'contentAssetUrl'
    | 'messageChannel'
    | 'user'
    | 'component'
    | 'lightning'
    | 'relative'
    | 'other';

export type LwcImportSpecifierJson = JsonType<'lwcImportSpecifier'> & {
    specifierType: 'default' | 'named' | 'namespace';
    /** このモジュールの中の名前 */
    local: string;
    /** import 元の名前 (named のとき) */
    imported?: string;
    /** import { type A } (TS) */
    typeOnly: boolean;
};

export type LwcImportJson = JsonType<'lwcImport'> & {
    source: string;
    category: LwcImportCategory;
    specifiers: LwcImportSpecifierJson[];
    /** import type { A } (TS)。実行時には残らない */
    typeOnly: boolean;
    /** @salesforce/apex/<クラス>.<メソッド> */
    apex?: { className: string; methodName: string };
    /** @salesforce/schema/<オブジェクト>[.<項目>] */
    schema?: { objectApiName: string; fieldApiName?: string };
    /** c/<名前> */
    component?: string;
};

const SALESFORCE_CATEGORIES: [string, LwcImportCategory][] = [
    ['@salesforce/apex/', 'apex'],
    ['@salesforce/apexContinuation/', 'apex'],
    ['@salesforce/schema/', 'schema'],
    ['@salesforce/label/', 'label'],
    ['@salesforce/customPermission/', 'customPermission'],
    ['@salesforce/resourceUrl/', 'resourceUrl'],
    ['@salesforce/contentAssetUrl/', 'contentAssetUrl'],
    ['@salesforce/messageChannel/', 'messageChannel'],
    ['@salesforce/user/', 'user'],
];

export const getImportCategory = (source: string): LwcImportCategory => {
    if (source === 'lwc') return 'lwc';
    const salesforce = SALESFORCE_CATEGORIES.find(([prefix]) => source.startsWith(prefix));
    if (salesforce) return salesforce[1];
    if (source.startsWith('c/')) return 'component';
    if (source.startsWith('lightning/')) return 'lightning';
    if (source.startsWith('./') || source.startsWith('../')) return 'relative';
    return 'other';
};

/** category に応じた分解 (apex / schema / component) */
const makeDetail = (
    source: string,
    category: LwcImportCategory,
): Pick<LwcImportJson, 'apex' | 'schema' | 'component'> => {
    if (category === 'apex') {
        const path = source.slice(source.indexOf('/', '@salesforce/'.length) + 1);
        const dot = path.lastIndexOf('.');
        return dot > 0
            ? { apex: { className: path.slice(0, dot), methodName: path.slice(dot + 1) } }
            : {};
    }
    if (category === 'schema') {
        const [objectApiName, ...field] = source.slice('@salesforce/schema/'.length).split('.');
        return objectApiName
            ? {
                  schema: {
                      objectApiName,
                      ...(field.length > 0 ? { fieldApiName: field.join('.') } : {}),
                  },
              }
            : {};
    }
    return category === 'component' ? { component: source } : {};
};

const makeSpecifierJson = (
    specifier:
        | commons.ImportSpecifierTypeClass
        | commons.ImportDefaultSpecifierTypeClass
        | commons.ImportNamespaceSpecifierTypeClass,
    context: LwcJsonContext,
): LwcImportSpecifierJson => {
    const local = nameOf(specifier.getFields().local, context);
    if (specifier.kind === 'importSpecifier') {
        const fields = (specifier as commons.ImportSpecifierTypeClass).getFields();
        return makeJsonType<'lwcImportSpecifier', LwcImportSpecifierJson>(
            'lwcImportSpecifier',
            context.keysOf(specifier),
            {
                specifierType: 'named',
                local,
                imported: nameOf(fields.imported, context),
                typeOnly: fields.importKind === 'type',
            },
        );
    }
    return makeJsonType<'lwcImportSpecifier', LwcImportSpecifierJson>(
        'lwcImportSpecifier',
        context.keysOf(specifier),
        {
            specifierType: specifier.kind === 'importDefaultSpecifier' ? 'default' : 'namespace',
            local,
            typeOnly: false,
        },
    );
};

/** import の specifier を、ソースの順 (default → named / namespace) に並べたもの */
const specifiersOf = (
    fields: commons.ImportDeclarationFields,
): (
    | commons.ImportSpecifierTypeClass
    | commons.ImportDefaultSpecifierTypeClass
    | commons.ImportNamespaceSpecifierTypeClass
)[] => {
    const bindings = fields.bindings;
    return [
        ...(fields.default ? [fields.default] : []),
        ...(!bindings
            ? []
            : bindings.kind === 'named'
              ? bindings.specifiers
              : [bindings.specifier]),
    ];
};

/** ImportDeclaration → lwcImport (境界ノード) */
export const makeLwcImportJson = (
    declaration: commons.ImportDeclarationTypeClass,
    context: LwcJsonContext,
): LwcImportJson => {
    const sourceKeys = context.keysOf(declaration);
    const fields = declaration.getFields();
    const source = nameOf(fields.source, context);
    const category = getImportCategory(source);
    return makeJsonType<'lwcImport', LwcImportJson>('lwcImport', sourceKeys, {
        source,
        category,
        specifiers: specifiersOf(fields).map((s) => makeSpecifierJson(s, context)),
        typeOnly: fields.importKind === 'type',
        ...makeDetail(source, category),
    });
};
