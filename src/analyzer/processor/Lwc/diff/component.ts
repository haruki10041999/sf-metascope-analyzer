import type {
    LwcAccessorContentJson,
    LwcBodyContentJson,
    LwcComponentJson,
    LwcConstructorJson,
    LwcDecoratorJson,
    LwcFieldJson,
    LwcFunctionContentJson,
    LwcJsArgumentJson,
    LwcJsExpressionJson,
    LwcJsPatternJson,
    LwcJsStatementJson,
    LwcMemberJson,
    LwcMethodJson,
    LwcModifiersJson,
    LwcParameterJson,
    LwcPropertyJson,
    LwcStaticBlockJson,
    LwcTypeJson,
    LwcWireConfigJson,
} from '../../../types';

import {
    ListItemDiff,
    Match,
    NodeDiff,
    Sources,
    ValueDiff,
    makeKeyedDiff,
    makeNodeDiff,
    makeSequenceDiff,
    makeValueDiff,
} from '../../commons/diff/commons';
import { TypedListDiff, TypedObjectDiff, makeTypedObjectDiff } from '../../commons/diff/list';
import {
    PresentDiff,
    makeOrderedValuesDiff,
    makePresentDiff,
    makeUnorderedValuesDiff,
    presentEntry,
} from '../../commons/diff/present';
import { LwcBlockDiff, makeLwcBlockDiff } from './gumtree/tree';

// LWC のコンポーネント (default export のクラス) の差分。方針: docs/lwc-implementation.md
// 分類 (A. スロット / B. 集合 / C. 順序付き列 / D. キー対応) と出力の形は Apex と同じ (docs/apex-implementation.md)。
// 部品はすべて processor/commons/diff のもの

/** 値 (型・文字列・真偽値) の任意項目。両方になければプロパティごと持たない */
type OptionalValueDiff<T> = PresentDiff<T, ValueDiff<T>>;

export const makeOptionalValueDiff = <T>(before: T | undefined, after: T | undefined) =>
    makePresentDiff(before, after, makeValueDiff<T>);

/** 型は書かれた型の文字列ごと値として比べる (Apex の型と同じく葉) */
export type LwcTypeDiff = OptionalValueDiff<LwcTypeJson>;

/**
 * 本体の外の式 (初期値・引数など。docs/lwc-json-types.md 5.4) は値として比べる (中身のハッシュの objectKey で比べる)。
 * 本体の文の中の式は、文の並びの GumTree (LwcBlockDiff) の中で比べる
 */
export type LwcExpressionDiff = ValueDiff<LwcJsExpressionJson>;

/** import の参照は local で決まるので値の集合 */
type ReferencesDiff = TypedListDiff<LwcFieldJson['references'][number], never>;

// ---------------------------------------------------------------------------
// 修飾子・デコレーター
// ---------------------------------------------------------------------------

export type LwcWireConfigJsonDiff = NodeDiff<
    'lwcWireConfig',
    LwcWireConfigJson,
    {
        key: ValueDiff<string>;
        value: LwcExpressionDiff;
        reactive?: OptionalValueDiff<string>;
        references: ReferencesDiff;
        /** B. 集合 */
        fieldNames?: PresentDiff<string[], TypedListDiff<string, never>>;
    }
>;

const makeWireConfigDiff = (
    before: LwcWireConfigJson,
    after: LwcWireConfigJson,
    match: Match,
): LwcWireConfigJsonDiff =>
    makeNodeDiff('lwcWireConfig', before, after, match, (b, a) => ({
        key: makeValueDiff(b.key, a.key),
        value: makeValueDiff(b.value, a.value),
        ...presentEntry('reactive', makeOptionalValueDiff(b.reactive, a.reactive)),
        references: makeUnorderedValuesDiff(b.references, a.references),
        ...presentEntry(
            'fieldNames',
            makePresentDiff(b.fieldNames, a.fieldNames, makeUnorderedValuesDiff),
        ),
    }));

type WireJson = NonNullable<LwcDecoratorJson['wire']>;

export type LwcWireDiff = TypedObjectDiff<
    WireJson,
    {
        adapter: LwcExpressionDiff;
        adapterSource?: OptionalValueDiff<string>;
        apex?: OptionalValueDiff<NonNullable<WireJson['apex']>>;
        /** D. キー対応 (設定のキー名) */
        config: ListItemDiff<'lwcWireConfig', LwcWireConfigJson, LwcWireConfigJsonDiff>[];
    }
>;

const makeWireDiff = (before: WireJson, after: WireJson, sources?: Sources): LwcWireDiff =>
    makeTypedObjectDiff(before, after, (b, a) => ({
        adapter: makeValueDiff(b.adapter, a.adapter),
        ...presentEntry('adapterSource', makeOptionalValueDiff(b.adapterSource, a.adapterSource)),
        ...presentEntry('apex', makeOptionalValueDiff(b.apex, a.apex)),
        config: makeKeyedDiff(
            'lwcWireConfig',
            b.config,
            a.config,
            makeWireConfigDiff,
            (config) => config.key,
            sources,
        ),
    }));

export type LwcDecoratorJsonDiff = NodeDiff<
    'lwcDecorator',
    LwcDecoratorJson,
    {
        name: ValueDiff<string>;
        /** C. 順序付き列 (引数は位置で意味が決まる)。式は値として比べる */
        arg: TypedListDiff<LwcJsArgumentJson, ValueDiff<LwcJsArgumentJson>>;
        wire?: PresentDiff<WireJson, LwcWireDiff>;
    }
>;

const makeDecoratorDiff = (
    before: LwcDecoratorJson,
    after: LwcDecoratorJson,
    match: Match,
    sources?: Sources,
): LwcDecoratorJsonDiff =>
    makeNodeDiff('lwcDecorator', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        arg: makeOrderedValuesDiff(b.arg, a.arg),
        ...presentEntry(
            'wire',
            makePresentDiff(b.wire, a.wire, (bw, aw) => makeWireDiff(bw, aw, sources)),
        ),
    }));

export type LwcModifiersDiff = TypedObjectDiff<
    LwcModifiersJson,
    {
        access?: OptionalValueDiff<NonNullable<LwcModifiersJson['access']>>;
        /** B. 集合 (static / readonly などの並びに意味はない) */
        declaration?: PresentDiff<
            NonNullable<LwcModifiersJson['declaration']>,
            TypedListDiff<string, never>
        >;
        /** D. キー対応 (デコレーター名)。Apex のアノテーションと同じ */
        decorator?: PresentDiff<
            LwcDecoratorJson[],
            ListItemDiff<'lwcDecorator', LwcDecoratorJson, LwcDecoratorJsonDiff>[]
        >;
    }
>;

export const makeLwcModifiersDiff = (
    before: LwcModifiersJson,
    after: LwcModifiersJson,
    sources?: Sources,
): LwcModifiersDiff =>
    makeTypedObjectDiff(before, after, (b, a) => ({
        ...presentEntry('access', makeOptionalValueDiff(b.access, a.access)),
        ...presentEntry(
            'declaration',
            makePresentDiff(b.declaration, a.declaration, makeUnorderedValuesDiff),
        ),
        ...presentEntry(
            'decorator',
            makePresentDiff(b.decorator, a.decorator, (bd, ad) =>
                makeKeyedDiff(
                    'lwcDecorator',
                    bd,
                    ad,
                    (x, y, m) => makeDecoratorDiff(x, y, m, sources),
                    (decorator) => decorator.name,
                    sources,
                ),
            ),
        ),
    }));

// ---------------------------------------------------------------------------
// 本体 (文)
// ---------------------------------------------------------------------------

/**
 * 本体の中身。文の並びは GumTree (Apex の本体と同じ。文の追加・削除・移動・中の式の変更が分かる)。
 * 決まった形の呼び出し・イベントは JSON に持たない (解析で出す。processor/Lwc/calls.ts) ので、その変更も文の差分に出る
 */
export type LwcBodyContentDiff = {
    block?: PresentDiff<LwcJsStatementJson[], LwcBlockDiff>;
    /** B. 集合 (import の参照は local で決まる) */
    references: ReferencesDiff;
};

export const makeLwcBodyContentDiff = (
    before: LwcBodyContentJson,
    after: LwcBodyContentJson,
    sources?: Sources,
): LwcBodyContentDiff => ({
    ...presentEntry(
        'block',
        makePresentDiff(before.block, after.block, (b, a) => makeLwcBlockDiff(b, a, sources)),
    ),
    references: makeUnorderedValuesDiff(before.references, after.references),
});

/** 関数 (関数を初期値にしたフィールド) の中身。メソッドと同じ形 */
export type LwcFunctionContentDiff = TypedObjectDiff<
    LwcFunctionContentJson,
    LwcBodyContentDiff & {
        arrow: ValueDiff<boolean>;
        param: LwcParametersDiff;
        returnType?: LwcTypeDiff;
        async: ValueDiff<boolean>;
        generator: ValueDiff<boolean>;
        functionName?: OptionalValueDiff<string>;
        /** アロー関数の式の本体は値として比べる */
        expression?: OptionalValueDiff<LwcJsExpressionJson>;
    }
>;

export const makeLwcFunctionContentDiff = (
    before: LwcFunctionContentJson,
    after: LwcFunctionContentJson,
    sources?: Sources,
): LwcFunctionContentDiff =>
    makeTypedObjectDiff(before, after, (b, a) => ({
        arrow: makeValueDiff(b.arrow, a.arrow),
        param: makeLwcParametersDiff(b.param, a.param, sources),
        ...presentEntry('returnType', makeOptionalValueDiff(b.returnType, a.returnType)),
        async: makeValueDiff(b.async, a.async),
        generator: makeValueDiff(b.generator, a.generator),
        ...presentEntry('functionName', makeOptionalValueDiff(b.functionName, a.functionName)),
        ...presentEntry('expression', makeOptionalValueDiff(b.expression, a.expression)),
        ...makeLwcBodyContentDiff(b, a, sources),
    }));

// ---------------------------------------------------------------------------
// メンバー
// ---------------------------------------------------------------------------

export type LwcParameterJsonDiff = NodeDiff<
    'lwcParameter',
    LwcParameterJson,
    {
        variant?: OptionalValueDiff<string>;
        /** 分割代入のパターンは値として比べる */
        pattern?: OptionalValueDiff<LwcJsPatternJson>;
        variantType?: LwcTypeDiff;
        optional: ValueDiff<boolean>;
        modifier: LwcModifiersDiff;
    }
>;

const makeParameterDiff = (
    before: LwcParameterJson,
    after: LwcParameterJson,
    match: Match,
    sources?: Sources,
): LwcParameterJsonDiff =>
    makeNodeDiff('lwcParameter', before, after, match, (b, a) => ({
        ...presentEntry('variant', makeOptionalValueDiff(b.variant, a.variant)),
        ...presentEntry('pattern', makeOptionalValueDiff(b.pattern, a.pattern)),
        ...presentEntry('variantType', makeOptionalValueDiff(b.variantType, a.variantType)),
        optional: makeValueDiff(b.optional, a.optional),
        modifier: makeLwcModifiersDiff(b.modifier, a.modifier, sources),
    }));

/** 引数は位置で意味が決まるので C. 順序付き列 (Apex のパラメータと同じ) */
export type LwcParametersDiff = ListItemDiff<
    'lwcParameter',
    LwcParameterJson,
    LwcParameterJsonDiff
>[];

export const makeLwcParametersDiff = (
    before: LwcParameterJson[],
    after: LwcParameterJson[],
    sources?: Sources,
): LwcParametersDiff =>
    makeSequenceDiff(
        'lwcParameter',
        before,
        after,
        (b, a, m) => makeParameterDiff(b, a, m, sources),
        { sources, canPair: () => true },
    );

type NameDiff = ValueDiff<string>;

export type LwcFieldJsonDiff = NodeDiff<
    'lwcField',
    LwcFieldJson,
    {
        name: NameDiff;
        variantType?: LwcTypeDiff;
        /** 初期値の式は値として比べる */
        init?: OptionalValueDiff<LwcJsExpressionJson>;
        references: ReferencesDiff;
        function?: PresentDiff<LwcFunctionContentJson, LwcFunctionContentDiff>;
        optional: ValueDiff<boolean>;
        modifier: LwcModifiersDiff;
    }
>;

const makeFieldDiff = (
    before: LwcFieldJson,
    after: LwcFieldJson,
    match: Match,
    sources?: Sources,
): LwcFieldJsonDiff =>
    makeNodeDiff('lwcField', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        ...presentEntry('variantType', makeOptionalValueDiff(b.variantType, a.variantType)),
        ...presentEntry('init', makeOptionalValueDiff(b.init, a.init)),
        references: makeUnorderedValuesDiff(b.references, a.references),
        ...presentEntry(
            'function',
            makePresentDiff(b.function, a.function, (x, y) =>
                makeLwcFunctionContentDiff(x, y, sources),
            ),
        ),
        optional: makeValueDiff(b.optional, a.optional),
        modifier: makeLwcModifiersDiff(b.modifier, a.modifier, sources),
    }));

export type LwcAccessorContentDiff = TypedObjectDiff<
    LwcAccessorContentJson,
    LwcBodyContentDiff & { modifier: LwcModifiersDiff }
>;

const makeAccessorContentDiff = (
    before: LwcAccessorContentJson,
    after: LwcAccessorContentJson,
    sources?: Sources,
): LwcAccessorContentDiff =>
    makeTypedObjectDiff(before, after, (b, a) => ({
        ...makeLwcBodyContentDiff(b, a, sources),
        modifier: makeLwcModifiersDiff(b.modifier, a.modifier, sources),
    }));

export type LwcPropertyJsonDiff = NodeDiff<
    'lwcProperty',
    LwcPropertyJson,
    {
        name: NameDiff;
        variantType?: LwcTypeDiff;
        isGetter: ValueDiff<boolean>;
        getterContent?: PresentDiff<LwcAccessorContentJson, LwcAccessorContentDiff>;
        isSetter: ValueDiff<boolean>;
        setterContent?: PresentDiff<LwcAccessorContentJson, LwcAccessorContentDiff>;
    }
>;

const makePropertyDiff = (
    before: LwcPropertyJson,
    after: LwcPropertyJson,
    match: Match,
    sources?: Sources,
): LwcPropertyJsonDiff =>
    makeNodeDiff('lwcProperty', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        ...presentEntry('variantType', makeOptionalValueDiff(b.variantType, a.variantType)),
        isGetter: makeValueDiff(b.isGetter, a.isGetter),
        ...presentEntry(
            'getterContent',
            makePresentDiff(b.getterContent, a.getterContent, (x, y) =>
                makeAccessorContentDiff(x, y, sources),
            ),
        ),
        isSetter: makeValueDiff(b.isSetter, a.isSetter),
        ...presentEntry(
            'setterContent',
            makePresentDiff(b.setterContent, a.setterContent, (x, y) =>
                makeAccessorContentDiff(x, y, sources),
            ),
        ),
    }));

export type LwcMethodJsonDiff = NodeDiff<
    'lwcMethod',
    LwcMethodJson,
    LwcBodyContentDiff & {
        name: NameDiff;
        returnType?: LwcTypeDiff;
        param: LwcParametersDiff;
        async: ValueDiff<boolean>;
        modifier: LwcModifiersDiff;
    }
>;

const makeMethodDiff = (
    before: LwcMethodJson,
    after: LwcMethodJson,
    match: Match,
    sources?: Sources,
): LwcMethodJsonDiff =>
    makeNodeDiff('lwcMethod', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        ...presentEntry('returnType', makeOptionalValueDiff(b.returnType, a.returnType)),
        param: makeLwcParametersDiff(b.param, a.param, sources),
        async: makeValueDiff(b.async, a.async),
        modifier: makeLwcModifiersDiff(b.modifier, a.modifier, sources),
        ...makeLwcBodyContentDiff(b, a, sources),
    }));

export type LwcConstructorJsonDiff = NodeDiff<
    'lwcConstructor',
    LwcConstructorJson,
    LwcBodyContentDiff & { param: LwcParametersDiff; modifier: LwcModifiersDiff }
>;

const makeConstructorDiff = (
    before: LwcConstructorJson,
    after: LwcConstructorJson,
    match: Match,
    sources?: Sources,
): LwcConstructorJsonDiff =>
    makeNodeDiff('lwcConstructor', before, after, match, (b, a) => ({
        param: makeLwcParametersDiff(b.param, a.param, sources),
        modifier: makeLwcModifiersDiff(b.modifier, a.modifier, sources),
        ...makeLwcBodyContentDiff(b, a, sources),
    }));

export type LwcStaticBlockJsonDiff = NodeDiff<
    'lwcStaticBlock',
    LwcStaticBlockJson,
    LwcBodyContentDiff
>;

const makeStaticBlockDiff = (
    before: LwcStaticBlockJson,
    after: LwcStaticBlockJson,
    match: Match,
    sources?: Sources,
): LwcStaticBlockJsonDiff =>
    makeNodeDiff('lwcStaticBlock', before, after, match, (b, a) =>
        makeLwcBodyContentDiff(b, a, sources),
    );

export type LwcMemberJsonDiff =
    | LwcFieldJsonDiff
    | LwcPropertyJsonDiff
    | LwcMethodJsonDiff
    | LwcConstructorJsonDiff
    | LwcStaticBlockJsonDiff;

/**
 * メンバー 1 組の差分。同じ名前で種類が変わった (フィールド → getter など) ものは、
 * makeNodeDiff が fields を作らずに値を丸ごと before / after に入れる
 */
const makeMemberDiff = (
    before: LwcMemberJson,
    after: LwcMemberJson,
    match: Match,
    sources?: Sources,
): LwcMemberJsonDiff => {
    // kind が違う組は makeNodeDiff の中で丸ごとの比較になるので、どちらかの kind の作り方に渡せばよい
    switch (before.kind) {
        case 'lwcProperty':
            return makePropertyDiff(
                before as LwcPropertyJson,
                after as LwcPropertyJson,
                match,
                sources,
            );
        case 'lwcMethod':
            return makeMethodDiff(before as LwcMethodJson, after as LwcMethodJson, match, sources);
        case 'lwcConstructor':
            return makeConstructorDiff(
                before as LwcConstructorJson,
                after as LwcConstructorJson,
                match,
                sources,
            );
        case 'lwcStaticBlock':
            return makeStaticBlockDiff(
                before as LwcStaticBlockJson,
                after as LwcStaticBlockJson,
                match,
                sources,
            );
        default:
            return makeFieldDiff(before as LwcFieldJson, after as LwcFieldJson, match, sources);
    }
};

/** メンバーの識別キー。static とインスタンスは別のメンバー。static ブロックは名前がないのでキーを持たない (位置と中身で対応付ける) */
export const getLwcMemberKey = (member: LwcMemberJson): string | undefined => {
    if (member.kind === 'lwcStaticBlock') return undefined;
    const isStatic = 'modifier' in member && member.modifier.declaration?.includes('static');
    return `${isStatic ? 'static ' : ''}${member.name}`;
};

export type LwcComponentJsonDiff = NodeDiff<
    'lwcComponent',
    LwcComponentJson,
    {
        name: ValueDiff<string | null>;
        /** extends の式 (ミックスインを含む) は値として比べる (lwcClass と同じ) */
        superClass?: OptionalValueDiff<LwcJsExpressionJson>;
        /** B. 集合 */
        implement?: PresentDiff<LwcTypeJson[], TypedListDiff<LwcTypeJson, never>>;
        /** D. キー対応 (メンバー名)。Apex のクラスの block と同じ */
        block: LwcMembersDiff;
    }
>;

/** クラスのメンバーの並び (D. キー対応。コンポーネント・コンポーネント以外のクラスで共通) */
export type LwcMembersDiff = ListItemDiff<'lwcMember', LwcMemberJson, LwcMemberJsonDiff>[];

export const makeLwcMembersDiff = (
    before: LwcMemberJson[],
    after: LwcMemberJson[],
    sources?: Sources,
): LwcMembersDiff =>
    makeKeyedDiff(
        'lwcMember',
        before,
        after,
        (x, y, m) => makeMemberDiff(x, y, m, sources),
        getLwcMemberKey,
        sources,
    );

export const makeLwcComponentDiff = (
    before: LwcComponentJson,
    after: LwcComponentJson,
    match: Match = 'slot',
    sources?: Sources,
): LwcComponentJsonDiff =>
    makeNodeDiff('lwcComponent', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        ...presentEntry('superClass', makeOptionalValueDiff(b.superClass, a.superClass)),
        ...presentEntry(
            'implement',
            makePresentDiff(b.implement, a.implement, makeUnorderedValuesDiff),
        ),
        block: makeLwcMembersDiff(b.block, a.block, sources),
    }));
