import type {
    ConvertKeys,
    LwcBodyContentJson,
    LwcImportReferenceJson,
    LwcImportTables,
    LwcJsArgumentJson,
    LwcJsExpressionJson,
    LwcJsMemberAccessJson,
    LwcJsNewJson,
    LwcModuleJson,
    LwcTypeJson,
} from '../../types';
import { lwcMemberBodyContentsOf, makeLwcImportTables } from '../../types';

import {
    lwcDottedNameOf,
    lwcObjectPropertiesOf,
    lwcPropertyKeyOf,
    lwcStringValueOf,
    unwrapLwcExpression,
    walkLwcJson,
    type LwcVisitor,
    type LwcWalkContext,
} from './walker';

// 本体の決まった形の呼び出しと、本体で作るイベントの解析 (docs/lwc-json-types.md 7 章の 4・8.8)。
// 段階 5 までは JSON (LwcBodyContentJson の calls / events) が持っていたもの。段階 6 で JSON から消し、
// 文・式の JSON (walker.ts) から解析で出すようにした。拾う形は段階 1〜3 の JSON と同じ (2.2・8.1・8.3)。
// ソースの文字列は持たない: 引数・ページ参照の値・detail は元の式の JSON (ノードそのもの) を指し、
// target などの名前は構造から作る (lwcDottedNameOf)

/** this[NavigationMixin.Navigate / GenerateUrl](ページ参照, replace) のページ参照 */
export type LwcNavigationInfo = {
    /** ページ参照の引数 (なければ呼び出し) の位置 */
    sourceKeys: ConvertKeys;
    /** Navigate / GenerateUrl */
    method: string;
    /** type (standard__recordPage など。文字列のリテラルのときだけ) */
    pageType?: string;
    /** attributes の値 (objectApiName: 'Account' など)。文字列のリテラルは値、ほかは式 */
    attributes: Record<string, string | LwcJsExpressionJson>;
    state?: Record<string, string | LwcJsExpressionJson>;
    /** 第 2 引数 (履歴を置き換えるか)。真偽値のリテラルのときだけ */
    replace?: boolean;
};

/** this.template.querySelector(All) / this.querySelector(All) のセレクター */
export type LwcQueryInfo = {
    /** セレクターの引数 (なければ呼び出し) の位置 */
    sourceKeys: ConvertKeys;
    /** template: this.template (shadow DOM) / host: this (light DOM) */
    root: 'template' | 'host';
    all: boolean;
    /** セレクター (文字列のリテラルの値) */
    selector?: string;
    /** セレクターの要素名 (c-account-row など。小文字) */
    tags?: string[];
    /** セレクターの data-* 属性の名前 */
    dataAttributes?: string[];
};

/** import した関数の呼び出しの種類 (import 元と import した名前で決まるもの) */
export type LwcImportCallType =
    'lds' | 'refreshApex' | 'messageService' | 'platformResource' | 'module';

export type LwcCallInfo = {
    /** 呼び出しの式 (refs はメンバーの参照、innerHTML は代入) の位置 */
    sourceKeys: ConvertKeys;
    /**
     * apex: import した Apex のメソッド / navigate: this[NavigationMixin.Navigate] など /
     * querySelector: this.template.querySelector(All) / refs: this.refs.<名前> /
     * dispatchEvent: this.dispatchEvent(...) / innerHTML: innerHTML・outerHTML への代入 /
     * lds・refreshApex・messageService・platformResource・module: import した関数 /
     * listener: addEventListener・removeEventListener / importCall: 動的 import
     */
    callType:
        | 'apex'
        | 'navigate'
        | 'querySelector'
        | 'refs'
        | 'dispatchEvent'
        | 'innerHTML'
        | 'listener'
        | 'importCall'
        | LwcImportCallType;
    /**
     * apex・lds など: import の名前 (名前空間の import は <名前空間>.<名前>) / navigate: Navigate・GenerateUrl /
     * querySelector: セレクター (文字列のリテラルでなければ '') / refs: 名前 /
     * dispatchEvent: new X(...) の X か、渡した変数の名前 (名前の並びでなければ '') /
     * innerHTML: 代入先の名前の並び (this.template.host.innerHTML など。名前の並びでなければ innerHTML / outerHTML) /
     * listener: イベント名 (文字列のリテラルでなければ '') / importCall: import 元 (文字列のリテラルでなければ '')
     */
    target: string;
    apex?: { className: string; methodName: string };
    /** lds・refreshApex・messageService・platformResource・module の import 元 */
    source?: string;
    /** lds など の、import 元での名前 (default import は 'default') */
    imported?: string;
    listener?: 'add' | 'remove';
    navigation?: LwcNavigationInfo;
    query?: LwcQueryInfo;
    /** 引数の式 (JSON のノードそのもの。refs・innerHTML はなし) */
    args: LwcJsArgumentJson[];
    /** 引数の中で使っている import (引数ごとに同じ名前は 1 つ) */
    references: LwcImportReferenceJson[];
    /** 入れ子の関数の深さ・ループ・try の中か (解析の文脈。walker.ts) */
    context: Pick<LwcWalkContext, 'functionDepth' | 'loopDepth' | 'nestingDepth' | 'inTry'>;
};

export type LwcEventInfo = {
    /** new の式の位置 */
    sourceKeys: ConvertKeys;
    /** イベント名 (文字列のリテラルの値。識別子ならその名前、ほかは '') */
    name: string;
    eventClass: 'CustomEvent' | 'Event';
    /**
     * 同じ本体の this.dispatchEvent で発行するか (引数に直接書いたもの・変数に入れてからその変数を渡したもの)。
     * false はほかの場所で発行するか、発行しないもの
     */
    dispatched: boolean;
    bubbles?: boolean;
    composed?: boolean;
    /** detail の式 (JSON のノードそのもの) */
    detail?: LwcJsExpressionJson;
    /** TS の CustomEvent<T> の T */
    detailType?: LwcTypeJson;
};

/** 本体 1 つの呼び出しとイベント */
export type LwcBodyCalls = { calls: LwcCallInfo[]; events: LwcEventInfo[] };

/** import 元と import した名前で決まる呼び出しの種類 */
const IMPORT_CALL_RULES: {
    callType: LwcImportCallType;
    source: (source: string) => boolean;
    names?: ReadonlySet<string>;
}[] = [
    {
        callType: 'lds',
        source: (source) => source === 'lightning/uiRecordApi',
        names: new Set([
            'createRecord',
            'updateRecord',
            'deleteRecord',
            'getRecordNotifyChange',
            'notifyRecordUpdateAvailable',
        ]),
    },
    {
        callType: 'refreshApex',
        source: (source) => source === '@salesforce/apex',
        names: new Set(['refreshApex']),
    },
    {
        callType: 'messageService',
        source: (source) => source === 'lightning/messageService',
        names: new Set([
            'publish',
            'subscribe',
            'unsubscribe',
            'createMessageContext',
            'releaseMessageContext',
        ]),
    },
    {
        callType: 'platformResource',
        source: (source) => source === 'lightning/platformResourceLoader',
        names: new Set(['loadScript', 'loadStyle']),
    },
    {
        // c/<名前> と相対パスのモジュール (ユーティリティ) の関数は、名前を問わない
        callType: 'module',
        source: (source) => /^c\//.test(source) || /^\.\.?\//.test(source),
    },
];

const importCallTypeOf = (source: string, imported: string): LwcImportCallType | null =>
    IMPORT_CALL_RULES.find(
        (rule) => rule.source(source) && (!rule.names || rule.names.has(imported)),
    )?.callType ?? null;

/** CSS のセレクターの要素名と data-* 属性 ([] の中・() の中は要素名として見ない) */
const selectorPartsOf = (selector: string): Pick<LwcQueryInfo, 'tags' | 'dataAttributes'> => {
    const dataAttributes = new Set<string>();
    for (const match of selector.matchAll(/\[\s*(data-[\w-]+)/g)) dataAttributes.add(match[1]!);
    const simplified = selector.replace(/\[[^\]]*\]/g, '[]').replace(/\([^)]*\)/g, '()');
    const tags = new Set<string>();
    for (const compound of simplified.split(/[\s,>+~]+/)) {
        const tag = compound.match(/^[a-zA-Z][\w-]*/)?.[0];
        if (tag) tags.add(tag.toLowerCase());
    }
    return {
        ...(tags.size > 0 ? { tags: [...tags] } : {}),
        ...(dataAttributes.size > 0 ? { dataAttributes: [...dataAttributes] } : {}),
    };
};

/** 式の中で使っている import (識別子が import の名前のもの。同じ名前は 1 つ) */
const referencesOf = (node: unknown, tables: LwcImportTables): LwcImportReferenceJson[] => {
    const references = new Map<string, LwcImportReferenceJson>();
    walkLwcJson(node, {
        jsIdentifier: (identifier) => {
            const reference = tables.imports.get(identifier.name);
            if (reference) references.set(identifier.name, reference);
        },
    });
    return [...references.values()];
};

/** メンバーの参照の名前 (計算されたメンバーは文字列のリテラルのときだけ) */
const memberNameOf = (access: LwcJsMemberAccessJson) =>
    access.member ?? lwcStringValueOf(access.computed);

/** this.<名前> の <名前> (メンバーの参照 (type: 'object') で、this のものでなければ null) */
const thisMemberOf = (node: LwcJsExpressionJson): string | null => {
    const target = unwrapLwcExpression(node);
    if (target.kind !== 'jsMemberAccess' || target.type !== 'object') return null;
    if (unwrapLwcExpression(target.object).kind !== 'jsThis') return null;
    return memberNameOf(target);
};

/** this[NavigationMixin.<名前>] の <名前> */
const navigationMethodOf = (access: LwcJsMemberAccessJson): string | null => {
    if (unwrapLwcExpression(access.object).kind !== 'jsThis' || !access.computed) return null;
    const name = lwcDottedNameOf(access.computed)?.match(/^NavigationMixin\.(\w+)$/);
    return name ? name[1]! : null;
};

const isEventClass = (name: string | null): name is LwcEventInfo['eventClass'] =>
    name === 'CustomEvent' || name === 'Event';

/**
 * 本体 1 つ (メソッド・getter / setter・コンストラクタ・関数・static ブロック) の呼び出しとイベント。
 * 入れ子の関数 (then のコールバックなど) の中も拾い、外側の本体のものにする。並びは本体の前順
 */
export const analyzeLwcBodyCalls = (
    content: LwcBodyContentJson & { expression?: LwcJsExpressionJson },
    tables: LwcImportTables,
): LwcBodyCalls => analyzeLwcCallsIn([content.block, content.expression], tables);

/** 式・文の並び (いくつか) の呼び出しとイベント。並びは前順 */
export const analyzeLwcCallsIn = (roots: unknown[], tables: LwcImportTables): LwcBodyCalls => {
    const calls: LwcCallInfo[] = [];
    const events: LwcEventInfo[] = [];
    const seenRefs = new Set<string>();
    const eventNodes = new Map<LwcEventInfo, LwcJsNewJson>();
    /** this.dispatchEvent(...) の引数に直接書いた new と、引数に渡した変数の名前 */
    const dispatchedNodes = new Set<LwcJsExpressionJson>();
    const dispatchedNames = new Set<string>();
    /** const evt = new CustomEvent(...) の new → 変数の名前 */
    const declaredEvents = new Map<LwcJsExpressionJson, string>();

    const call = (
        node: { sourceKeys: ConvertKeys },
        context: LwcWalkContext,
        properties: Omit<LwcCallInfo, 'sourceKeys' | 'args' | 'references' | 'context'>,
        args: LwcJsArgumentJson[] = [],
    ) =>
        calls.push({
            sourceKeys: node.sourceKeys,
            ...properties,
            args,
            references: args.flatMap((arg) => referencesOf(arg, tables)),
            context: {
                functionDepth: context.functionDepth,
                loopDepth: context.loopDepth,
                nestingDepth: context.nestingDepth,
                inTry: context.inTry,
            },
        });

    const navigationOf = (
        node: { sourceKeys: ConvertKeys },
        method: string,
        args: LwcJsArgumentJson[],
    ): LwcNavigationInfo => {
        const [pageReference, replace] = args;
        const valuesOf = (object: LwcJsExpressionJson | undefined) =>
            Object.fromEntries(
                [...lwcObjectPropertiesOf(object)].map(([key, value]) => [
                    key,
                    lwcStringValueOf(value) ?? value,
                ]),
            );
        const properties = lwcObjectPropertiesOf(pageReference);
        const pageType = lwcStringValueOf(properties.get('type'));
        const state = properties.get('state');
        const replaceValue =
            replace && replace.kind !== 'jsSpread' ? unwrapLwcExpression(replace) : null;
        return {
            sourceKeys: (pageReference ?? node).sourceKeys,
            method,
            ...(pageType !== null ? { pageType } : {}),
            attributes: valuesOf(properties.get('attributes')),
            ...(state ? { state: valuesOf(state) } : {}),
            ...(replaceValue?.kind === 'jsBoolean' ? { replace: replaceValue.value } : {}),
        };
    };

    /** callee が識別子の呼び出し (Apex・import した関数) */
    const identifierCall = (
        node: { sourceKeys: ConvertKeys },
        name: string,
        args: LwcJsArgumentJson[],
        context: LwcWalkContext,
    ) => {
        const apex = tables.imports.get(name)?.apex;
        if (apex) call(node, context, { callType: 'apex', target: name, apex }, args);
        const binding = tables.bindings.get(name);
        const callType =
            !apex && binding?.imported ? importCallTypeOf(binding.source, binding.imported) : null;
        if (binding && callType) {
            call(
                node,
                context,
                { callType, target: name, source: binding.source, imported: binding.imported! },
                args,
            );
        }
    };

    /** callee がメンバーの参照の呼び出し (名前空間の import・addEventListener・ナビゲーション・dispatchEvent・querySelector) */
    const memberCall = (
        node: { sourceKeys: ConvertKeys },
        callee: LwcJsMemberAccessJson,
        args: LwcJsArgumentJson[],
        context: LwcWalkContext,
    ) => {
        const object = unwrapLwcExpression(callee.object);
        // 名前空間の import の関数 (import * as utils from 'c/utils'; utils.formatAmount(...))
        if (object.kind === 'jsIdentifier' && callee.member !== undefined) {
            const binding = tables.bindings.get(object.name);
            if (binding?.specifierType === 'namespace') {
                const callType = importCallTypeOf(binding.source, callee.member);
                if (callType) {
                    call(
                        node,
                        context,
                        {
                            callType,
                            target: `${object.name}.${callee.member}`,
                            source: binding.source,
                            imported: callee.member,
                        },
                        args,
                    );
                }
            }
        }
        // x.addEventListener(名前, ハンドラー) / x.removeEventListener(名前, ハンドラー)
        if (callee.member === 'addEventListener' || callee.member === 'removeEventListener') {
            call(
                node,
                context,
                {
                    callType: 'listener',
                    target: lwcStringValueOf(args[0]) ?? '',
                    listener: callee.member === 'addEventListener' ? 'add' : 'remove',
                },
                args,
            );
        }
        const isThis = object.kind === 'jsThis';
        // this[NavigationMixin.Navigate](...) / this[NavigationMixin.GenerateUrl](...)
        const navigation = navigationMethodOf(callee);
        if (navigation) {
            call(
                node,
                context,
                {
                    callType: 'navigate',
                    target: navigation,
                    navigation: navigationOf(node, navigation, args),
                },
                args,
            );
        }
        const method = memberNameOf(callee);
        // this.dispatchEvent(event)
        if (isThis && method === 'dispatchEvent') {
            const first = args[0];
            const event = first && first.kind !== 'jsSpread' ? unwrapLwcExpression(first) : null;
            if (event?.kind === 'jsIdentifier') dispatchedNames.add(event.name);
            else if (event) dispatchedNodes.add(event);
            const target = !event
                ? ''
                : ((event.kind === 'jsNew'
                      ? lwcDottedNameOf(event.callee)
                      : lwcDottedNameOf(event)) ?? '');
            call(node, context, { callType: 'dispatchEvent', target }, args);
        }
        // this.template.querySelector(...) / querySelectorAll(...) と、light DOM の this.querySelector(...)
        const root = isThis ? 'host' : thisMemberOf(object) === 'template' ? 'template' : null;
        if ((method === 'querySelector' || method === 'querySelectorAll') && root) {
            const [selector] = args;
            const selectorValue = lwcStringValueOf(selector);
            call(
                node,
                context,
                {
                    callType: 'querySelector',
                    target: selectorValue ?? '',
                    query: {
                        sourceKeys: (selector ?? node).sourceKeys,
                        root,
                        all: method === 'querySelectorAll',
                        ...(selectorValue !== null
                            ? { selector: selectorValue, ...selectorPartsOf(selectorValue) }
                            : {}),
                    },
                },
                args,
            );
        }
    };

    const visitor: LwcVisitor = {
        // 動的 import (import('c/x'))
        jsImportCall: (node, context) => {
            call(
                node,
                context,
                { callType: 'importCall', target: lwcStringValueOf(node.source) ?? '' },
                node.options ? [node.source, node.options] : [node.source],
            );
        },
        jsCall: (node, context) => {
            const callee = unwrapLwcExpression(node.callee);
            if (callee.kind === 'jsIdentifier')
                identifierCall(node, callee.name, node.arg, context);
            // (a.b)(x) のように包んだメンバーの参照も、メンバーの呼び出しとして見る
            if (callee.kind === 'jsMemberAccess' && callee.type === 'object') {
                memberCall(node, callee, node.arg, context);
            }
        },
        jsMemberAccess: (node, context) => {
            if (node.type === 'method') memberCall(node, node, node.memberArg ?? [], context);
            // this.refs.<名前> (this.refs.x.focus() の this.refs.x、this.refs.x() も)
            if (thisMemberOf(node.object) === 'refs') {
                const name = memberNameOf(node);
                if (name !== null && !seenRefs.has(name)) {
                    seenRefs.add(name);
                    call(node, context, { callType: 'refs', target: name });
                }
            }
        },
        // const evt = new CustomEvent(...) (あとで this.dispatchEvent(evt) で発行するもの)
        jsVariant: (node) => {
            if (node.init && node.target.kind === 'jsIdentifier') {
                declaredEvents.set(unwrapLwcExpression(node.init), node.target.name);
            }
        },
        // element.innerHTML = ... / element.outerHTML = ... (LWC で避けるべき DOM の直接の操作)
        jsAssignment: (node, context) => {
            const left = node.left;
            if (
                left.kind === 'jsMemberAccess' &&
                left.type === 'object' &&
                (left.member === 'innerHTML' || left.member === 'outerHTML')
            ) {
                call(node, context, {
                    callType: 'innerHTML',
                    target: lwcDottedNameOf(left) ?? left.member,
                });
            }
        },
        // new CustomEvent(名前, { detail, bubbles, composed }) / new Event(名前, { bubbles, composed })
        jsNew: (node) => {
            const callee = unwrapLwcExpression(node.callee);
            const eventClass = callee.kind === 'jsIdentifier' ? callee.name : null;
            if (!isEventClass(eventClass)) return;
            const [nameArg, optionsArg] = node.arg;
            const nameNode =
                nameArg && nameArg.kind !== 'jsSpread' ? unwrapLwcExpression(nameArg) : null;
            const options: Pick<LwcEventInfo, 'bubbles' | 'composed' | 'detail'> = {};
            for (const [key, value] of lwcObjectPropertiesOf(optionsArg)) {
                if (key === 'detail') options.detail = value;
                if ((key === 'bubbles' || key === 'composed') && value.kind === 'jsBoolean') {
                    options[key] = value.value;
                }
            }
            const detailType = node.typeArguments?.[0];
            const event: LwcEventInfo = {
                sourceKeys: node.sourceKeys,
                name:
                    lwcStringValueOf(nameNode) ??
                    (nameNode?.kind === 'jsIdentifier' ? nameNode.name : ''),
                eventClass,
                dispatched: false,
                ...options,
                ...(detailType ? { detailType } : {}),
            };
            events.push(event);
            eventNodes.set(event, node);
        },
    };
    for (const root of roots) if (root) walkLwcJson(root, visitor);
    for (const [event, node] of eventNodes) {
        const variable = declaredEvents.get(node);
        event.dispatched =
            dispatchedNodes.has(node) || (variable !== undefined && dispatchedNames.has(variable));
    }
    return { calls, events };
};

/** モジュールの本体 1 つの呼び出しとイベント (どこの本体か) */
export type LwcContentCalls = LwcBodyCalls & {
    /** コンポーネント・コンポーネント以外のクラス・直下の宣言。直下の文 (statements) は 'module' */
    ownerKind: 'lwcComponent' | 'lwcClass' | 'lwcDeclaration' | 'module';
    /** コンポーネント・クラス・宣言の名前 (名前のないコンポーネントは null) */
    owner: string | null;
    /** メンバーの名前 (static ブロックは 'static'。宣言・直下の文は持たない) */
    member?: string;
    /** 本体の中身 (直下の文は持たない) */
    content?: LwcBodyContentJson;
};

/**
 * モジュールのすべての本体の呼び出しとイベント (コンポーネントのメンバー・コンポーネント以外のクラスのメンバー・
 * 直下の関数・直下の文)。import は module.imports から引く
 */
export const analyzeLwcModuleCalls = (module: LwcModuleJson): LwcContentCalls[] => {
    const tables = makeLwcImportTables(module.imports);
    const result: LwcContentCalls[] = [];
    const members = (
        ownerKind: 'lwcComponent' | 'lwcClass',
        owner: string | null,
        block: Parameters<typeof lwcMemberBodyContentsOf>[0][],
    ) => {
        for (const member of block) {
            for (const content of lwcMemberBodyContentsOf(member)) {
                result.push({
                    ownerKind,
                    owner,
                    member: member.kind === 'lwcStaticBlock' ? 'static' : member.name,
                    content,
                    ...analyzeLwcBodyCalls(content, tables),
                });
            }
        }
    };
    if (module.component) members('lwcComponent', module.component.name, module.component.block);
    for (const declaration of module.declarations) {
        if (declaration.kind === 'lwcClass') {
            members('lwcClass', declaration.name, declaration.block);
        } else {
            // 関数 (と、関数を初期値にした変数) は本体、ほかの変数は初期値の式
            result.push({
                ownerKind: 'lwcDeclaration',
                owner: declaration.name,
                content: declaration,
                ...(declaration.declarationType === 'function'
                    ? analyzeLwcBodyCalls(declaration, tables)
                    : analyzeLwcCallsIn([declaration.init], tables)),
            });
        }
    }
    if (module.statements) {
        result.push({
            ownerKind: 'module',
            owner: null,
            ...analyzeLwcBodyCalls({ block: module.statements, references: [] }, tables),
        });
    }
    return result;
};
