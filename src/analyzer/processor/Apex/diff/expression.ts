import {
    ArrayInitInstanceJson,
    ArrayJson,
    BaseExpressionJson,
    CastJson,
    ClassInitInstanceJson,
    DotMethodCallJson,
    ErrorJson,
    FormulaJson,
    InitInstanceJson,
    InstanceNameJson,
    InstanceofJson,
    MapInitInstanceJson,
    MethodCallJson,
    NewInstanceJson,
    NoInitInstanceJson,
    PrimaryJson,
    SetInitInstanceJson,
    SubJson,
    TernaryJson,
    TypeJson,
    UnaryJson,
} from '../../../types';

import {
    Match,
    NodeDiff,
    OptionalDiff,
    Sources,
    ValueDiff,
    getValueKey,
    makeNodeDiff,
    makeOptionalDiff,
    makeValueDiff,
    pairAsSequence,
} from './commons';
import { TypeDiff, makeTypeDiff } from './type';
import { PrimaryDiff, makePrimaryDiff } from './primary';
import { TypedListDiff, TypedListItemDiff, TypedObjectDiff } from './typed';

export type ExpressionJson = BaseExpressionJson | ErrorJson;
export type ExpressionValueDiff = ExpressionNodeDiff | ExpressionReplacementDiff;
export type ExpressionListDiff = TypedListDiff<BaseExpressionJson | ErrorJson, ExpressionValueDiff>;
export type StringListDiff = TypedListDiff<string, ValueDiff<string>>;
export type ErrorExpressionDiff = NodeDiff<'error', ErrorJson, { kindType: ValueDiff<string> }>;
export type MemberArgDiff =
    | ExpressionListDiff
    | ErrorExpressionDiff
    | ValueDiff<NonNullable<DotMethodCallJson['memberArg']>>;
export type DotMethodCallDiff = NodeDiff<
    'memberAccess',
    DotMethodCallJson,
    {
        type: ValueDiff<DotMethodCallJson['type']>;
        object: ExpressionValueDiff;
        operator: ValueDiff<DotMethodCallJson['operator']>;
        member: ValueDiff<string>;
        memberArg: OptionalDiff<NonNullable<DotMethodCallJson['memberArg']>, MemberArgDiff>;
    }
>;
export type MethodCallDiff = NodeDiff<
    'memberAccess',
    MethodCallJson,
    {
        type: ValueDiff<'method'>;
        member: ValueDiff<string>;
        memberArg: OptionalDiff<NonNullable<MethodCallJson['memberArg']>, MemberArgDiff>;
        ref: OptionalDiff<NonNullable<MethodCallJson['ref']>, ValueDiff<'this' | 'super'>>;
    }
>;
export type InstanceNameDiff = TypedObjectDiff<
    InstanceNameJson,
    {
        collection: StringListDiff;
        generic: OptionalDiff<
            NonNullable<InstanceNameJson['generic']>,
            TypedListDiff<TypeJson | ErrorJson, TypeDiff>
        >;
    }
>;
export type ArrayInitInstanceDiff = TypedObjectDiff<
    ArrayInitInstanceJson,
    {
        init: OptionalDiff<NonNullable<ArrayInitInstanceJson['init']>, ExpressionListDiff>;
        size: OptionalDiff<NonNullable<ArrayInitInstanceJson['size']>, ExpressionValueDiff>;
    }
>;
export type ClassInitInstanceDiff = TypedObjectDiff<
    ClassInitInstanceJson,
    {
        arg: OptionalDiff<NonNullable<ClassInitInstanceJson['arg']>, ExpressionListDiff>;
    }
>;
export type MapInitEntryJson = Exclude<NonNullable<MapInitInstanceJson['init']>[number], ErrorJson>;
export type MapInitEntryDiff = TypedObjectDiff<
    MapInitEntryJson,
    { key: ExpressionValueDiff; value: ExpressionValueDiff }
>;
export type MapInitListDiff = TypedListDiff<
    MapInitEntryJson | ErrorJson,
    MapInitEntryDiff | ErrorExpressionDiff
>;
export type MapInitInstanceDiff = TypedObjectDiff<
    MapInitInstanceJson,
    {
        init: OptionalDiff<NonNullable<MapInitInstanceJson['init']>, MapInitListDiff>;
    }
>;
export type NoInitInstanceDiff = TypedObjectDiff<NoInitInstanceJson, { value: ValueDiff<string> }>;
export type SetInitInstanceDiff = TypedObjectDiff<
    SetInitInstanceJson,
    {
        init: OptionalDiff<NonNullable<SetInitInstanceJson['init']>, ExpressionListDiff>;
    }
>;
export type InitInstanceDiff =
    | ArrayInitInstanceDiff
    | ClassInitInstanceDiff
    | MapInitInstanceDiff
    | NoInitInstanceDiff
    | SetInitInstanceDiff;
type NewInstanceBaseFields = {
    collection: StringListDiff;
    generic: OptionalDiff<
        NonNullable<InstanceNameJson['generic']>,
        TypedListDiff<TypeJson | ErrorJson, TypeDiff>
    >;
};
export type NewInstanceDiff = TypedObjectDiff<
    NewInstanceJson,
    | (NewInstanceBaseFields & {
          init?: ExpressionListDiff;
          size?: ExpressionValueDiff;
      })
    | (NewInstanceBaseFields & { arg?: ExpressionListDiff })
    | (NewInstanceBaseFields & { init?: MapInitListDiff })
    | (NewInstanceBaseFields & { value: ValueDiff<string> })
>;
export type CastDiff = TypedObjectDiff<
    CastJson,
    { target: ExpressionValueDiff; convertType: TypeDiff }
>;
export type SubDiff = TypedObjectDiff<SubJson, { value: ExpressionValueDiff }>;
export type ArrayDiff = TypedObjectDiff<
    ArrayJson,
    { variant: ExpressionValueDiff; index: ExpressionValueDiff }
>;
export type FormulaDiff = TypedObjectDiff<
    FormulaJson,
    {
        left: ExpressionValueDiff;
        operator: ValueDiff<FormulaJson['operator']>;
        right: ExpressionValueDiff;
    }
>;
export type InstanceofDiff = TypedObjectDiff<
    InstanceofJson,
    {
        target: ExpressionValueDiff;
        type: TypeDiff;
    }
>;
export type UnaryDiff = TypedObjectDiff<
    UnaryJson,
    {
        variant: ExpressionValueDiff;
        operator: ValueDiff<UnaryJson['operator']>;
        operatorLocation: ValueDiff<UnaryJson['operatorLocation']>;
    }
>;
export type TernaryDiff = TypedObjectDiff<
    TernaryJson,
    {
        condition: ExpressionValueDiff;
        trueValue: ExpressionValueDiff;
        falseValue: ExpressionValueDiff;
    }
>;
export type ExpressionReplacementDiff = {
    status: 'changed';
    before: BaseExpressionJson | ErrorJson;
    after: BaseExpressionJson | ErrorJson;
    kind?: string;
    sourceKeys?: { before: ErrorJson['sourceKeys']; after: ErrorJson['sourceKeys'] };
    match?: Match;
};
export type ExpressionNodeDiff =
    | ErrorExpressionDiff
    | ValueDiff<string>
    | DotMethodCallDiff
    | MethodCallDiff
    | NewInstanceDiff
    | ArrayInitInstanceDiff
    | ClassInitInstanceDiff
    | MapInitInstanceDiff
    | NoInitInstanceDiff
    | SetInitInstanceDiff
    | InitInstanceDiff
    | InstanceNameDiff
    | CastDiff
    | SubDiff
    | ArrayDiff
    | FormulaDiff
    | InstanceofDiff
    | UnaryDiff
    | TernaryDiff
    | PrimaryDiff;
export type ExpressionDiff = (ExpressionNodeDiff | ExpressionReplacementDiff)[];

const makePlainDiff = <T extends object, Fields>(
    before: T,
    after: T,
    fields: (before: T, after: T) => Fields,
): TypedObjectDiff<T, Fields> =>
    getValueKey(before) === getValueKey(after)
        ? { status: 'unchanged', value: before }
        : { status: 'changed', fields: fields(before, after) };

export const makeExpressionListDiff = (
    before: (BaseExpressionJson | ErrorJson)[],
    after: (BaseExpressionJson | ErrorJson)[],
    sources?: Sources,
): ExpressionListDiff => {
    const pairings = pairAsSequence(before.map(getValueKey), after.map(getValueKey), {
        canPair: () => true,
    });

    return pairings.map(
        (pairing): TypedListItemDiff<BaseExpressionJson | ErrorJson, ExpressionValueDiff> => {
            if (pairing.status === 'removed') {
                return { status: 'removed', index: pairing.before, value: before[pairing.before]! };
            }
            if (pairing.status === 'added') {
                return { status: 'added', index: pairing.after, value: after[pairing.after]! };
            }
            const index = { before: pairing.before, after: pairing.after };
            if (pairing.status === 'unchanged') {
                return {
                    status: 'unchanged',
                    match: pairing.match,
                    index,
                    value: after[pairing.after]!,
                };
            }
            return {
                status: pairing.status,
                match: pairing.match,
                index,
                value: makeExpressionValueDiff(
                    before[pairing.before]!,
                    after[pairing.after]!,
                    sources,
                ),
            };
        },
    );
};

const makeOptionalExpressionDiff = (
    before: BaseExpressionJson | ErrorJson | undefined,
    after: BaseExpressionJson | ErrorJson | undefined,
    sources?: Sources,
): OptionalDiff<BaseExpressionJson | ErrorJson, ExpressionValueDiff> =>
    makeOptionalDiff(before, after, (b, a) => makeExpressionValueDiff(b, a, sources));

export const makeErrorExpressionDiff = (before: ErrorJson, after: ErrorJson): ErrorExpressionDiff =>
    makeNodeDiff('error', before, after, 'slot', (b, a) => ({
        kindType: makeValueDiff(b.kindType, a.kindType),
    }));

export const makeDotMethodCallDiff = (
    before: DotMethodCallJson,
    after: DotMethodCallJson,
    sources?: Sources,
): DotMethodCallDiff =>
    makeNodeDiff('memberAccess', before, after, 'slot', (b, a) => {
        if (b.type !== a.type) return undefined;
        return {
            type: makeValueDiff(b.type, a.type),
            object: makeExpressionValueDiff(b.object, a.object, sources),
            operator: makeValueDiff(b.operator, a.operator),
            member: makeValueDiff(b.member, a.member),
            memberArg: makeOptionalDiff(b.memberArg, a.memberArg, (x, y) =>
                makeMemberArgDiff(x, y, sources),
            ),
        };
    }) as unknown as DotMethodCallDiff;

export const makeMethodCallDiff = (
    before: MethodCallJson,
    after: MethodCallJson,
    sources?: Sources,
): MethodCallDiff =>
    makeNodeDiff('memberAccess', before, after, 'slot', (b, a) => ({
        type: makeValueDiff(b.type, a.type),
        member: makeValueDiff(b.member, a.member),
        memberArg: makeOptionalDiff(b.memberArg, a.memberArg, (x, y) =>
            makeMemberArgDiff(x, y, sources),
        ),
        ref: makeOptionalDiff(b.ref, a.ref, makeValueDiff),
    })) as unknown as MethodCallDiff;

const makeMemberArgDiff = (
    before: NonNullable<DotMethodCallJson['memberArg']>,
    after: NonNullable<DotMethodCallJson['memberArg']>,
    sources?: Sources,
): MemberArgDiff => {
    if (Array.isArray(before) && Array.isArray(after)) {
        return makeExpressionListDiff(before, after, sources);
    }
    if (!Array.isArray(before) && !Array.isArray(after)) {
        return makeErrorExpressionDiff(before, after);
    }
    return makeValueDiff(before, after);
};

export const makeInstanceNameDiff = (
    before: InstanceNameJson,
    after: InstanceNameJson,
): InstanceNameDiff =>
    makePlainDiff(before, after, (b, a) => ({
        collection: makeStringListDiff(b.collection, a.collection),
        generic: makeOptionalDiff(b.generic, a.generic, (x, y) =>
            makeTypedValueListDiff(x, y, makeTypeJsonValueDiff),
        ),
    })) as unknown as InstanceNameDiff;

const makeStringListDiff = (before: string[], after: string[]): StringListDiff =>
    makeValueListDiff(before, after, makeValueDiff);

const makeValueListDiff = <T, D>(
    before: T[],
    after: T[],
    makeDiff: (before: T, after: T) => D,
): TypedListDiff<T, D> => {
    const pairings = pairAsSequence(before.map(getValueKey), after.map(getValueKey), {
        canPair: () => true,
    });
    return pairings.map((p) => {
        if (p.status === 'removed')
            return { status: 'removed', index: p.before, value: before[p.before]! };
        if (p.status === 'added')
            return { status: 'added', index: p.after, value: after[p.after]! };
        if (p.status === 'unchanged') {
            return {
                status: 'unchanged',
                match: p.match,
                index: { before: p.before, after: p.after },
                value: after[p.after]!,
            };
        }
        return {
            status: p.status,
            match: p.match,
            index: { before: p.before, after: p.after },
            value: makeDiff(before[p.before]!, after[p.after]!),
        };
    }) as TypedListDiff<T, D>;
};

const makeTypeJsonValueDiff = (before: TypeJson | ErrorJson, after: TypeJson | ErrorJson) =>
    makeTypeDiff(before, after);

export const makeArrayInitInstanceDiff = (
    before: ArrayInitInstanceJson,
    after: ArrayInitInstanceJson,
    sources?: Sources,
): ArrayInitInstanceDiff =>
    makePlainDiff(before, after, (b, a) => ({
        init: makeOptionalDiff(b.init, a.init, (x, y) => makeExpressionListDiff(x, y, sources)),
        size: makeOptionalExpressionDiff(b.size, a.size, sources),
    })) as unknown as ArrayInitInstanceDiff;

export const makeClassInitInstanceDiff = (
    before: ClassInitInstanceJson,
    after: ClassInitInstanceJson,
    sources?: Sources,
): ClassInitInstanceDiff =>
    makePlainDiff(before, after, (b, a) => ({
        arg: makeOptionalDiff(b.arg, a.arg, (x, y) => makeExpressionListDiff(x, y, sources)),
    })) as unknown as ClassInitInstanceDiff;

export const makeMapInitEntryDiff = (
    before: MapInitEntryJson,
    after: MapInitEntryJson,
    sources?: Sources,
): MapInitEntryDiff =>
    makePlainDiff(before, after, (b, a) => ({
        key: makeExpressionValueDiff(b.key, a.key, sources),
        value: makeExpressionValueDiff(b.value, a.value, sources),
    })) as unknown as MapInitEntryDiff;

export const makeMapInitListDiff = (
    before: (MapInitEntryJson | ErrorJson)[],
    after: (MapInitEntryJson | ErrorJson)[],
    sources?: Sources,
): MapInitListDiff =>
    makeValueListDiff(before, after, (b, a) =>
        'kind' in b
            ? 'kind' in a
                ? makeErrorExpressionDiff(b, a)
                : { status: 'changed', before: b, after: a }
            : 'kind' in a
              ? { status: 'changed', before: b, after: a }
              : makeMapInitEntryDiff(b, a, sources),
    ) as unknown as MapInitListDiff;

export const makeMapInitInstanceDiff = (
    before: MapInitInstanceJson,
    after: MapInitInstanceJson,
    sources?: Sources,
): MapInitInstanceDiff =>
    makePlainDiff(before, after, (b, a) => ({
        init: makeOptionalDiff(b.init, a.init, (x, y) => makeMapInitListDiff(x, y, sources)),
    })) as unknown as MapInitInstanceDiff;

export const makeNoInitInstanceDiff = (
    before: NoInitInstanceJson,
    after: NoInitInstanceJson,
): NoInitInstanceDiff =>
    makePlainDiff(before, after, (b, a) => ({
        value: makeValueDiff(b.value, a.value),
    })) as unknown as NoInitInstanceDiff;

export const makeSetInitInstanceDiff = (
    before: SetInitInstanceJson,
    after: SetInitInstanceJson,
    sources?: Sources,
): SetInitInstanceDiff =>
    makePlainDiff(before, after, (b, a) => ({
        init: makeOptionalDiff(b.init, a.init, (x, y) => makeExpressionListDiff(x, y, sources)),
    })) as unknown as SetInitInstanceDiff;

export const makeInitInstanceDiff = (
    before: InitInstanceJson,
    after: InitInstanceJson,
    sources?: Sources,
): InitInstanceDiff => {
    if (before.kind !== after.kind) {
        return { status: 'changed', before, after } as unknown as InitInstanceDiff;
    }
    switch (before.kind) {
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
): NewInstanceDiff => {
    const beforeInit = getInitInstance(before);
    const afterInit = getInitInstance(after);
    if (beforeInit.kind !== afterInit.kind) {
        return { status: 'changed', before, after } as NewInstanceDiff;
    }
    return makePlainDiff(before, after, (b, a) => {
        const fields: Record<string, unknown> = {
            collection: makeStringListDiff(b.collection, a.collection),
            generic: makeOptionalDiff(b.generic, a.generic, (x, y) =>
                makeTypedValueListDiff(x, y, makeTypeJsonValueDiff),
            ),
        };
        switch (beforeInit.kind) {
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
        return fields as NewInstanceDiff extends TypedObjectDiff<NewInstanceJson, infer Fields>
            ? Fields
            : never;
    }) as unknown as NewInstanceDiff;
};

const getInitInstance = (value: NewInstanceJson): InitInstanceJson => {
    const { collection: _collection, generic: _generic, ...init } = value;
    return init as InitInstanceJson;
};

export const makeCastDiff = (before: CastJson, after: CastJson, sources?: Sources): CastDiff =>
    makePlainDiff(before, after, (b, a) => ({
        target: makeExpressionValueDiff(b.target, a.target, sources),
        convertType: makeTypeJsonValueDiff(b.convertType, a.convertType),
    })) as unknown as CastDiff;

export const makeSubDiff = (before: SubJson, after: SubJson, sources?: Sources): SubDiff =>
    makePlainDiff(before, after, (b, a) => ({
        value: makeExpressionValueDiff(b.value, a.value, sources),
    })) as unknown as SubDiff;

export const makeArrayDiff = (before: ArrayJson, after: ArrayJson, sources?: Sources): ArrayDiff =>
    makePlainDiff(before, after, (b, a) => ({
        variant: makeExpressionValueDiff(b.variant, a.variant, sources),
        index: makeExpressionValueDiff(b.index, a.index, sources),
    })) as unknown as ArrayDiff;

export const makeFormulaDiff = (
    before: FormulaJson,
    after: FormulaJson,
    sources?: Sources,
): FormulaDiff =>
    makePlainDiff(before, after, (b, a) => ({
        left: makeExpressionValueDiff(b.left, a.left, sources),
        operator: makeValueDiff(b.operator, a.operator),
        right: makeExpressionValueDiff(b.right, a.right, sources),
    })) as unknown as FormulaDiff;

export const makeInstanceofDiff = (
    before: InstanceofJson,
    after: InstanceofJson,
    sources?: Sources,
): InstanceofDiff =>
    makePlainDiff(before, after, (b, a) => ({
        target: makeExpressionValueDiff(b.target, a.target, sources),
        type: makeTypeJsonValueDiff(b.type, a.type),
    })) as unknown as InstanceofDiff;

export const makeUnaryDiff = (before: UnaryJson, after: UnaryJson, sources?: Sources): UnaryDiff =>
    makePlainDiff(before, after, (b, a) => ({
        variant: makeExpressionValueDiff(b.variant, a.variant, sources),
        operator: makeValueDiff(b.operator, a.operator),
        operatorLocation: makeValueDiff(b.operatorLocation, a.operatorLocation),
    })) as unknown as UnaryDiff;

export const makeTernaryDiff = (
    before: TernaryJson,
    after: TernaryJson,
    sources?: Sources,
): TernaryDiff =>
    makePlainDiff(before, after, (b, a) => ({
        condition: makeExpressionValueDiff(b.condition, a.condition, sources),
        trueValue: makeExpressionValueDiff(b.trueValue, a.trueValue, sources),
        falseValue: makeExpressionValueDiff(b.falseValue, a.falseValue, sources),
    })) as unknown as TernaryDiff;

export const makeExpressionReplacementDiff = (
    before: BaseExpressionJson | ErrorJson,
    after: BaseExpressionJson | ErrorJson,
): ExpressionReplacementDiff => ({ status: 'changed', before, after });

export const makeExpressionValueDiff = (
    before: BaseExpressionJson | ErrorJson,
    after: BaseExpressionJson | ErrorJson,
    sources?: Sources,
): ExpressionValueDiff => {
    if (typeof before === 'string' && typeof after === 'string') {
        return makeValueDiff(before, after);
    }
    if (typeof before === 'object' && 'kind' in before && before.kind === 'error') {
        return typeof after === 'object' && 'kind' in after && after.kind === 'error'
            ? makeErrorExpressionDiff(before, after)
            : makeExpressionReplacementDiff(before, after);
    }
    if (typeof after === 'object' && 'kind' in after && after.kind === 'error') {
        return makeExpressionReplacementDiff(before, after);
    }
    if (
        typeof before === 'object' &&
        'kind' in before &&
        typeof after === 'object' &&
        'kind' in after
    ) {
        if (before.kind !== after.kind) return makeExpressionReplacementDiff(before, after);
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
            return makeExpressionReplacementDiff(before, after);
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
    return makeExpressionReplacementDiff(before, after);
};

const isPlainExpression = (value: unknown): value is Record<string, any> =>
    typeof value === 'object' && value !== null && !('kind' in value);

const makeTypedValueListDiff = <T, D>(
    before: T[],
    after: T[],
    makeDiff: (before: T, after: T) => D,
): TypedListDiff<T, D> => makeValueListDiff(before, after, makeDiff);

/** Expression recursion uses positional array pairing; GumTree is reserved for statement blocks. */
export const makeExpressionDiff = <Before extends ExpressionJson, After extends ExpressionJson>(
    before: Before,
    after: After,
    sources?: Sources,
): ExpressionDiff => [makeExpressionValueDiff(before, after, sources)];
