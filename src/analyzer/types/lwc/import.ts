// import の JSON (docs/lwc-json-reference.md)。LWC だけのもの
import { makeJsonType, type ErrorJson, type JsonType } from '../commons/json';

import { nameOf, type LwcJsonContext, convertLwcValue } from './commons';
import type {
    LwcImportDeclarationType,
    LwcImportDefaultSpecifierType,
    LwcImportNamespaceSpecifierType,
    LwcImportSpecifierType,
} from './converter';

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
        LwcImportSpecifierType | LwcImportDefaultSpecifierType | LwcImportNamespaceSpecifierType,
    context: LwcJsonContext,
): LwcImportSpecifierJson => {
    const local = nameOf(specifier.local, context);
    if (specifier.type === 'importSpecifier') {
        return makeJsonType<'lwcImportSpecifier', LwcImportSpecifierJson>(
            'lwcImportSpecifier',
            context.keysOf(specifier),
            {
                specifierType: 'named',
                local,
                imported: nameOf(specifier.imported, context),
                typeOnly: specifier.importKind === 'type',
            },
        );
    }
    return makeJsonType<'lwcImportSpecifier', LwcImportSpecifierJson>(
        'lwcImportSpecifier',
        context.keysOf(specifier),
        {
            specifierType: specifier.type === 'importDefaultSpecifier' ? 'default' : 'namespace',
            local,
            typeOnly: false,
        },
    );
};

/** ImportDeclaration → lwcImport。境界ノードで、部分木に IR を作れなかったノードがあれば ErrorJson */
export const makeLwcImportJson = (
    target: LwcImportDeclarationType,
    context: LwcJsonContext,
): LwcImportJson | ErrorJson =>
    convertLwcValue(
        target,
        'lwcImport',
        context,
        (declaration: LwcImportDeclarationType, targetRecords) => {
            const source = nameOf(declaration.source, context);
            const category = getImportCategory(source);
            return makeJsonType<'lwcImport', LwcImportJson>('lwcImport', targetRecords.base, {
                source,
                category,
                // 検査を通っているので、IR を作れなかったノードはない
                specifiers: declaration.specifiers.flatMap((s) =>
                    s.type === 'error' ? [] : [makeSpecifierJson(s, context)],
                ),
                typeOnly: declaration.importKind === 'type',
                ...makeDetail(source, category),
            });
        },
    );
