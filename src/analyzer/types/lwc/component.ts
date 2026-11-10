// コンポーネント (default export のクラス) の JSON (docs/lwc-implementation.md)。
// Apex の types/apex/declaration.ts の class と同じ形にする:
// - 名前を持つ宣言 (コンポーネント・メンバー) は StructureJsonType (sourceKeys: { base, name })、name は string
// - メンバーはソースの順に block に入れる
// 入力は IR v2 (lwc_IR) のノード。v2 の木にはエラーのノードがない (壊れた部分は木から落ちる) ので、
// v1 の convertLwcValue のような、部分木のエラーを調べる処理はない (docs/ir-integration.md)
import {
    makeJsonType,
    makeStructureJson,
    type ConvertKeys,
    type JsonType,
    type StructureJsonType,
} from '../commons/json';
import type {
    commons as ir,
    functionParameterVisitor,
    standardizedVisitor,
    typeScriptVisitor,
} from '../lwc_IR';

import { nameOf, unwrapExpression, walkNodes, type LwcJsonContext, type LwcNode } from './commons';
import type { LwcImportJson } from './import';
import { makeLwcTypeJson, type LwcTypeJson } from './type';

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
    decorator?: LwcDecoratorJson[];
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
    detailType?: LwcTypeJson;
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
    variantType?: LwcTypeJson;
    optional: boolean;
    /** constructor(private x: T) の修飾子 */
    modifier: LwcModifiersJson;
};

/** クラスのフィールド (class property)。Apex の field に当たる */
export type LwcFieldJson = StructureJsonType<'lwcField', { name: ConvertKeys }> & {
    name: string;
    variantType?: LwcTypeJson;
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
    name: string;
    /** getter の戻り値の型 (なければ setter の引数の型) */
    variantType?: LwcTypeJson;
    isGetter: boolean;
    getterContent?: LwcAccessorContentJson;
    isSetter: boolean;
    setterContent?: LwcAccessorContentJson;
};

export type LwcMethodJson = StructureJsonType<'lwcMethod', { name: ConvertKeys }> &
    LwcBodyContentJson & {
        name: string;
        returnType?: LwcTypeJson;
        param: LwcParameterJson[];
        async: boolean;
        modifier: LwcModifiersJson;
    };

export type LwcConstructorJson = StructureJsonType<'lwcConstructor', { name: ConvertKeys }> &
    LwcBodyContentJson & {
        name: 'constructor';
        param: LwcParameterJson[];
        modifier: LwcModifiersJson;
    };

export type LwcMemberJson = LwcFieldJson | LwcPropertyJson | LwcMethodJson | LwcConstructorJson;

export type LwcComponentJson = StructureJsonType<'lwcComponent', { name: ConvertKeys }> & {
    /** クラス名 (export default class {} のように名前がなければ null) */
    name: string | null;
    /** 継承元のクラス (NavigationMixin(LightningElement) なら LightningElement。Apex の extend に当たる) */
    extend?: string;
    /** ミックスイン (NavigationMixin(LightningElement) なら NavigationMixin) */
    mixins: string[];
    /** TS の implements (Apex の implement に当たる) */
    implement?: LwcTypeJson[];
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

export const makeLwcImportTables = (imports: LwcImportJson[]): LwcImportTables => {
    const tables = new Map<string, LwcImportReferenceJson>();
    for (const item of imports) {
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
    node: LwcNode | null | undefined,
    tables: LwcImportTables,
): LwcImportReferenceJson[] => {
    if (!node) return [];
    const references = new Map<string, LwcImportReferenceJson>();
    walkNodes(node, (child) => {
        if (child.kind === 'identifier') {
            const { name } = (child as ir.IdentifierTypeClass).getFields();
            const reference = tables.imports.get(name);
            if (reference) references.set(name, reference);
        }
    });
    return [...references.values()];
};

/** メンバーの key と computed (#x のメンバーは computed を持たない) */
type MemberKeyParts = { key: LwcNode; computed?: boolean };

/** メンバーの名前 (計算されたキーは [式]) */
const makeNameJson = (member: MemberKeyParts, context: LwcJsonContext): string =>
    member.computed ? `[${context.textOf(member.key)}]` : nameOf(member.key, context);

/** オブジェクトの式 ({ key: value }) の、key: value の形のプロパティ (メソッド・スプレッドは除く) */
const objectPropertiesOf = (node: LwcNode | null | undefined): ir.ObjectPropertyTypeClass[] => {
    if (node?.kind !== 'objectExpression') return [];
    return (node as ir.ObjectExpressionTypeClass)
        .getFields()
        .properties.filter(
            (property): property is ir.ObjectPropertyTypeClass =>
                property.kind === 'objectProperty',
        );
};

/** 呼び出し (callExpression・optionalCallExpression) の callee と引数。呼び出しでなければ null */
const callPartsOf = (node: LwcNode): { callee: LwcNode; args: LwcNode[] } | null => {
    if (node.kind !== 'callExpression' && node.kind !== 'optionalCallExpression') return null;
    const fields = (
        node as ir.CallExpressionTypeClass | standardizedVisitor.OptionalCallExpressionTypeClass
    ).getFields();
    return { callee: fields.callee, args: fields.arguments };
};

/** メンバーの参照 (memberExpression・optionalMemberExpression) の中身。メンバーの参照でなければ null */
const memberPartsOf = (
    node: LwcNode,
): { object: LwcNode; property: LwcNode; computed: boolean } | null => {
    if (node.kind !== 'memberExpression' && node.kind !== 'optionalMemberExpression') return null;
    const fields = (
        node as ir.MemberExpressionTypeClass | standardizedVisitor.OptionalMemberExpressionTypeClass
    ).getFields();
    return { object: fields.object, property: fields.property, computed: fields.computed };
};

const makeDecoratorJson = (
    target: ir.DecoratorTypeClass,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcDecoratorJson => {
    const expression = unwrapExpression(target.getFields().expression);
    // v1 と同じく、callExpression のときだけ呼び出しとして見る (optionalCallExpression は見ない)
    const callParts = expression.kind === 'callExpression' ? callPartsOf(expression) : null;
    const name = nameOf(callParts ? callParts.callee : expression, context);
    const args = callParts ? callParts.args : [];

    let wire: LwcDecoratorJson['wire'];
    if (name === 'wire') {
        const [adapterNode, configNode] = args;
        const adapter = adapterNode ? context.textOf(adapterNode) : '';
        const adapterImport = tables.imports.get(adapter.split('.')[0] ?? '');
        const config: LwcWireConfigJson[] = [];
        const configObject = configNode ? unwrapExpression(configNode) : null;
        for (const property of objectPropertiesOf(configObject)) {
            const { key, value } = property.getFields();
            const literal =
                value.kind === 'stringLiteral'
                    ? (value as ir.StringLiteralTypeClass).getFields().value
                    : null;
            config.push(
                makeJsonType<'lwcWireConfig', LwcWireConfigJson>(
                    'lwcWireConfig',
                    context.keysOf(property),
                    {
                        key: nameOf(key, context),
                        value: context.textOf(value),
                        ...(literal?.startsWith('$') ? { reactive: literal.slice(1) } : {}),
                        references: referencesOf(value, tables),
                    },
                ),
            );
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

/**
 * 修飾子のもと。v2 では修飾子の置き場所がノードごとに違う (TS の型注釈のまとまり annotation・初期化の init・
 * kind ごとの判別 union) ので、ノードごとに xxxModifierSourceOf で集めてから makeModifiersJson に渡す
 */
type ModifierSource = {
    accessibility?: string | null;
    decorators?: ir.DecoratorTypeClass[] | null;
} & Partial<Record<(typeof DECLARATION_MODIFIERS)[number], boolean>>;

const makeModifiersJson = (
    member: ModifierSource,
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
    node: LwcNode | null | undefined,
    context: LwcJsonContext,
): { variantType?: LwcTypeJson } => (node ? { variantType: makeLwcTypeJson(node, context) } : {});

/** 関数・メソッドの引数 (TS の constructor(private x) を含む) */
export type LwcParameterNode =
    | functionParameterVisitor.FunctionParameterTypeClass
    | typeScriptVisitor.TSParameterPropertyTypeClass;

/** 引数 */
export const makeLwcParameterJson = (
    param: LwcParameterNode,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcParameterJson => {
    // constructor(private x: T) / x = 1 / ...rest は中の名前を見る
    let target: LwcNode = param;
    let modifier: LwcModifiersJson = {};
    if (param.kind === 'tSParameterProperty') {
        const fields = param.getFields();
        modifier = makeModifiersJson(
            {
                accessibility: fields.accessibility,
                readonly: fields.readonly,
                override: fields.override,
                decorators: fields.decorators,
            },
            tables,
            context,
        );
        target = fields.parameter;
    }
    const hasDefault = target.kind === 'assignmentPattern';
    if (target.kind === 'assignmentPattern') {
        target = (target as ir.AssignmentPatternTypeClass).getFields().left;
    }
    if (target.kind === 'restElement') {
        target = (target as ir.RestElementTypeClass).getFields().argument;
    }

    // 型注釈・? はパターン (identifier・objectPattern・arrayPattern など) が持つ
    const targetFields = target.getFields() as {
        typeAnnotation?: LwcNode | null;
        optional?: boolean;
    };
    const annotation = targetFields.typeAnnotation ?? null;
    // 分割代入 ({ data, error }: T) の範囲は型注釈を含むので、型注釈の部分を除く
    let variant =
        target.kind === 'identifier'
            ? (target as ir.IdentifierTypeClass).getFields().name
            : context.textOf(target);
    const annotationText = annotation ? context.textOf(annotation) : '';
    if (target.kind !== 'identifier' && annotationText && variant.endsWith(annotationText)) {
        variant = variant.slice(0, -annotationText.length).trimEnd();
    }
    return makeJsonType<'lwcParameter', LwcParameterJson>('lwcParameter', context.keysOf(param), {
        variant,
        ...makeTypeJsonOrUndefined(annotation, context),
        optional: hasDefault || targetFields.optional === true,
        modifier,
    });
};

/** this.<名前> の <名前> (this でなければ null) */
const thisMemberName = (node: LwcNode, context: LwcJsonContext): string | null => {
    const member = memberPartsOf(node);
    if (!member) return null;
    if (unwrapExpression(member.object).kind !== 'thisExpression') return null;
    return member.computed ? context.textOf(member.property) : nameOf(member.property, context);
};

/**
 * メソッド・getter / setter・関数の本体。本体 (lwcBody) と、解析に使う呼び出し
 * (Apex・ナビゲーション・querySelector・refs・dispatchEvent・innerHTML への代入) と new CustomEvent を取り出す
 */
export const makeLwcBodyContentJson = (
    body: LwcNode | null,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcBodyContentJson => {
    const calls: LwcCallJson[] = [];
    const events: LwcEventJson[] = [];
    const seenRefs = new Set<string>();
    const call = (
        node: LwcNode,
        properties: Omit<LwcCallJson, 'kind' | 'sourceKeys' | 'arg' | 'references'>,
        args: LwcNode[] = [],
    ) =>
        calls.push(
            makeJsonType<'lwcCall', LwcCallJson>('lwcCall', context.keysOf(node), {
                ...properties,
                arg: args.map((arg) => context.textOf(arg)),
                references: args.flatMap((arg) => referencesOf(arg, tables)),
            }),
        );

    const visit = (node: LwcNode): void => {
        const callParts = callPartsOf(node);
        if (callParts) {
            const callee = unwrapExpression(callParts.callee);
            const { args } = callParts;
            if (callee.kind === 'identifier') {
                const calleeName = (callee as ir.IdentifierTypeClass).getFields().name;
                const apex = tables.imports.get(calleeName)?.apex;
                if (apex) call(node, { callType: 'apex', target: calleeName, apex }, args);
            }
            const calleeMember = memberPartsOf(callee);
            if (calleeMember) {
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
                        : event.kind === 'newExpression'
                          ? context.textOf((event as ir.NewExpressionTypeClass).getFields().callee)
                          : context.textOf(event);
                    call(node, { callType: 'dispatchEvent', target }, args);
                }
                // this.template.querySelector(...) / querySelectorAll(...)
                const method = nameOf(calleeMember.property, context);
                if (
                    (method === 'querySelector' || method === 'querySelectorAll') &&
                    thisMemberName(unwrapExpression(calleeMember.object), context) === 'template'
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
            return;
        }
        const memberParts = memberPartsOf(node);
        if (memberParts) {
            // this.refs.<名前>
            if (thisMemberName(unwrapExpression(memberParts.object), context) === 'refs') {
                const name = nameOf(memberParts.property, context);
                if (!seenRefs.has(name)) {
                    seenRefs.add(name);
                    call(node, { callType: 'refs', target: name });
                }
            }
            return;
        }
        switch (node.kind) {
            case 'assignmentExpression': {
                // element.innerHTML = ... / element.outerHTML = ... (LWC で避けるべき DOM の直接の操作)
                const left = (node as ir.AssignmentExpressionTypeClass).getFields().left;
                const leftMember = memberPartsOf(left);
                if (
                    leftMember &&
                    !leftMember.computed &&
                    ['innerHTML', 'outerHTML'].includes(nameOf(leftMember.property, context))
                ) {
                    call(node, { callType: 'innerHTML', target: context.textOf(left) });
                }
                break;
            }
            case 'newExpression': {
                // new CustomEvent(名前, { detail, bubbles, composed })
                const fields = (node as ir.NewExpressionTypeClass).getFields();
                if (nameOf(unwrapExpression(fields.callee), context) !== 'CustomEvent') break;
                const [nameArg, optionsArg] = fields.arguments;
                const options: Pick<LwcEventJson, 'bubbles' | 'composed' | 'detail'> = {};
                const optionsObject = optionsArg ? unwrapExpression(optionsArg) : null;
                for (const property of objectPropertiesOf(optionsObject)) {
                    const { key: keyNode, value } = property.getFields();
                    const key = nameOf(keyNode, context);
                    if (key === 'detail') options.detail = context.textOf(value);
                    if (
                        (key === 'bubbles' || key === 'composed') &&
                        value.kind === 'booleanLiteral'
                    ) {
                        options[key] = (value as ir.BooleanLiteralTypeClass).getFields().value;
                    }
                }
                const { typeArguments } = fields;
                const detailTypeNode =
                    typeArguments?.kind === 'tSTypeParameterInstantiation'
                        ? (
                              typeArguments as typeScriptVisitor.TSTypeParameterInstantiationTypeClass
                          ).getFields().params[0]
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
    };
    if (body) walkNodes(body, visit);
    // 本体のブロック。中身はソース位置が持ち、本体が変わると objectKey が変わる (Diff で本体の変更が見える)
    const block = body?.kind === 'blockStatement' ? (body as ir.BlockStatementTypeClass) : null;
    return {
        ...(block
            ? {
                  body: makeJsonType<'lwcBody', LwcBodyJson>('lwcBody', context.keysOf(block), {
                      statements: block.getFields().body.length,
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

type FieldNode =
    | ir.ClassPropertyTypeClass
    | ir.ClassPrivatePropertyTypeClass
    | ir.ClassAccessorPropertyTypeClass;

type MethodNode = ir.ClassMethodTypeClass | ir.ClassPrivateMethodTypeClass;

/** メンバーの key と computed */
const memberKeyOf = (target: FieldNode | MethodNode): MemberKeyParts => {
    const { key, computed } = target.getFields() as MemberKeyParts;
    return computed === undefined ? { key } : { key, computed };
};

/**
 * フィールドの修飾子。v2 では accessibility・readonly・override は TS の型注釈のまとまり (annotation.kind: 'ts')、
 * abstract・declare は初期化 (init.kind: 'none' の abstract・init.kind: 'declare') が持つ
 */
const fieldModifierSourceOf = (target: FieldNode): ModifierSource => {
    const fields = target.getFields();
    const { annotation, init } = fields;
    // #x (classPrivateProperty) の TS の修飾子は readonly だけ、初期化の none は abstract を持たない
    const ts =
        annotation?.kind === 'ts'
            ? (annotation as {
                  accessibility?: string | null;
                  readonly: boolean;
                  override?: boolean;
              })
            : null;
    return {
        accessibility: ts?.accessibility ?? null,
        static: fields.static,
        readonly: ts?.readonly === true,
        abstract: init.kind === 'none' && (init as { abstract?: boolean }).abstract === true,
        override: ts?.override === true,
        declare: init.kind === 'declare',
        decorators: fields.decorators,
    };
};

/** メソッド・getter / setter の修飾子。constructor は accessibility だけ、#x() は static・override・decorators だけを持つ */
const methodModifierSourceOf = (target: MethodNode): ModifierSource => {
    if (target.kind === 'classPrivateMethod') {
        const fields = target.getFields();
        return { static: fields.static, override: fields.override, decorators: fields.decorators };
    }
    const fields = target.getFields();
    if (fields.kind === 'constructor') {
        return { accessibility: fields.accessibility };
    }
    return {
        accessibility: fields.accessibility,
        static: fields.static,
        abstract: fields.abstract,
        override: fields.override,
        decorators: fields.decorators,
    };
};

/** クラスのフィールド */
const makeFieldJson = (
    target: FieldNode,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcFieldJson => {
    const { annotation, init } = target.getFields();
    const value = init.kind === 'value' ? init.value : null;
    const member = memberKeyOf(target);
    return makeStructureJson('lwcField', context.structureKeysOf(target, { name: member.key }), {
        name: makeNameJson(member, context),
        ...makeTypeJsonOrUndefined(annotation?.typeAnnotation, context),
        ...(value ? { init: context.textOf(value) } : {}),
        references: referencesOf(value, tables),
        optional: init.kind !== 'definite' && init.optional,
        modifier: makeModifiersJson(fieldModifierSourceOf(target), tables, context),
    });
};

const makeMethodJson = (
    target: MethodNode,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcMethodJson | LwcConstructorJson => {
    const fields = target.getFields();
    const member = memberKeyOf(target);
    const sourceKeys = context.structureKeysOf(target, { name: member.key });
    const body = makeLwcBodyContentJson(fields.body, tables, context);
    const param = (fields.params as LwcParameterNode[]).map((p) =>
        makeLwcParameterJson(p, tables, context),
    );
    const modifier = makeModifiersJson(methodModifierSourceOf(target), tables, context);
    if (fields.kind === 'constructor') {
        return makeStructureJson('lwcConstructor', sourceKeys, {
            name: 'constructor' as const,
            param,
            modifier,
            ...body,
        });
    }
    const returnType = 'returnType' in fields ? fields.returnType : null;
    return makeStructureJson('lwcMethod', sourceKeys, {
        name: makeNameJson(member, context),
        ...(returnType ? { returnType: makeLwcTypeJson(returnType, context) } : {}),
        param,
        async: 'async' in fields && fields.async === true,
        modifier,
        ...body,
    });
};

/** getter / setter。同じ名前の getter と setter は 1 つの lwcProperty にまとめる */
const makeAccessorJson = (
    target: MethodNode,
    existing: LwcPropertyJson | undefined,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcPropertyJson => {
    const fields = target.getFields();
    const isGetter = fields.kind === 'get';
    const content: LwcAccessorContentJson = {
        modifier: makeModifiersJson(methodModifierSourceOf(target), tables, context),
        ...makeLwcBodyContentJson(fields.body, tables, context),
    };
    // getter は戻り値の型、setter は引数の型 (v1 と同じく先頭の引数。TS の this パラメータがあればそれを見る)
    const typeNode =
        fields.kind === 'get'
            ? fields.returnType
            : fields.kind === 'set'
              ? ((fields.params[0].getFields() as { typeAnnotation?: LwcNode | null })
                    .typeAnnotation ?? null)
              : null;
    const member = memberKeyOf(target);
    const property: LwcPropertyJson = existing ?? {
        ...makeStructureJson('lwcProperty', context.structureKeysOf(target, { name: member.key }), {
            name: makeNameJson(member, context),
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
};

const makeMembersJson = (
    members: ReturnType<standardizedVisitor.ClassBodyTypeClass['getFields']>['body'],
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcMemberJson[] => {
    const block: LwcMemberJson[] = [];
    const accessors = new Map<string, LwcPropertyJson>();
    for (const member of members) {
        switch (member.kind) {
            case 'classProperty':
            case 'classPrivateProperty':
            case 'classAccessorProperty':
                block.push(makeFieldJson(member, tables, context));
                break;
            case 'classMethod':
            case 'classPrivateMethod': {
                const methodKind = member.getFields().kind;
                if (methodKind !== 'get' && methodKind !== 'set') {
                    block.push(makeMethodJson(member, tables, context));
                    break;
                }
                const name = makeNameJson(memberKeyOf(member), context);
                const existing = accessors.get(name);
                const property = makeAccessorJson(member, existing, tables, context);
                accessors.set(name, property);
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
    superClass: LwcNode | null,
    context: LwcJsonContext,
): Pick<LwcComponentJson, 'extend' | 'mixins'> => {
    if (!superClass) {
        return { mixins: [] };
    }
    const mixins: string[] = [];
    let current = unwrapExpression(superClass);
    // v1 と同じく callExpression だけをたどる (optionalCallExpression はたどらない)
    while (current.kind === 'callExpression') {
        const { callee, args } = callPartsOf(current)!;
        mixins.push(context.textOf(callee));
        const [inner] = args;
        if (!inner) break;
        current = unwrapExpression(inner);
    }
    return { extend: context.textOf(current), mixins };
};

/** クラス (ClassDeclaration / ClassExpression) → lwcComponent */
export const makeLwcComponentJson = (
    target:
        ir.ClassDeclarationTypeClass<ir.IdentifierTypeClass | null> | ir.ClassExpressionTypeClass,
    imports: LwcImportJson[],
    context: LwcJsonContext,
): LwcComponentJson => {
    const tables = makeLwcImportTables(imports);
    const component = target.getFields();
    const { id } = component;
    const implement = (component.implements ?? []).map((i) => makeLwcTypeJson(i, context));
    return makeStructureJson(
        'lwcComponent',
        // 名前のないクラス (export default class extends ...) は、名前の位置をクラス全体にする
        context.structureKeysOf(target, { name: id }),
        {
            name: id ? id.getFields().name : null,
            ...makeExtendJson(component.heritage?.superClass ?? null, context),
            ...(implement.length > 0 ? { implement } : {}),
            block: makeMembersJson(component.body.getFields().body, tables, context),
        },
    );
};
