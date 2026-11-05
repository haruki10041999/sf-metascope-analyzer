// コンポーネント (default export のクラス) の JSON (docs/lwc-parse-plan.md 3.1.6)。
// Apex の types/apex/declaration.ts の class と同じ形にする:
// - 名前を持つ宣言 (コンポーネント・メンバー) は StructureJsonType (sourceKeys: { base, name })、name は string | ErrorJson
// - メンバーはソースの順に block に入れ、IR を作れなかったメンバーはその位置に ErrorJson
// - 宣言はノード自身だけを検査する (exclude: 'children')。field は初期値まで含めて部分木全体を検査する
import { isErrorNode } from '../apex/commons';
import {
    makeJsonType,
    makeStructureJson,
    type ConvertKeys,
    type ErrorJson,
    type JsonType,
    type StructureJsonType,
} from '../commons/json';

import {
    containsErrorNode,
    nameOf,
    unwrapExpression,
    walkNodes,
    type LwcConvertNode,
    type LwcJsonContext,
    makeLwcErrorJson,
    convertLwcValue,
} from './commons';
import type {
    LwcClassAccessorPropertyType,
    LwcClassDeclarationType,
    LwcClassExpressionType,
    LwcClassMethodType,
    LwcClassPrivateMethodType,
    LwcClassPrivatePropertyType,
    LwcClassPropertyType,
    LwcDecoratorType,
} from './converter';
import type { LwcImportJson } from './import';
import { makeLwcTypeJson, type LwcTypeJson } from './type';

const ERROR_KIND = 'lwcComponent';

/** Apex の DECLARATION_OPTIONS と同じ。ノード自身だけを検査し、子は子の変換関数がエラーを処理する */
const DECLARATION_OPTIONS = { exclude: 'children', record: { name: 'key' } } as const;

// ---------------------------------------------------------------------------
// JSON の型
// ---------------------------------------------------------------------------

/** 式の中で使っている import (項目の利用表・Apex の呼び出し表で、import と結び付けるため) */
export type LwcImportReferenceJson = {
    /** このモジュールの中の名前 (NAME_FIELD など) */
    local: string;
    /** import 元 (@salesforce/schema/Account.Name など) */
    source: string;
    apex?: { className: string; methodName: string };
    schema?: { objectApiName: string; fieldApiName?: string };
};

/** @wire(adapter, { key: value }) の設定の 1 項目 */
export type LwcWireConfigJson = JsonType<'lwcWireConfig'> & {
    key: string;
    /** 値の式の文字列 */
    value: string;
    /** '$recordId' のような、プロパティに追従する値 */
    reactive?: string;
    /** 値の中で使っている import (fields: [NAME_FIELD] の NAME_FIELD など) */
    references: LwcImportReferenceJson[];
};

/** デコレーター (Apex の AnnotationJson に当たる) */
export type LwcDecoratorJson = JsonType<'lwcDecorator'> & {
    /** api / track / wire など */
    name: string;
    /** 引数の式の文字列 */
    arg: string[];
    /** @wire のとき */
    wire?: {
        /** アダプターの式の文字列 (getRecord、getAccounts など) */
        adapter: string;
        /** アダプターを import したモジュール (lightning/uiRecordApi、@salesforce/apex/... など) */
        adapterSource?: string;
        /** アダプターが Apex のメソッドのとき (@salesforce/apex/<クラス>.<メソッド>) */
        apex?: { className: string; methodName: string };
        config: LwcWireConfigJson[];
    };
};

/** 修飾子 (Apex の ModifiersJson に当たる。TS の修飾子とデコレーター) */
export type LwcModifiersJson = {
    access?: 'public' | 'private' | 'protected';
    declaration?: ('static' | 'readonly' | 'abstract' | 'override' | 'declare')[];
    decorator?: (LwcDecoratorJson | ErrorJson)[];
};

export type LwcCallJson = JsonType<'lwcCall'> & {
    /**
     * apex: import した Apex のメソッドの呼び出し / navigate: this[NavigationMixin.Navigate] など /
     * querySelector: this.template.querySelector(All) / refs: this.refs.<名前> /
     * dispatchEvent: this.dispatchEvent(...) / innerHTML: innerHTML・outerHTML への代入
     */
    callType: 'apex' | 'navigate' | 'querySelector' | 'refs' | 'dispatchEvent' | 'innerHTML';
    /**
     * apex: import の名前 / navigate: Navigate・GenerateUrl / querySelector: セレクターの式 / refs: 名前 /
     * dispatchEvent: イベントのクラス (CustomEvent / ShowToastEvent) か式 / innerHTML: 代入先の式
     */
    target: string;
    apex?: { className: string; methodName: string };
    /** 引数の式の文字列 (refs・innerHTML はなし) */
    arg: string[];
    /** 引数の中で使っている import */
    references: LwcImportReferenceJson[];
};

/** メソッド・getter / setter・関数の本体。中身はソース位置 (sourceObject) が持つ。本体が変わると objectKey が変わる */
export type LwcBodyJson = JsonType<'lwcBody'> & {
    /** 本体の直下の文の数 */
    statements: number;
};

export type LwcEventJson = JsonType<'lwcEvent'> & {
    /** イベント名 (文字列のリテラルでなければ式の文字列) */
    name: string;
    bubbles?: boolean;
    composed?: boolean;
    /** detail の式の文字列 */
    detail?: string;
    /** TS の CustomEvent<T> の T */
    detailType?: LwcTypeJson | ErrorJson;
};

/** メソッド・getter / setter・関数の本体と、本体から取り出したもの */
export type LwcBodyContentJson = {
    /** 本体 (アロー関数の式の本体のように、ブロックでなければなし) */
    body?: LwcBodyJson;
    calls: LwcCallJson[];
    events: LwcEventJson[];
};

/** 引数 (Apex の ParameterJson に当たる) */
export type LwcParameterJson = JsonType<'lwcParameter'> & {
    variant: string;
    variantType?: LwcTypeJson | ErrorJson;
    optional: boolean;
    /** constructor(private x: T) の修飾子 */
    modifier: LwcModifiersJson;
};

/** クラスのフィールド (class property)。Apex の field に当たる */
export type LwcFieldJson = StructureJsonType<'lwcField', { name: ConvertKeys }> & {
    name: string | ErrorJson;
    variantType?: LwcTypeJson | ErrorJson;
    /** 初期値の式の文字列 */
    init?: string;
    /** 初期値の中で使っている import (@api title = TITLE_LABEL の TITLE_LABEL など) */
    references: LwcImportReferenceJson[];
    optional: boolean;
    modifier: LwcModifiersJson;
};

/** getter / setter の中身 (Apex の AccessorContentJson に当たる) */
export type LwcAccessorContentJson = LwcBodyContentJson & {
    modifier: LwcModifiersJson;
};

/** getter / setter で定義したプロパティ (Apex の property に当たる。同じ名前の getter と setter を 1 つにする) */
export type LwcPropertyJson = StructureJsonType<'lwcProperty', { name: ConvertKeys }> & {
    name: string | ErrorJson;
    /** getter の戻り値の型 (なければ setter の引数の型) */
    variantType?: LwcTypeJson | ErrorJson;
    isGetter: boolean;
    getterContent?: LwcAccessorContentJson;
    isSetter: boolean;
    setterContent?: LwcAccessorContentJson;
};

export type LwcMethodJson = StructureJsonType<'lwcMethod', { name: ConvertKeys }> &
    LwcBodyContentJson & {
        name: string | ErrorJson;
        returnType?: LwcTypeJson | ErrorJson;
        param: (LwcParameterJson | ErrorJson)[];
        async: boolean;
        modifier: LwcModifiersJson;
    };

export type LwcConstructorJson = StructureJsonType<'lwcConstructor', { name: ConvertKeys }> &
    LwcBodyContentJson & {
        name: 'constructor';
        param: (LwcParameterJson | ErrorJson)[];
        modifier: LwcModifiersJson;
    };

export type LwcMemberJson =
    LwcFieldJson | LwcPropertyJson | LwcMethodJson | LwcConstructorJson | ErrorJson;

export type LwcComponentJson = StructureJsonType<'lwcComponent', { name: ConvertKeys }> & {
    /** クラス名 (export default class {} のように名前がなければ null) */
    name: string | ErrorJson | null;
    /** 継承元のクラス (NavigationMixin(LightningElement) なら LightningElement。Apex の extend に当たる) */
    extend?: string | ErrorJson;
    /** ミックスイン (NavigationMixin(LightningElement) なら NavigationMixin) */
    mixins: string[];
    /** TS の implements (Apex の implement に当たる) */
    implement?: (LwcTypeJson | ErrorJson)[];
    /** メンバー (ソースの順) */
    block: LwcMemberJson[];
};

// ---------------------------------------------------------------------------
// 部品
// ---------------------------------------------------------------------------

export type LwcImportTables = {
    /** import の名前 → import 元と、Apex のメソッド・項目 */
    imports: Map<string, LwcImportReferenceJson>;
};

export const makeLwcImportTables = (imports: (LwcImportJson | ErrorJson)[]): LwcImportTables => {
    const tables = new Map<string, LwcImportReferenceJson>();
    for (const item of imports) {
        if (item.kind !== 'lwcImport') continue;
        for (const specifier of item.specifiers) {
            // Apex のメソッド・項目は default import のときだけ
            const isDefault = specifier.specifierType === 'default';
            tables.set(specifier.local, {
                local: specifier.local,
                source: item.source,
                ...(isDefault && item.apex ? { apex: item.apex } : {}),
                ...(isDefault && item.schema ? { schema: item.schema } : {}),
            });
        }
    }
    return { imports: tables };
};

/** 式の中で使っている import (識別子が import の名前のもの。同じ名前は 1 つ) */
const referencesOf = (
    node: LwcConvertNode | null | undefined,
    tables: LwcImportTables,
): LwcImportReferenceJson[] => {
    const references = new Map<string, LwcImportReferenceJson>();
    walkNodes(node, (child) => {
        if (child.type === 'identifier') {
            const reference = tables.imports.get(child.name);
            if (reference) references.set(child.name, reference);
        }
    });
    return [...references.values()];
};

const makeNameJson = (
    member: { key: LwcConvertNode; computed: boolean | null },
    context: LwcJsonContext,
): string | ErrorJson => {
    if (isErrorNode(member.key)) {
        return makeLwcErrorJson(member.key, ERROR_KIND, context);
    }
    return member.computed ? `[${context.textOf(member.key)}]` : nameOf(member.key, context);
};

const makeDecoratorJson = (
    target: LwcDecoratorType | LwcConvertNode,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcDecoratorJson | ErrorJson => {
    if (target.type !== 'decorator' || containsErrorNode(target)) {
        return makeLwcErrorJson(target, ERROR_KIND, context);
    }
    const expression = unwrapExpression(target.expression);
    const isCall = expression.type === 'callExpression';
    const name = nameOf(isCall ? expression.callee : expression, context);
    const args = isCall ? expression.arguments : [];

    let wire: LwcDecoratorJson['wire'];
    if (name === 'wire') {
        const [adapterNode, configNode] = args;
        const adapter = adapterNode ? context.textOf(adapterNode) : '';
        const adapterImport = tables.imports.get(adapter.split('.')[0] ?? '');
        const config: LwcWireConfigJson[] = [];
        const configObject = configNode ? unwrapExpression(configNode) : null;
        if (configObject?.type === 'objectExpression') {
            for (const property of configObject.properties) {
                if (property.type !== 'objectProperty') continue;
                const literal =
                    property.value.type === 'stringLiteral' ? property.value.value : null;
                config.push(
                    makeJsonType<'lwcWireConfig', LwcWireConfigJson>(
                        'lwcWireConfig',
                        context.keysOf(property),
                        {
                            key: nameOf(property.key, context),
                            value: context.textOf(property.value),
                            ...(literal?.startsWith('$') ? { reactive: literal.slice(1) } : {}),
                            references: referencesOf(property.value, tables),
                        },
                    ),
                );
            }
        }
        wire = {
            adapter,
            ...(adapterImport ? { adapterSource: adapterImport.source } : {}),
            ...(adapterImport?.apex ? { apex: adapterImport.apex } : {}),
            config,
        };
    }

    return makeJsonType<'lwcDecorator', LwcDecoratorJson>('lwcDecorator', context.keysOf(target), {
        name,
        arg: args.map((arg) => context.textOf(arg)),
        ...(wire ? { wire } : {}),
    });
};

const DECLARATION_MODIFIERS = ['static', 'readonly', 'abstract', 'override', 'declare'] as const;

const makeModifiersJson = (
    member: {
        accessibility?: string | null;
        decorators?: LwcConvertNode[] | null;
    } & Partial<Record<(typeof DECLARATION_MODIFIERS)[number], boolean | null>>,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcModifiersJson => {
    const access = member.accessibility;
    const declaration = DECLARATION_MODIFIERS.filter((name) => member[name] === true);
    const decorators = member.decorators ?? [];
    return {
        ...(access === 'public' || access === 'private' || access === 'protected'
            ? { access }
            : {}),
        ...(declaration.length > 0 ? { declaration } : {}),
        ...(decorators.length > 0
            ? { decorator: decorators.map((d) => makeDecoratorJson(d, tables, context)) }
            : {}),
    };
};

const makeTypeJsonOrUndefined = (
    node: LwcConvertNode | null | undefined,
    context: LwcJsonContext,
): { variantType?: LwcTypeJson | ErrorJson } =>
    node ? { variantType: makeLwcTypeJson(node, context) } : {};

/** 引数。部分木に IR を作れなかったノードがあれば ErrorJson */
export const makeLwcParameterJson = (
    param: LwcConvertNode,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcParameterJson | ErrorJson => {
    if (containsErrorNode(param)) {
        return makeLwcErrorJson(param, ERROR_KIND, context);
    }
    // constructor(private x: T) / x = 1 / ...rest は中の名前を見る
    const modifier =
        param.type === 'tSParameterProperty' ? makeModifiersJson(param, tables, context) : {};
    let target = param.type === 'tSParameterProperty' ? param.parameter : param;
    const hasDefault = target.type === 'assignmentPattern';
    if (target.type === 'assignmentPattern') target = target.left;
    if (target.type === 'restElement') target = target.argument;

    const annotation =
        'typeAnnotation' in target ? (target.typeAnnotation as LwcConvertNode | null) : null;
    // 分割代入 ({ data, error }: T) の範囲は型注釈を含むので、型注釈の部分を除く
    let variant = target.type === 'identifier' ? target.name : context.textOf(target);
    const annotationText = annotation ? context.textOf(annotation) : '';
    if (target.type !== 'identifier' && annotationText && variant.endsWith(annotationText)) {
        variant = variant.slice(0, -annotationText.length).trimEnd();
    }
    return makeJsonType<'lwcParameter', LwcParameterJson>('lwcParameter', context.keysOf(param), {
        variant,
        ...makeTypeJsonOrUndefined(annotation, context),
        optional: hasDefault || ('optional' in target && target.optional === true),
        modifier,
    });
};

/** this.<名前> の <名前> (this でなければ null) */
const thisMemberName = (node: LwcConvertNode, context: LwcJsonContext): string | null => {
    if (node.type !== 'memberExpression' && node.type !== 'optionalMemberExpression') return null;
    if (unwrapExpression(node.object).type !== 'thisExpression') return null;
    return node.computed ? context.textOf(node.property) : nameOf(node.property, context);
};

/**
 * メソッド・getter / setter・関数の本体。本体 (lwcBody) と、解析に使う呼び出し
 * (Apex・ナビゲーション・querySelector・refs・dispatchEvent・innerHTML への代入) と new CustomEvent を取り出す
 */
export const makeLwcBodyContentJson = (
    body: LwcConvertNode | null,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcBodyContentJson => {
    const calls: LwcCallJson[] = [];
    const events: LwcEventJson[] = [];
    const seenRefs = new Set<string>();
    const call = (
        node: LwcConvertNode,
        properties: Omit<LwcCallJson, 'kind' | 'sourceKeys' | 'arg' | 'references'>,
        args: LwcConvertNode[] = [],
    ) =>
        calls.push(
            makeJsonType<'lwcCall', LwcCallJson>('lwcCall', context.keysOf(node), {
                ...properties,
                arg: args.map((arg) => context.textOf(arg)),
                references: args.flatMap((arg) => referencesOf(arg, tables)),
            }),
        );

    walkNodes(body, (node) => {
        switch (node.type) {
            case 'callExpression':
            case 'optionalCallExpression': {
                const callee = unwrapExpression(node.callee);
                const args = node.arguments as LwcConvertNode[];
                if (callee.type === 'identifier') {
                    const apex = tables.imports.get(callee.name)?.apex;
                    if (apex) call(node, { callType: 'apex', target: callee.name, apex }, args);
                }
                if (
                    callee.type === 'memberExpression' ||
                    callee.type === 'optionalMemberExpression'
                ) {
                    const member = thisMemberName(callee, context);
                    // this[NavigationMixin.Navigate](...) / this[NavigationMixin.GenerateUrl](...)
                    const navigation = member?.match(/^NavigationMixin\.(\w+)$/);
                    if (navigation) {
                        call(node, { callType: 'navigate', target: navigation[1]! }, args);
                    }
                    // this.dispatchEvent(event)
                    if (member === 'dispatchEvent') {
                        // new CustomEvent(...) / new ShowToastEvent(...) ならイベントのクラス、変数ならその式
                        const event = args[0] ? unwrapExpression(args[0]) : null;
                        const target = !event
                            ? ''
                            : event.type === 'newExpression'
                              ? context.textOf(event.callee as LwcConvertNode)
                              : context.textOf(event);
                        call(node, { callType: 'dispatchEvent', target }, args);
                    }
                    // this.template.querySelector(...) / querySelectorAll(...)
                    const method = nameOf(callee.property, context);
                    if (
                        (method === 'querySelector' || method === 'querySelectorAll') &&
                        thisMemberName(unwrapExpression(callee.object), context) === 'template'
                    ) {
                        const [selector] = args;
                        call(
                            node,
                            {
                                callType: 'querySelector',
                                target: selector ? context.textOf(selector) : '',
                            },
                            args,
                        );
                    }
                }
                break;
            }
            case 'assignmentExpression': {
                // element.innerHTML = ... / element.outerHTML = ... (LWC で避けるべき DOM の直接の操作)
                const left = node.left as LwcConvertNode;
                if (
                    (left.type === 'memberExpression' ||
                        left.type === 'optionalMemberExpression') &&
                    !left.computed &&
                    ['innerHTML', 'outerHTML'].includes(nameOf(left.property, context))
                ) {
                    call(node, { callType: 'innerHTML', target: context.textOf(left) });
                }
                break;
            }
            case 'memberExpression':
            case 'optionalMemberExpression': {
                // this.refs.<名前>
                if (thisMemberName(unwrapExpression(node.object), context) === 'refs') {
                    const name = nameOf(node.property, context);
                    if (!seenRefs.has(name)) {
                        seenRefs.add(name);
                        call(node, { callType: 'refs', target: name });
                    }
                }
                break;
            }
            case 'newExpression': {
                // new CustomEvent(名前, { detail, bubbles, composed })
                if (nameOf(unwrapExpression(node.callee), context) !== 'CustomEvent') break;
                const [nameArg, optionsArg] = node.arguments;
                const options: Pick<LwcEventJson, 'bubbles' | 'composed' | 'detail'> = {};
                const optionsObject = optionsArg ? unwrapExpression(optionsArg) : null;
                if (optionsObject?.type === 'objectExpression') {
                    for (const property of optionsObject.properties) {
                        if (property.type !== 'objectProperty') continue;
                        const key = nameOf(property.key, context);
                        if (key === 'detail') options.detail = context.textOf(property.value);
                        if (
                            (key === 'bubbles' || key === 'composed') &&
                            property.value.type === 'booleanLiteral'
                        ) {
                            options[key] = property.value.value;
                        }
                    }
                }
                const typeArguments =
                    node.typeArguments && !isErrorNode(node.typeArguments)
                        ? node.typeArguments
                        : null;
                const detailTypeNode =
                    typeArguments?.type === 'tSTypeParameterInstantiation'
                        ? typeArguments.params[0]
                        : undefined;
                events.push(
                    makeJsonType<'lwcEvent', LwcEventJson>('lwcEvent', context.keysOf(node), {
                        name: nameArg ? nameOf(unwrapExpression(nameArg), context) : '',
                        ...options,
                        ...(detailTypeNode
                            ? { detailType: makeLwcTypeJson(detailTypeNode, context) }
                            : {}),
                    }),
                );
                break;
            }
        }
    });
    // 本体のブロック。中身はソース位置が持ち、本体が変わると objectKey が変わる (Diff で本体の変更が見える)
    const block = body?.type === 'blockStatement' ? body : null;
    return {
        ...(block
            ? {
                  body: makeJsonType<'lwcBody', LwcBodyJson>('lwcBody', context.keysOf(block), {
                      statements: block.body.length,
                  }),
              }
            : {}),
        calls,
        events,
    };
};

// ---------------------------------------------------------------------------
// メンバー
// ---------------------------------------------------------------------------

/** クラスのフィールド。Apex の field と同じく、初期値まで含めて部分木全体を検査する */
const makeFieldJson = (
    target: LwcClassPropertyType | LwcClassPrivatePropertyType | LwcClassAccessorPropertyType,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcFieldJson | ErrorJson =>
    convertLwcValue(
        target as LwcClassPropertyType,
        'lwcField',
        context,
        (field, targetRecords) =>
            makeStructureJson('lwcField', targetRecords, {
                name: makeNameJson(field as unknown as LwcClassPropertyType, context),
                ...makeTypeJsonOrUndefined(field.typeAnnotation as LwcConvertNode | null, context),
                ...(field.value ? { init: context.textOf(field.value as LwcConvertNode) } : {}),
                references: referencesOf(field.value as LwcConvertNode | null, tables),
                optional: field.optional === true,
                modifier: makeModifiersJson(target, tables, context),
            }),
        { record: { name: 'key' } },
    );

const makeMethodJson = (
    target: LwcClassMethodType | LwcClassPrivateMethodType,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcMethodJson | LwcConstructorJson | ErrorJson =>
    convertLwcValue(
        target as LwcClassMethodType,
        'lwcMethod',
        context,
        (method: LwcClassMethodType, targetRecords) => {
            const body = makeLwcBodyContentJson(method.body, tables, context);
            const param = method.params.map((p) => makeLwcParameterJson(p, tables, context));
            const modifier = makeModifiersJson(method, tables, context);
            if (method.kind === 'constructor') {
                return makeStructureJson('lwcConstructor', targetRecords, {
                    name: 'constructor' as const,
                    param,
                    modifier,
                    ...body,
                });
            }
            return makeStructureJson('lwcMethod', targetRecords, {
                name: makeNameJson(method, context),
                ...(method.returnType
                    ? { returnType: makeLwcTypeJson(method.returnType, context) }
                    : {}),
                param,
                async: method.async === true,
                modifier,
                ...body,
            });
        },
        DECLARATION_OPTIONS,
    );

/** getter / setter。同じ名前の getter と setter は 1 つの lwcProperty にまとめる */
const makeAccessorJson = (
    target: LwcClassMethodType | LwcClassPrivateMethodType,
    existing: LwcPropertyJson | undefined,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcPropertyJson | ErrorJson =>
    convertLwcValue(
        target as LwcClassMethodType,
        'lwcProperty',
        context,
        (accessor: LwcClassMethodType, targetRecords) => {
            const isGetter = accessor.kind === 'get';
            const content: LwcAccessorContentJson = {
                modifier: makeModifiersJson(accessor, tables, context),
                ...makeLwcBodyContentJson(accessor.body, tables, context),
            };
            // getter は戻り値の型、setter は引数の型
            const typeNode = isGetter
                ? accessor.returnType
                : (() => {
                      const [param] = accessor.params;
                      return param && 'typeAnnotation' in param
                          ? (param.typeAnnotation as LwcConvertNode | null)
                          : null;
                  })();
            const property: LwcPropertyJson = existing ?? {
                ...makeStructureJson('lwcProperty', targetRecords, {
                    name: makeNameJson(accessor, context),
                    isGetter: false,
                    isSetter: false,
                }),
            };
            if (isGetter) {
                property.isGetter = true;
                property.getterContent = content;
            } else {
                property.isSetter = true;
                property.setterContent = content;
            }
            if (typeNode && (isGetter || !property.variantType)) {
                property.variantType = makeLwcTypeJson(typeNode, context);
            }
            return property;
        },
        DECLARATION_OPTIONS,
    );

const makeMembersJson = (
    members: LwcConvertNode[],
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcMemberJson[] => {
    const block: LwcMemberJson[] = [];
    const accessors = new Map<string, LwcPropertyJson>();
    for (const member of members) {
        switch (member.type) {
            case 'error':
                block.push(makeLwcErrorJson(member, ERROR_KIND, context));
                break;
            case 'classProperty':
            case 'classPrivateProperty':
            case 'classAccessorProperty':
                block.push(makeFieldJson(member, tables, context));
                break;
            case 'classMethod':
            case 'classPrivateMethod': {
                if (member.kind !== 'get' && member.kind !== 'set') {
                    block.push(makeMethodJson(member, tables, context));
                    break;
                }
                const name = isErrorNode(member.key) ? null : makeNameJson(member, context);
                const existing = typeof name === 'string' ? accessors.get(name) : undefined;
                const property = makeAccessorJson(member, existing, tables, context);
                if (property.kind === 'lwcProperty' && typeof name === 'string') {
                    accessors.set(name, property);
                }
                // 同じ名前の getter / setter は、先に出てきた位置の 1 つにまとめる
                if (!existing) block.push(property);
                break;
            }
            // static ブロック・TS のオーバーロード (TSDeclareMethod)・インデックスシグネチャは対象外
        }
    }
    return block;
};

// ---------------------------------------------------------------------------
// コンポーネント
// ---------------------------------------------------------------------------

/** superClass の式から、継承元とミックスインを取り出す (Mixin2(Mixin1(LightningElement))) */
const makeExtendJson = (
    superClass: LwcConvertNode | null,
    context: LwcJsonContext,
): Pick<LwcComponentJson, 'extend' | 'mixins'> => {
    if (!superClass) {
        return { mixins: [] };
    }
    if (containsErrorNode(superClass)) {
        return { extend: makeLwcErrorJson(superClass, ERROR_KIND, context), mixins: [] };
    }
    const mixins: string[] = [];
    let current = unwrapExpression(superClass);
    while (current.type === 'callExpression') {
        mixins.push(context.textOf(current.callee));
        const [inner] = current.arguments;
        if (!inner) break;
        current = unwrapExpression(inner);
    }
    return { extend: context.textOf(current), mixins };
};

/**
 * クラス (ClassDeclaration / ClassExpression) → lwcComponent。
 * Apex の class と同じく、クラス自身だけを検査する。メンバーはメンバーごとに境界にする
 */
export const makeLwcComponentJson = (
    target: LwcClassDeclarationType | LwcClassExpressionType,
    imports: (LwcImportJson | ErrorJson)[],
    context: LwcJsonContext,
): LwcComponentJson | ErrorJson => {
    const tables = makeLwcImportTables(imports);
    return convertLwcValue(
        target as LwcClassDeclarationType,
        ERROR_KIND,
        context,
        (component: LwcClassDeclarationType, targetRecords) => {
            const id = component.id;
            const body = component.body;
            const implement = (component.implements ?? []).map((i) =>
                makeLwcTypeJson(i as LwcConvertNode, context),
            );
            return makeStructureJson(
                'lwcComponent',
                // 名前のないクラス (export default class extends ...) は、名前の位置をクラス全体にする
                { base: targetRecords.base, name: targetRecords.name ?? targetRecords.base },
                {
                    name: !id
                        ? null
                        : isErrorNode(id)
                          ? makeLwcErrorJson(id, ERROR_KIND, context)
                          : id.name,
                    ...makeExtendJson(component.superClass, context),
                    ...(implement.length > 0 ? { implement } : {}),
                    block: isErrorNode(body)
                        ? [makeLwcErrorJson(body, ERROR_KIND, context)]
                        : makeMembersJson(body.body as LwcConvertNode[], tables, context),
                },
            );
        },
        { exclude: 'children', record: { name: 'id' } },
    );
};
