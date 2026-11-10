import {
    ArrayInitInstanceJson,
    ArrayJson,
    BaseExpressionJson,
    CastJson,
    ClassInitInstanceJson,
    DotMethodCallJson,
    FormulaJson,
    InitInstanceJson,
    InstanceNameJson,
    InstanceofJson,
    LiteralPrimaryJson,
    MapInitInstanceJson,
    MethodCallJson,
    NewInstanceJson,
    NoInitInstanceJson,
    PrimaryJson,
    SetInitInstanceJson,
    SoqlJson,
    SoslJson,
    SubJson,
    TernaryJson,
    TypeJson,
    UnaryJson,
} from '../../../types';

import {
    NodeDiff,
    OptionalDiff,
    ReplacementDiff,
    Sources,
    ValueDiff,
    getValueKey,
    makeNodeDiff,
    makeOptionalDiff,
    makeReplacementDiff,
    makeValueDiff,
    pairAsSequence,
} from '../../commons/diff/commons';
import { TypeJsonDiff, makeTypeDiff } from './type';
import { LiteralPrimaryJsonDiff, PrimaryJsonDiff, makePrimaryDiff } from './primary';
import { SoqlJsonDiff } from './query/soql';
import { SoslJsonDiff } from './query/sosl';
import {
    TypedListDiff,
    TypedObjectDiff,
    makeTypedListDiff,
    makeTypedObjectDiff,
} from '../../commons/diff/list';

export type ExpressionListDiff = TypedListDiff<BaseExpressionJson, BaseExpressionJsonDiff>;
export type StringListDiff = TypedListDiff<string, ValueDiff<string>>;
export type DotMethodCallJsonDiff = NodeDiff<
    'memberAccess',
    DotMethodCallJson,
    {
        type: ValueDiff<DotMethodCallJson['type']>;
        object: BaseExpressionJsonDiff;
        operator: ValueDiff<DotMethodCallJson['operator']>;
        member: ValueDiff<string>;
        memberArg: OptionalDiff<NonNullable<DotMethodCallJson['memberArg']>, ExpressionListDiff>;
    }
>;
export type MethodCallJsonDiff = NodeDiff<
    'memberAccess',
    MethodCallJson,
    {
        type: ValueDiff<'method'>;
        member: ValueDiff<string>;
        memberArg: OptionalDiff<NonNullable<MethodCallJson['memberArg']>, ExpressionListDiff>;
        ref: OptionalDiff<NonNullable<MethodCallJson['ref']>, ValueDiff<'this' | 'super'>>;
    }
>;
export type InstanceNameJsonDiff = TypedObjectDiff<
    InstanceNameJson,
    {
        collection: StringListDiff;
        generic: OptionalDiff<
            NonNullable<InstanceNameJson['generic']>,
            TypedListDiff<TypeJson, TypeJsonDiff>
        >;
    }
>;
export type ArrayInitInstanceJsonDiff = TypedObjectDiff<
    ArrayInitInstanceJson,
    {
        init: OptionalDiff<NonNullable<ArrayInitInstanceJson['init']>, ExpressionListDiff>;
        size: OptionalDiff<NonNullable<ArrayInitInstanceJson['size']>, BaseExpressionJsonDiff>;
    }
>;
export type ClassInitInstanceJsonDiff = TypedObjectDiff<
    ClassInitInstanceJson,
    {
        arg: OptionalDiff<NonNullable<ClassInitInstanceJson['arg']>, ExpressionListDiff>;
    }
>;
export type MapInitEntryJson = NonNullable<MapInitInstanceJson['init']>[number];
export type MapInitEntryDiff = TypedObjectDiff<
    MapInitEntryJson,
    { key: BaseExpressionJsonDiff; value: BaseExpressionJsonDiff }
>;
export type MapInitListDiff = TypedListDiff<MapInitEntryJson, MapInitEntryDiff>;
export type MapInitInstanceJsonDiff = TypedObjectDiff<
    MapInitInstanceJson,
    {
        init: OptionalDiff<NonNullable<MapInitInstanceJson['init']>, MapInitListDiff>;
    }
>;
export type NoInitInstanceJsonDiff = TypedObjectDiff<
    NoInitInstanceJson,
    { value: ValueDiff<string> }
>;
export type SetInitInstanceJsonDiff = TypedObjectDiff<
    SetInitInstanceJson,
    {
        init: OptionalDiff<NonNullable<SetInitInstanceJson['init']>, ExpressionListDiff>;
    }
>;
export type InitInstanceJsonDiff =
    | ArrayInitInstanceJsonDiff
    | ClassInitInstanceJsonDiff
    | MapInitInstanceJsonDiff
    | NoInitInstanceJsonDiff
    | SetInitInstanceJsonDiff;
type NewInstanceBaseFields = {
    collection: StringListDiff;
    generic: OptionalDiff<
        NonNullable<InstanceNameJson['generic']>,
        TypedListDiff<TypeJson, TypeJsonDiff>
    >;
};
export type NewInstanceJsonDiff = TypedObjectDiff<
    NewInstanceJson,
    | (NewInstanceBaseFields & {
          init?: ExpressionListDiff;
          size?: BaseExpressionJsonDiff;
      })
    | (NewInstanceBaseFields & { arg?: ExpressionListDiff })
    | (NewInstanceBaseFields & { init?: MapInitListDiff })
    | (NewInstanceBaseFields & { value: ValueDiff<string> })
>;
export type CastJsonDiff = TypedObjectDiff<
    CastJson,
    { target: BaseExpressionJsonDiff; convertType: TypeJsonDiff }
>;
export type SubJsonDiff = TypedObjectDiff<SubJson, { value: BaseExpressionJsonDiff }>;
export type ArrayJsonDiff = TypedObjectDiff<
    ArrayJson,
    { variant: BaseExpressionJsonDiff; index: BaseExpressionJsonDiff }
>;
export type FormulaJsonDiff = TypedObjectDiff<
    FormulaJson,
    {
        left: BaseExpressionJsonDiff;
        operator: ValueDiff<FormulaJson['operator']>;
        right: BaseExpressionJsonDiff;
    }
>;
export type InstanceofJsonDiff = TypedObjectDiff<
    InstanceofJson,
    {
        target: BaseExpressionJsonDiff;
        type: TypeJsonDiff;
    }
>;
export type UnaryJsonDiff = TypedObjectDiff<
    UnaryJson,
    {
        variant: BaseExpressionJsonDiff;
        operator: ValueDiff<UnaryJson['operator']>;
        operatorLocation: ValueDiff<UnaryJson['operatorLocation']>;
    }
>;
export type TernaryJsonDiff = TypedObjectDiff<
    TernaryJson,
    {
        condition: BaseExpressionJsonDiff;
        trueValue: BaseExpressionJsonDiff;
        falseValue: BaseExpressionJsonDiff;
    }
>;
/**
 * 入力の式の型に対応する差分の型 (docs/apex-implementation.md 6.4)。
 * 形が変わった (kind や式の種類が違う) ときは、kind / sourceKeys を分けて値を丸ごと持つ ReplacementDiff になる
 */
export type BaseExpressionJsonDiff<T extends BaseExpressionJson = BaseExpressionJson> =
    | (T extends string
          ? ValueDiff<string>
          : T extends LiteralPrimaryJson
            ? LiteralPrimaryJsonDiff
            : T extends TypeJson
              ? TypeJsonDiff
              : T extends SoqlJson
                ? SoqlJsonDiff
                : T extends SoslJson
                  ? SoslJsonDiff
                  : T extends DotMethodCallJson
                    ? DotMethodCallJsonDiff
                    : T extends MethodCallJson
                      ? MethodCallJsonDiff
                      : T extends NewInstanceJson
                        ? NewInstanceJsonDiff
                        : T extends CastJson
                          ? CastJsonDiff
                          : T extends SubJson
                            ? SubJsonDiff
                            : T extends ArrayJson
                              ? ArrayJsonDiff
                              : T extends InstanceofJson
                                ? InstanceofJsonDiff
                                : T extends FormulaJson
                                  ? FormulaJsonDiff
                                  : T extends UnaryJson
                                    ? UnaryJsonDiff
                                    : T extends TernaryJson
                                      ? TernaryJsonDiff
                                      : never)
    | ReplacementDiff<BaseExpressionJson>;

export const makeExpressionListDiff = (
    before: BaseExpressionJson[],
    after: BaseExpressionJson[],
    sources?: Sources,
): ExpressionListDiff =>
    makeValueListDiff(before, after, (b, a) => makeExpressionValueDiff(b, a, sources));

const makeOptionalExpressionDiff = (
    before: BaseExpressionJson | undefined,
    after: BaseExpressionJson | undefined,
    sources?: Sources,
): OptionalDiff<BaseExpressionJson, BaseExpressionJsonDiff> =>
    makeOptionalDiff(before, after, (b, a) => makeExpressionValueDiff(b, a, sources));

export const makeDotMethodCallDiff = (
    before: DotMethodCallJson,
    after: DotMethodCallJson,
    sources?: Sources,
): DotMethodCallJsonDiff =>
    makeNodeDiff('memberAccess', before, after, 'slot', (b, a) => {
        if (b.type !== a.type) return undefined;
        return {
            type: makeValueDiff(b.type, a.type),
            object: makeExpressionValueDiff(b.object, a.object, sources),
            operator: makeValueDiff(b.operator, a.operator),
            member: makeValueDiff(b.member, a.member),
            memberArg: makeOptionalDiff(b.memberArg, a.memberArg, (x, y) =>
                makeExpressionListDiff(x, y, sources),
            ),
        };
    }) as unknown as DotMethodCallJsonDiff;

export const makeMethodCallDiff = (
    before: MethodCallJson,
    after: MethodCallJson,
    sources?: Sources,
): MethodCallJsonDiff =>
    makeNodeDiff('memberAccess', before, after, 'slot', (b, a) => ({
        type: makeValueDiff(b.type, a.type),
        member: makeValueDiff(b.member, a.member),
        memberArg: makeOptionalDiff(b.memberArg, a.memberArg, (x, y) =>
            makeExpressionListDiff(x, y, sources),
        ),
        ref: makeOptionalDiff(b.ref, a.ref, makeValueDiff),
    })) as unknown as MethodCallJsonDiff;

export const makeInstanceNameDiff = (
    before: InstanceNameJson,
    after: InstanceNameJson,
): InstanceNameJsonDiff =>
    makeTypedObjectDiff(before, after, (b, a) => ({
        collection: makeStringListDiff(b.collection, a.collection),
        generic: makeOptionalDiff(b.generic, a.generic, (x, y) =>
            makeTypedValueListDiff(x, y, makeTypeJsonValueDiff),
        ),
    })) as unknown as InstanceNameJsonDiff;

const makeStringListDiff = (before: string[], after: string[]): StringListDiff =>
    makeValueListDiff(before, after, makeValueDiff);

/** 式の中の配列は位置が意味を持つので C. 順序付き列 (gap の中は位置順に組にする) */
const makeValueListDiff = <T, D>(
    before: T[],
    after: T[],
    makeDiff: (before: T, after: T) => D,
): TypedListDiff<T, D> =>
    makeTypedListDiff(
        before,
        after,
        pairAsSequence(before.map(getValueKey), after.map(getValueKey), { canPair: () => true }),
        makeDiff,
    );

const makeTypeJsonValueDiff = (before: TypeJson, after: TypeJson) => makeTypeDiff(before, after);

export const makeArrayInitInstanceDiff = (
    before: ArrayInitInstanceJson,
    after: ArrayInitInstanceJson,
    sources?: Sources,
): ArrayInitInstanceJsonDiff =>
    makeTypedObjectDiff(before, after, (b, a) => ({
        init: makeOptionalDiff(b.init, a.init, (x, y) => makeExpressionListDiff(x, y, sources)),
        size: makeOptionalExpressionDiff(b.size, a.size, sources),
    })) as unknown as ArrayInitInstanceJsonDiff;

export const makeClassInitInstanceDiff = (
    before: ClassInitInstanceJson,
    after: ClassInitInstanceJson,
    sources?: Sources,
): ClassInitInstanceJsonDiff =>
    makeTypedObjectDiff(before, after, (b, a) => ({
        arg: makeOptionalDiff(b.arg, a.arg, (x, y) => makeExpressionListDiff(x, y, sources)),
    })) as unknown as ClassInitInstanceJsonDiff;

export const makeMapInitEntryDiff = (
    before: MapInitEntryJson,
    after: MapInitEntryJson,
    sources?: Sources,
): MapInitEntryDiff =>
    makeTypedObjectDiff(before, after, (b, a) => ({
        key: makeExpressionValueDiff(b.key, a.key, sources),
        value: makeExpressionValueDiff(b.value, a.value, sources),
    })) as unknown as MapInitEntryDiff;

export const makeMapInitListDiff = (
    before: MapInitEntryJson[],
    after: MapInitEntryJson[],
    sources?: Sources,
): MapInitListDiff =>
    makeValueListDiff(before, after, (b, a) => makeMapInitEntryDiff(b, a, sources));

export const makeMapInitInstanceDiff = (
    before: MapInitInstanceJson,
    after: MapInitInstanceJson,
    sources?: Sources,
): MapInitInstanceJsonDiff =>
    makeTypedObjectDiff(before, after, (b, a) => ({
        init: makeOptionalDiff(b.init, a.init, (x, y) => makeMapInitListDiff(x, y, sources)),
    })) as unknown as MapInitInstanceJsonDiff;

export const makeNoInitInstanceDiff = (
    before: NoInitInstanceJson,
    after: NoInitInstanceJson,
): NoInitInstanceJsonDiff =>
    makeTypedObjectDiff(before, after, (b, a) => ({
        value: makeValueDiff(b.value, a.value),
    })) as unknown as NoInitInstanceJsonDiff;

export const makeSetInitInstanceDiff = (
    before: SetInitInstanceJson,
    after: SetInitInstanceJson,
    sources?: Sources,
): SetInitInstanceJsonDiff =>
    makeTypedObjectDiff(before, after, (b, a) => ({
        init: makeOptionalDiff(b.init, a.init, (x, y) => makeExpressionListDiff(x, y, sources)),
    })) as unknown as SetInitInstanceJsonDiff;

export const makeInitInstanceDiff = (
    before: InitInstanceJson,
    after: InitInstanceJson,
    sources?: Sources,
): InitInstanceJsonDiff => {
    if (before.initType !== after.initType) {
        return makeReplacementDiff(before, after) as unknown as InitInstanceJsonDiff;
    }
    switch (before.initType) {
        case 'array':
            return makeArrayInitInstanceDiff(before, after as ArrayInitInstanceJson, sources);
        case 'class':
            return makeClassInitInstanceDiff(before, after as ClassInitInstanceJson, sources);
        case 'map':
            return makeMapInitInstanceDiff(before, after as MapInitInstanceJson, sources);
        case 'no':
            return makeNoInitInstanceDiff(before, after as NoInitInstanceJson);
        case 'list || set':
            return makeSetInitInstanceDiff(before, after as SetInitInstanceJson, sources);
    }
};

export const makeNewInstanceDiff = (
    before: NewInstanceJson,
    after: NewInstanceJson,
    sources?: Sources,
): NewInstanceJsonDiff => {
    const beforeInit = getInitInstance(before);
    const afterInit = getInitInstance(after);
    if (beforeInit.initType !== afterInit.initType) {
        return makeReplacementDiff(before, after) as NewInstanceJsonDiff;
    }
    return makeTypedObjectDiff(before, after, (b, a) => {
        const fields: Record<string, unknown> = {
            collection: makeStringListDiff(b.collection, a.collection),
            generic: makeOptionalDiff(b.generic, a.generic, (x, y) =>
                makeTypedValueListDiff(x, y, makeTypeJsonValueDiff),
            ),
        };
        switch (beforeInit.initType) {
            case 'array':
                fields.init = makeOptionalDiff(
                    (b as ArrayInitInstanceJson).init,
                    (a as ArrayInitInstanceJson).init,
                    (x, y) => makeExpressionListDiff(x, y, sources),
                );
                fields.size = makeOptionalExpressionDiff(
                    (b as ArrayInitInstanceJson).size,
                    (a as ArrayInitInstanceJson).size,
                    sources,
                );
                break;
            case 'class':
                fields.arg = makeOptionalDiff(
                    (b as ClassInitInstanceJson).arg,
                    (a as ClassInitInstanceJson).arg,
                    (x, y) => makeExpressionListDiff(x, y, sources),
                );
                break;
            case 'map':
                fields.init = makeOptionalDiff(
                    (b as MapInitInstanceJson).init,
                    (a as MapInitInstanceJson).init,
                    (x, y) => makeMapInitListDiff(x, y, sources),
                );
                break;
            case 'no':
                fields.value = makeValueDiff(
                    (b as NoInitInstanceJson).value,
                    (a as NoInitInstanceJson).value,
                );
                break;
            case 'list || set':
                fields.init = makeOptionalDiff(
                    (b as SetInitInstanceJson).init,
                    (a as SetInitInstanceJson).init,
                    (x, y) => makeExpressionListDiff(x, y, sources),
                );
                break;
        }
        return fields as NewInstanceJsonDiff extends TypedObjectDiff<NewInstanceJson, infer Fields>
            ? Fields
            : never;
    }) as unknown as NewInstanceJsonDiff;
};

const getInitInstance = (value: NewInstanceJson): InitInstanceJson => {
    const { collection: _collection, generic: _generic, ...init } = value;
    return init as InitInstanceJson;
};

export const makeCastDiff = (before: CastJson, after: CastJson, sources?: Sources): CastJsonDiff =>
    makeTypedObjectDiff(before, after, (b, a) => ({
        target: makeExpressionValueDiff(b.target, a.target, sources),
        convertType: makeTypeJsonValueDiff(b.convertType, a.convertType),
    })) as unknown as CastJsonDiff;

export const makeSubDiff = (before: SubJson, after: SubJson, sources?: Sources): SubJsonDiff =>
    makeTypedObjectDiff(before, after, (b, a) => ({
        value: makeExpressionValueDiff(b.value, a.value, sources),
    })) as unknown as SubJsonDiff;

export const makeArrayDiff = (
    before: ArrayJson,
    after: ArrayJson,
    sources?: Sources,
): ArrayJsonDiff =>
    makeTypedObjectDiff(before, after, (b, a) => ({
        variant: makeExpressionValueDiff(b.variant, a.variant, sources),
        index: makeExpressionValueDiff(b.index, a.index, sources),
    })) as unknown as ArrayJsonDiff;

export const makeFormulaDiff = (
    before: FormulaJson,
    after: FormulaJson,
    sources?: Sources,
): FormulaJsonDiff =>
    makeTypedObjectDiff(before, after, (b, a) => ({
        left: makeExpressionValueDiff(b.left, a.left, sources),
        operator: makeValueDiff(b.operator, a.operator),
        right: makeExpressionValueDiff(b.right, a.right, sources),
    })) as unknown as FormulaJsonDiff;

export const makeInstanceofDiff = (
    before: InstanceofJson,
    after: InstanceofJson,
    sources?: Sources,
): InstanceofJsonDiff =>
    makeTypedObjectDiff(before, after, (b, a) => ({
        target: makeExpressionValueDiff(b.target, a.target, sources),
        type: makeTypeJsonValueDiff(b.type, a.type),
    })) as unknown as InstanceofJsonDiff;

export const makeUnaryDiff = (
    before: UnaryJson,
    after: UnaryJson,
    sources?: Sources,
): UnaryJsonDiff =>
    makeTypedObjectDiff(before, after, (b, a) => ({
        variant: makeExpressionValueDiff(b.variant, a.variant, sources),
        operator: makeValueDiff(b.operator, a.operator),
        operatorLocation: makeValueDiff(b.operatorLocation, a.operatorLocation),
    })) as unknown as UnaryJsonDiff;

export const makeTernaryDiff = (
    before: TernaryJson,
    after: TernaryJson,
    sources?: Sources,
): TernaryJsonDiff =>
    makeTypedObjectDiff(before, after, (b, a) => ({
        condition: makeExpressionValueDiff(b.condition, a.condition, sources),
        trueValue: makeExpressionValueDiff(b.trueValue, a.trueValue, sources),
        falseValue: makeExpressionValueDiff(b.falseValue, a.falseValue, sources),
    })) as unknown as TernaryJsonDiff;

export const makeExpressionValueDiff = (
    before: BaseExpressionJson,
    after: BaseExpressionJson,
    sources?: Sources,
): BaseExpressionJsonDiff => {
    if (typeof before === 'string' && typeof after === 'string') {
        return makeValueDiff(before, after);
    }
    // kind を持たない式 (NewInstanceJson の初期化部分は initType) は、sourceKeys を持っていても JSON ノードではない
    if (isExpressionNode(before) && isExpressionNode(after)) {
        if (before.kind !== after.kind)
            return makeReplacementDiff<BaseExpressionJson>(before, after);
        if (before.kind === 'memberAccess' && after.kind === 'memberAccess') {
            if (before.type === 'object' && after.type === 'object') {
                return makeDotMethodCallDiff(
                    before as DotMethodCallJson,
                    after as DotMethodCallJson,
                    sources,
                );
            }
            if (before.type === 'method' && after.type === 'method') {
                return makeMethodCallDiff(
                    before as MethodCallJson,
                    after as MethodCallJson,
                    sources,
                );
            }
            return makeReplacementDiff<BaseExpressionJson>(before, after);
        }
        if (before.kind === 'type' && after.kind === 'type') return makeTypeDiff(before, after);
        return makePrimaryDiff(before as PrimaryJson, after as PrimaryJson);
    }

    if (isPlainExpression(before) && isPlainExpression(after)) {
        if ('collection' in before && 'collection' in after)
            return makeNewInstanceDiff(before, after, sources);
        if (
            'target' in before &&
            'convertType' in before &&
            'target' in after &&
            'convertType' in after
        ) {
            return makeCastDiff(before, after, sources);
        }
        if ('parentheses' in before && 'parentheses' in after)
            return makeSubDiff(before, after, sources);
        if ('variant' in before && 'index' in before && 'variant' in after && 'index' in after) {
            return makeArrayDiff(before, after, sources);
        }
        if (
            'operator' in before &&
            before.operator === 'instanceof' &&
            'operator' in after &&
            after.operator === 'instanceof'
        ) {
            return makeInstanceofDiff(before as InstanceofJson, after as InstanceofJson, sources);
        }
        if (
            'left' in before &&
            'right' in before &&
            'operator' in before &&
            'left' in after &&
            'right' in after &&
            'operator' in after
        )
            return makeFormulaDiff(before as FormulaJson, after as FormulaJson, sources);
        if ('operatorLocation' in before && 'operatorLocation' in after)
            return makeUnaryDiff(before, after, sources);
        if ('trueValue' in before && 'trueValue' in after)
            return makeTernaryDiff(before, after, sources);
        if ('valueType' in before && 'valueType' in after) {
            return makePrimaryDiff(before, after);
        }
    }
    return makeReplacementDiff<BaseExpressionJson>(before, after);
};

/** kind と sourceKeys を持つ式 (memberAccess / type / soql / sosl) */
const isExpressionNode = (
    value: BaseExpressionJson,
): value is Extract<BaseExpressionJson, { kind: string; sourceKeys: unknown }> =>
    typeof value === 'object' && value !== null && 'kind' in value && 'sourceKeys' in value;

/** kind を持たない式 (new / cast / formula など)。位置の sourceKeys は持つが、JSON ノードではない */
const isPlainExpression = (value: unknown): value is Record<string, any> =>
    typeof value === 'object' && value !== null && !('kind' in value && 'sourceKeys' in value);

const makeTypedValueListDiff = <T, D>(
    before: T[],
    after: T[],
    makeDiff: (before: T, after: T) => D,
): TypedListDiff<T, D> => makeValueListDiff(before, after, makeDiff);

/**
 * 式 1 つの差分。配列 (引数など) は順序付き列 (C) として位置で対応付ける。
 * GumTree は文の並び (makeBlockDiff) の対応付けにだけ使う (docs/apex-implementation.md 6.4)
 */
export const makeExpressionDiff = <
    Before extends BaseExpressionJson,
    After extends BaseExpressionJson,
>(
    before: Before,
    after: After,
    sources?: Sources,
): BaseExpressionJsonDiff<Before | After> =>
    makeExpressionValueDiff(before, after, sources) as BaseExpressionJsonDiff<Before | After>;
