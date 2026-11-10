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
import {
    makeLwcArgumentJson,
    makeLwcExpressionJson,
    makeLwcPatternJson,
    type LwcJsArgumentJson,
    type LwcJsExpressionJson,
    type LwcJsIdentifierJson,
    type LwcJsPatternJson,
} from './expression';
import type { LwcImportJson } from './import';
import { makeLwcBlockJson, makeLwcStatementJson, type LwcJsStatementJson } from './statement';
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
    /** 値の式 (5.4。ソースの文字列は持たない) */
    value: LwcJsExpressionJson;
    /** '$recordId' のような、プロパティに追従する値 */
    reactive?: string;
    /** 値の中で使っている import (fields: [NAME_FIELD] の NAME_FIELD など) */
    references: LwcImportReferenceJson[];
    /**
     * 値の中の、文字列で書いた項目 (fields: ['Account.Name'] の Account.Name。<オブジェクト>.<項目> の形のもの)。
     * 値の文字列のリテラル・配列の中の文字列のリテラルを見る。なければ持たない
     */
    fieldNames?: string[];
};

/** デコレーター (Apex の AnnotationJson に当たる) */
export type LwcDecoratorJson = JsonType<'lwcDecorator'> & {
    /** api / track / wire など */
    name: string;
    /** 引数の式 (@api などの引数のないものは []) */
    arg: LwcJsArgumentJson[];
    /** @wire のとき */
    wire?: {
        /** アダプターの式 (getRecord・getAccounts などの識別子。第 1 引数) */
        adapter: LwcJsExpressionJson;
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

/**
 * メソッド・getter / setter・関数・static ブロックの本体。
 * 決まった形の呼び出し・イベント (段階 5 までの calls / events) は JSON に持たず、文の JSON から解析で出す
 * (processor/Lwc/calls.ts。docs/lwc-json-types.md 7 章の 4・8.8)
 */
export type LwcBodyContentJson = {
    /** 本体の文 (Apex の block と同じ。アロー関数の式の本体のように、ブロックでなければなし) */
    block?: LwcJsStatementJson[];
    /** 本体の中で使っている import (getFieldValue(..., NAME_FIELD) の NAME_FIELD など。同じ名前は 1 つ) */
    references: LwcImportReferenceJson[];
};

/**
 * 関数 (メソッド以外の function・アロー関数) の引数・戻り値の型・async と本体。
 * 関数を初期値にしたフィールド・変数は、これだけで関数を表す (初期値の式 initExpression に同じ関数を重ねて持たない)
 */
export type LwcFunctionContentJson = LwcBodyContentJson & {
    /** アロー関数か (false は function 式・function 宣言) */
    arrow: boolean;
    param: LwcParameterJson[];
    returnType?: LwcTypeJson;
    async: boolean;
    generator: boolean;
    /** function 式の名前 (const f = function g() {} の g) */
    functionName?: string;
    /** アロー関数の式の本体 (x => x.id の x.id)。ブロックの本体は block */
    expression?: LwcJsExpressionJson;
};

/** 引数 (Apex の ParameterJson に当たる) */
export type LwcParameterJson = JsonType<'lwcParameter'> & {
    /** 名前 (識別子のとき。...rest は rest)。分割代入の引数は持たず pattern を持つ */
    variant?: string;
    /** 分割代入の引数 ({ data, error }) のパターン (型注釈は variantType。既定値は含まない) */
    pattern?: LwcJsPatternJson;
    variantType?: LwcTypeJson;
    optional: boolean;
    /** constructor(private x: T) の修飾子 */
    modifier: LwcModifiersJson;
};

/** クラスのフィールド (class property)。Apex の field に当たる */
export type LwcFieldJson = StructureJsonType<'lwcField', { name: ConvertKeys }> & {
    name: string;
    variantType?: LwcTypeJson;
    /**
     * 初期値の式 (5.4)。初期値がそのまま関数 (handleClick = () => {...}) のときは持たず、function だけで表す
     * (括弧・as などで包んだ関数は、包んだ形を残すため持つ)
     */
    init?: LwcJsExpressionJson;
    /** 初期値の中で使っている import (@api title = TITLE_LABEL の TITLE_LABEL など) */
    references: LwcImportReferenceJson[];
    /** 初期値が関数 (handleClick = () => {...}) のとき、メソッドと同じ本体の中身。そのときは init を持たない */
    function?: LwcFunctionContentJson;
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

/** static { ... } のブロック。名前を持たないので、Diff では位置と中身で対応付ける */
export type LwcStaticBlockJson = JsonType<'lwcStaticBlock'> & LwcBodyContentJson;

export type LwcMemberJson =
    LwcFieldJson | LwcPropertyJson | LwcMethodJson | LwcConstructorJson | LwcStaticBlockJson;

export type LwcComponentJson = StructureJsonType<'lwcComponent', { name: ConvertKeys }> & {
    /** クラス名 (export default class {} のように名前がなければ null) */
    name: string | null;
    /**
     * extends の式 (NavigationMixin(LightningElement) など。lwcClass と同じ)。
     * 継承元とミックスインの名前は解析で出す (processor/Lwc/walker.ts の lwcHeritageOf)
     */
    superClass?: LwcJsExpressionJson;
    /** TS の implements (Apex の implement に当たる) */
    implement?: LwcTypeJson[];
    /** メンバー (ソースの順) */
    block: LwcMemberJson[];
};

// ---------------------------------------------------------------------------
// 部品
// ---------------------------------------------------------------------------

/** 値の import 1 つ (型だけの import は除く)。呼び出しの種類 (lds・module など) を決めるのに使う */
export type LwcImportBinding = {
    source: string;
    specifierType: 'default' | 'named' | 'namespace';
    /** import 元での名前 (default は 'default'、名前空間の import は持たない) */
    imported?: string;
};

export type LwcImportTables = {
    /** import の名前 → import 元と、Apex のメソッド・項目 */
    imports: Map<string, LwcImportReferenceJson>;
    /** import の名前 → 値の import (型だけの import は入れない) */
    bindings: Map<string, LwcImportBinding>;
};

export const makeLwcImportTables = (imports: LwcImportJson[]): LwcImportTables => {
    const tables = new Map<string, LwcImportReferenceJson>();
    const bindings = new Map<string, LwcImportBinding>();
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
            if (item.typeOnly || specifier.typeOnly) continue;
            bindings.set(specifier.local, {
                source: item.source,
                specifierType: specifier.specifierType,
                ...(isDefault
                    ? { imported: 'default' }
                    : specifier.specifierType === 'named'
                      ? { imported: specifier.imported ?? specifier.local }
                      : {}),
            });
        }
    }
    return { imports: tables, bindings };
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

/** 文字列のリテラル ('x'・式のないテンプレートリテラル `x`) の値。それ以外は null */
const stringValueOf = (node: LwcNode | null | undefined): string | null => {
    if (!node) return null;
    const target = unwrapExpression(node);
    if (target.kind === 'stringLiteral') {
        return (target as ir.StringLiteralTypeClass).getFields().value;
    }
    if (target.kind === 'templateLiteral') {
        const { head, spans } = (target as ir.TemplateLiteralTypeClass).getFields();
        if (spans.length === 0) return head.getFields().value.cooked ?? null;
    }
    return null;
};

/** <オブジェクト>.<項目> (リレーションをたどるもの Account.Owner.Email を含む) */
const FIELD_NAME = /^\w+(\.\w+)+$/;

/** wire の設定の値の中の、文字列で書いた項目 (値そのもの・配列の要素の文字列のリテラル) */
const fieldNamesOf = (node: LwcNode): string[] => {
    const target = unwrapExpression(node);
    if (target.kind === 'arrayExpression') {
        return (target as ir.ArrayExpressionTypeClass)
            .getFields()
            .elements.flatMap((element) => (element ? fieldNamesOf(element) : []));
    }
    const value = stringValueOf(target);
    return value !== null && FIELD_NAME.test(value) ? [value] : [];
};

/** 呼び出し (callExpression・optionalCallExpression) の callee と引数。呼び出しでなければ null */
const callPartsOf = (node: LwcNode): { callee: LwcNode; args: LwcNode[] } | null => {
    if (node.kind !== 'callExpression' && node.kind !== 'optionalCallExpression') return null;
    const fields = (
        node as ir.CallExpressionTypeClass | standardizedVisitor.OptionalCallExpressionTypeClass
    ).getFields();
    return { callee: fields.callee, args: fields.arguments };
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
        // アダプターの import は、式の先頭の識別子 (apex.getAccounts なら apex) で引く
        let head = adapterNode ? unwrapExpression(adapterNode) : null;
        while (
            head &&
            (head.kind === 'memberExpression' || head.kind === 'optionalMemberExpression')
        ) {
            head = unwrapExpression((head as ir.MemberExpressionTypeClass).getFields().object);
        }
        const adapterImport =
            head?.kind === 'identifier'
                ? tables.imports.get((head as ir.IdentifierTypeClass).getFields().name)
                : undefined;
        const config: LwcWireConfigJson[] = [];
        const configObject = configNode ? unwrapExpression(configNode) : null;
        for (const property of objectPropertiesOf(configObject)) {
            const { key, value } = property.getFields();
            const literal =
                value.kind === 'stringLiteral'
                    ? (value as ir.StringLiteralTypeClass).getFields().value
                    : null;
            const fieldNames = fieldNamesOf(value);
            config.push(
                makeJsonType<'lwcWireConfig', LwcWireConfigJson>(
                    'lwcWireConfig',
                    context.keysOf(property),
                    {
                        key: nameOf(key, context),
                        value: makeLwcExpressionJson(value, tables, context),
                        ...(literal?.startsWith('$') ? { reactive: literal.slice(1) } : {}),
                        references: referencesOf(value, tables),
                        ...(fieldNames.length > 0 ? { fieldNames } : {}),
                    },
                ),
            );
        }
        wire = {
            // @wire() (アダプターなし) はコンパイラが受け付けないが、JSON は作るので空の識別子にする
            adapter: adapterNode
                ? makeLwcExpressionJson(adapterNode, tables, context)
                : makeJsonType<'jsIdentifier', LwcJsIdentifierJson>(
                      'jsIdentifier',
                      context.keysOf(target),
                      { name: '' },
                  ),
            ...(adapterImport ? { adapterSource: adapterImport.source } : {}),
            ...(adapterImport?.apex ? { apex: adapterImport.apex } : {}),
            config,
        };
    }

    return makeJsonType<'lwcDecorator', LwcDecoratorJson>('lwcDecorator', context.keysOf(target), {
        name,
        arg: args.map((arg) => makeLwcArgumentJson(arg, tables, context)),
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
    // 分割代入 ({ data, error }: T) はパターン (型注釈は variantType)
    return makeJsonType<'lwcParameter', LwcParameterJson>('lwcParameter', context.keysOf(param), {
        ...(target.kind === 'identifier'
            ? { variant: (target as ir.IdentifierTypeClass).getFields().name }
            : { pattern: makeLwcPatternJson(target, tables, context) }),
        ...makeTypeJsonOrUndefined(annotation, context),
        optional: hasDefault || targetFields.optional === true,
        modifier,
    });
};

/**
 * メソッド・getter / setter・関数の本体。本体の文 (block) と、本体の中の import の参照。
 * 決まった形の呼び出し・イベントは JSON に持たず、解析で文の JSON から出す (processor/Lwc/calls.ts)
 */
export const makeLwcBodyContentJson = (
    body: LwcNode | null,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcBodyContentJson => {
    // 本体の文 (Diff は GumTree で文ごとに比べる)
    const block = body?.kind === 'blockStatement' ? (body as ir.BlockStatementTypeClass) : null;
    return {
        ...(block ? { block: makeLwcBlockJson(block, tables, context) } : {}),
        references: referencesOf(body, tables),
    };
};

/** 関数 (function / アロー関数) なら、引数・戻り値の型・async と本体。関数でなければ null */
export const makeLwcFunctionContentJson = (
    node: LwcNode | null | undefined,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcFunctionContentJson | null => {
    if (!node) {
        return null;
    }
    let fields:
        | ir.FunctionDeclarationFields
        | ir.FunctionExpressionFields
        | ir.ArrowFunctionExpressionFields;
    let body: LwcNode;
    let expression: LwcNode | null = null;
    let functionName: string | null = null;
    switch (node.kind) {
        case 'functionDeclaration':
        case 'functionExpression': {
            const fn = (
                node as ir.FunctionDeclarationTypeClass | ir.FunctionExpressionTypeClass
            ).getFields();
            fields = fn;
            body = fn.body;
            // function 宣言の名前は宣言 (lwcDeclaration) の name が持つ
            if (node.kind === 'functionExpression' && fn.id) functionName = fn.id.getFields().name;
            break;
        }
        case 'arrowFunctionExpression': {
            const arrow = (node as ir.ArrowFunctionExpressionTypeClass).getFields();
            fields = arrow;
            // アロー関数の本体は、ブロックか式 (v1 の body と同じノード)
            body = arrow.body.kind === 'block' ? arrow.body.block : arrow.body.expression;
            if (arrow.body.kind !== 'block') expression = arrow.body.expression;
            break;
        }
        default:
            return null;
    }
    return {
        arrow: node.kind === 'arrowFunctionExpression',
        param: fields.params.map((p) => makeLwcParameterJson(p, tables, context)),
        ...(fields.returnType ? { returnType: makeLwcTypeJson(fields.returnType, context) } : {}),
        async: fields.async === true,
        generator: 'generator' in fields && fields.generator === true,
        ...(functionName !== null ? { functionName } : {}),
        ...(expression ? { expression: makeLwcExpressionJson(expression, tables, context) } : {}),
        ...makeLwcBodyContentJson(body, tables, context),
    };
};

/** メンバーが持つ本体の中身 (メソッド・コンストラクタ・getter / setter・関数を初期値にしたフィールド・static ブロック) */
export const lwcMemberBodyContentsOf = (member: LwcMemberJson): LwcBodyContentJson[] => {
    switch (member.kind) {
        case 'lwcMethod':
        case 'lwcConstructor':
        case 'lwcStaticBlock':
            return [member];
        case 'lwcProperty':
            return [member.getterContent, member.setterContent].filter(
                (content): content is LwcAccessorContentJson => content !== undefined,
            );
        case 'lwcField':
            return member.function ? [member.function] : [];
    }
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
    // handleClick = () => {...} は、メソッドと同じく本体の中身 (呼び出し・イベント・import の参照) を持つ
    const fn = value ? makeLwcFunctionContentJson(unwrapExpression(value), tables, context) : null;
    // 初期値がそのまま関数なら function だけで表す (初期値の式・文字列に同じ関数を重ねて持たない)
    const onlyFunction = fn !== null && value !== null && unwrapExpression(value) === value;
    return makeStructureJson('lwcField', context.structureKeysOf(target, { name: member.key }), {
        name: makeNameJson(member, context),
        ...makeTypeJsonOrUndefined(annotation?.typeAnnotation, context),
        ...(value && !onlyFunction ? { init: makeLwcExpressionJson(value, tables, context) } : {}),
        references: referencesOf(value, tables),
        ...(fn ? { function: fn } : {}),
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

/** クラスのメンバー (コンポーネント・コンポーネント以外のクラス・クラス式・本体の中のクラスで共通) */
export const makeLwcClassMembersJson = (
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
            case 'staticBlock': {
                // static { ... } の本体はブロックではなく文の並び
                const statements = member.getFields().body as LwcNode[];
                block.push(
                    makeJsonType<'lwcStaticBlock', LwcStaticBlockJson>(
                        'lwcStaticBlock',
                        context.keysOf(member),
                        {
                            ...makeLwcBodyContentJson(member, tables, context),
                            block: statements.map((s) => makeLwcStatementJson(s, tables, context)),
                        },
                    ),
                );
                break;
            }
            // TS のオーバーロード (TSDeclareMethod)・インデックスシグネチャは対象外
        }
    }
    return block;
};

// ---------------------------------------------------------------------------
// コンポーネント
// ---------------------------------------------------------------------------

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
            ...(component.heritage?.superClass
                ? {
                      superClass: makeLwcExpressionJson(
                          component.heritage.superClass,
                          tables,
                          context,
                      ),
                  }
                : {}),
            ...(implement.length > 0 ? { implement } : {}),
            block: makeLwcClassMembersJson(component.body.getFields().body, tables, context),
        },
    );
};
