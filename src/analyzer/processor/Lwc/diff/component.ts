import type {
    LwcAccessorContentJson,
    LwcBodyContentJson,
    LwcBodyJson,
    LwcCallJson,
    LwcComponentJson,
    LwcConstructorJson,
    LwcDecoratorJson,
    LwcEventJson,
    LwcFieldJson,
    LwcMemberJson,
    LwcMethodJson,
    LwcModifiersJson,
    LwcParameterJson,
    LwcPropertyJson,
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

// LWC のコンポーネント (default export のクラス) の差分。方針: docs/lwc-implementation.md
// 分類 (A. スロット / B. 集合 / C. 順序付き列 / D. キー対応) と出力の形は Apex と同じ (docs/apex-implementation.md)。
// 部品はすべて processor/commons/diff のもの

/** 値 (型・文字列・真偽値) の任意項目。両方になければプロパティごと持たない */
type OptionalValueDiff<T> = PresentDiff<T, ValueDiff<T>>;

export const makeOptionalValueDiff = <T>(before: T | undefined, after: T | undefined) =>
    makePresentDiff(before, after, makeValueDiff<T>);

/** 型は書かれた型の文字列ごと値として比べる (Apex の型と同じく葉) */
export type LwcTypeDiff = OptionalValueDiff<LwcTypeJson>;

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
        value: ValueDiff<string>;
        reactive?: OptionalValueDiff<string>;
        references: ReferencesDiff;
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
    }));

type WireJson = NonNullable<LwcDecoratorJson['wire']>;

export type LwcWireDiff = TypedObjectDiff<
    WireJson,
    {
        adapter: ValueDiff<string>;
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
        /** C. 順序付き列 (引数は位置で意味が決まる) */
        arg: TypedListDiff<string, ValueDiff<string>>;
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
// 本体 (呼び出し・イベント・文の数)
// ---------------------------------------------------------------------------

export type LwcCallJsonDiff = NodeDiff<
    'lwcCall',
    LwcCallJson,
    {
        callType: ValueDiff<LwcCallJson['callType']>;
        target: ValueDiff<string>;
        apex?: OptionalValueDiff<NonNullable<LwcCallJson['apex']>>;
        arg: TypedListDiff<string, ValueDiff<string>>;
        references: ReferencesDiff;
    }
>;

const makeCallDiff = (before: LwcCallJson, after: LwcCallJson, match: Match): LwcCallJsonDiff =>
    makeNodeDiff('lwcCall', before, after, match, (b, a) => ({
        callType: makeValueDiff(b.callType, a.callType),
        target: makeValueDiff(b.target, a.target),
        ...presentEntry('apex', makeOptionalValueDiff(b.apex, a.apex)),
        arg: makeOrderedValuesDiff(b.arg, a.arg),
        references: makeUnorderedValuesDiff(b.references, a.references),
    }));

export type LwcEventJsonDiff = NodeDiff<
    'lwcEvent',
    LwcEventJson,
    {
        name: ValueDiff<string>;
        bubbles?: OptionalValueDiff<boolean>;
        composed?: OptionalValueDiff<boolean>;
        detail?: OptionalValueDiff<string>;
        detailType?: LwcTypeDiff;
    }
>;

const makeEventDiff = (before: LwcEventJson, after: LwcEventJson, match: Match): LwcEventJsonDiff =>
    makeNodeDiff('lwcEvent', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        ...presentEntry('bubbles', makeOptionalValueDiff(b.bubbles, a.bubbles)),
        ...presentEntry('composed', makeOptionalValueDiff(b.composed, a.composed)),
        ...presentEntry('detail', makeOptionalValueDiff(b.detail, a.detail)),
        ...presentEntry('detailType', makeOptionalValueDiff(b.detailType, a.detailType)),
    }));

export type LwcBodyJsonDiff = NodeDiff<'lwcBody', LwcBodyJson, { statements: ValueDiff<number> }>;

/** 本体の中身。呼び出し・イベントは書かれた順に意味があるので C. 順序付き列 */
export type LwcBodyContentDiff = {
    body?: PresentDiff<LwcBodyJson, LwcBodyJsonDiff>;
    calls: ListItemDiff<'lwcCall', LwcCallJson, LwcCallJsonDiff>[];
    events: ListItemDiff<'lwcEvent', LwcEventJson, LwcEventJsonDiff>[];
};

export const makeLwcBodyContentDiff = (
    before: LwcBodyContentJson,
    after: LwcBodyContentJson,
    sources?: Sources,
): LwcBodyContentDiff => ({
    ...presentEntry(
        'body',
        makePresentDiff(before.body, after.body, (b, a) =>
            makeNodeDiff('lwcBody', b, a, 'slot', (x, y) => ({
                statements: makeValueDiff(x.statements, y.statements),
            })),
        ),
    ),
    calls: makeSequenceDiff('lwcCall', before.calls, after.calls, makeCallDiff, {
        sources,
        canPair: (b, a) => b.callType === a.callType,
    }),
    events: makeSequenceDiff('lwcEvent', before.events, after.events, makeEventDiff, { sources }),
});

// ---------------------------------------------------------------------------
// メンバー
// ---------------------------------------------------------------------------

export type LwcParameterJsonDiff = NodeDiff<
    'lwcParameter',
    LwcParameterJson,
    {
        variant: ValueDiff<string>;
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
        variant: makeValueDiff(b.variant, a.variant),
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
        init?: OptionalValueDiff<string>;
        references: ReferencesDiff;
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

export type LwcMemberJsonDiff =
    LwcFieldJsonDiff | LwcPropertyJsonDiff | LwcMethodJsonDiff | LwcConstructorJsonDiff;

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
        default:
            return makeFieldDiff(before as LwcFieldJson, after as LwcFieldJson, match, sources);
    }
};

/** メンバーの識別キー。static とインスタンスは別のメンバー */
export const getLwcMemberKey = (member: LwcMemberJson): string => {
    const isStatic = 'modifier' in member && member.modifier.declaration?.includes('static');
    return `${isStatic ? 'static ' : ''}${member.name}`;
};

export type LwcComponentJsonDiff = NodeDiff<
    'lwcComponent',
    LwcComponentJson,
    {
        name: ValueDiff<string | null>;
        extend?: OptionalValueDiff<string>;
        /** C. 順序付き列 (mixin は外側から順に適用される) */
        mixins: TypedListDiff<string, ValueDiff<string>>;
        /** B. 集合 */
        implement?: PresentDiff<LwcTypeJson[], TypedListDiff<LwcTypeJson, never>>;
        /** D. キー対応 (メンバー名)。Apex のクラスの block と同じ */
        block: ListItemDiff<'lwcMember', LwcMemberJson, LwcMemberJsonDiff>[];
    }
>;

export const makeLwcComponentDiff = (
    before: LwcComponentJson,
    after: LwcComponentJson,
    match: Match = 'slot',
    sources?: Sources,
): LwcComponentJsonDiff =>
    makeNodeDiff('lwcComponent', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        ...presentEntry('extend', makeOptionalValueDiff(b.extend, a.extend)),
        mixins: makeOrderedValuesDiff(b.mixins, a.mixins),
        ...presentEntry(
            'implement',
            makePresentDiff(b.implement, a.implement, makeUnorderedValuesDiff),
        ),
        block: makeKeyedDiff(
            'lwcMember',
            b.block,
            a.block,
            (x, y, m) => makeMemberDiff(x, y, m, sources),
            getLwcMemberKey,
            sources,
        ),
    }));
