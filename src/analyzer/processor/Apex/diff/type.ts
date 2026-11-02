import {
    ArrayTypeContentJson,
    ConvertKeys,
    CustomTypeContentJson,
    ErrorJson,
    ListTypeContentJson,
    MapTypeContentJson,
    PrimitiveTypeContentJson,
    SetTypeContentJson,
    TypeContentJson,
    TypeJson,
} from '../../../types';

import {
    Body,
    ListItemDiff,
    Match,
    NodeDiff,
    Sources,
    ValueDiff,
    isSameValue,
    makeNodeDiff,
    makeSetDiff,
    makeValueDiff,
    pairAsSequence,
    toBody,
} from './commons';

// ---------------------------------------------------------------------------
// 型の中身 (TypeContentJson) の差分
// ---------------------------------------------------------------------------

export type PrimitiveTypeShapeDiff = {
    type: 'primitive';
    primitiveType: ValueDiff<string>;
};

export type CustomTypePartDiff = ValueDiff<string> | { status: 'added' | 'removed'; value: string };

/** generic は C. 順序付き列 (位置が意味を持つ) */
export type GenericDiff =
    | (TypeContentDiff & { index: { before: number; after: number } })
    | {
          status: 'moved';
          match: Match;
          index: { before: number; after: number };
          value: TypeContentJson;
      }
    | { status: 'added' | 'removed'; index: number; value: TypeContentJson };

export type CustomTypeShapeDiff = {
    type: 'custom';
    customType: ValueDiff<string | string[]> | { status: 'changed'; parts: CustomTypePartDiff[] };
    generic: GenericDiff[];
};

export type ArrayTypeShapeDiff = {
    type: 'array';
    elementType: TypeContentDiff;
    dimension: ValueDiff<number>;
};

export type ListTypeShapeDiff = {
    type: 'list';
    elementType: TypeContentDiff;
};

export type SetTypeShapeDiff = {
    type: 'set';
    elementType: TypeContentDiff;
};

export type MapTypeShapeDiff = {
    type: 'map';
    keyType: TypeContentDiff;
    valueType: TypeContentDiff;
};

/** type が同じ型同士のプロパティごとの差分 */
export type TypeShapeDiff =
    | PrimitiveTypeShapeDiff
    | CustomTypeShapeDiff
    | ArrayTypeShapeDiff
    | ListTypeShapeDiff
    | SetTypeShapeDiff
    | MapTypeShapeDiff;

export type TypeContentDiff =
    | { status: 'unchanged'; value: TypeContentJson }
    | { status: 'changed'; fields: TypeShapeDiff }
    | { status: 'changed'; before: TypeContentJson; after: TypeContentJson };

/** 修飾名 (a.b.C) は後ろ揃えで要素を対応付ける */
const makeCustomTypeNameDiff = (
    before: CustomTypeContentJson['customType'],
    after: CustomTypeContentJson['customType'],
): CustomTypeShapeDiff['customType'] => {
    if (!Array.isArray(before) || !Array.isArray(after) || isSameValue(before, after)) {
        return makeValueDiff(before, after);
    }

    const parts: CustomTypePartDiff[] = [];
    const length = Math.max(before.length, after.length);

    for (let offset = 1; offset <= length; offset++) {
        const b = before[before.length - offset];
        const a = after[after.length - offset];

        if (b === undefined && a !== undefined) {
            parts.push({ status: 'added', value: a });
        } else if (b !== undefined && a === undefined) {
            parts.push({ status: 'removed', value: b });
        } else if (b !== undefined && a !== undefined) {
            parts.push(makeValueDiff(b, a));
        }
    }

    return { status: 'changed', parts: parts.reverse() };
};

const makeGenericDiff = (before: TypeContentJson[], after: TypeContentJson[]): GenericDiff[] => {
    const pairings = pairAsSequence(
        before.map((b) => JSON.stringify(b)),
        after.map((a) => JSON.stringify(a)),
    );

    return pairings.map((p): GenericDiff => {
        if (p.status === 'removed') {
            return { status: 'removed', index: p.before, value: before[p.before]! };
        }
        if (p.status === 'added') {
            return { status: 'added', index: p.after, value: after[p.after]! };
        }

        const index = { before: p.before, after: p.after };
        if (p.status === 'moved') {
            return { status: 'moved', match: p.match, index, value: before[p.before]! };
        }
        return { ...makeTypeContentDiff(before[p.before]!, after[p.after]!), index };
    });
};

const makeTypeShapeDiff = (
    before: TypeContentJson,
    after: TypeContentJson,
): TypeShapeDiff | undefined => {
    if (before.type === 'primitive' && after.type === 'primitive') {
        return makePrimitiveTypeShapeDiff(before, after);
    } else if (before.type === 'custom' && after.type === 'custom') {
        return makeCustomTypeShapeDiff(before, after);
    } else if (before.type === 'array' && after.type === 'array') {
        return makeArrayTypeShapeDiff(before, after);
    } else if (before.type === 'list' && after.type === 'list') {
        return makeListTypeShapeDiff(before, after);
    } else if (before.type === 'set' && after.type === 'set') {
        return makeSetTypeShapeDiff(before, after);
    } else if (before.type === 'map' && after.type === 'map') {
        return makeMapTypeShapeDiff(before, after);
    }

    return undefined;
};

export const makePrimitiveTypeShapeDiff = (
    before: PrimitiveTypeContentJson,
    after: PrimitiveTypeContentJson,
): PrimitiveTypeShapeDiff => ({
    type: 'primitive',
    primitiveType: makeValueDiff(before.primitiveType, after.primitiveType),
});

export const makeCustomTypeShapeDiff = (
    before: CustomTypeContentJson,
    after: CustomTypeContentJson,
): CustomTypeShapeDiff => ({
    type: 'custom',
    customType: makeCustomTypeNameDiff(before.customType, after.customType),
    generic: makeGenericDiff(before.generic ?? [], after.generic ?? []),
});

export const makeArrayTypeShapeDiff = (
    before: ArrayTypeContentJson,
    after: ArrayTypeContentJson,
): ArrayTypeShapeDiff => ({
    type: 'array',
    elementType: makeTypeContentDiff(before.elementType, after.elementType),
    dimension: makeValueDiff(before.dimension, after.dimension),
});

export const makeListTypeShapeDiff = (
    before: ListTypeContentJson,
    after: ListTypeContentJson,
): ListTypeShapeDiff => ({
    type: 'list',
    elementType: makeTypeContentDiff(before.elementType, after.elementType),
});

export const makeSetTypeShapeDiff = (
    before: SetTypeContentJson,
    after: SetTypeContentJson,
): SetTypeShapeDiff => ({
    type: 'set',
    elementType: makeTypeContentDiff(before.elementType, after.elementType),
});

export const makeMapTypeShapeDiff = (
    before: MapTypeContentJson,
    after: MapTypeContentJson,
): MapTypeShapeDiff => ({
    type: 'map',
    keyType: makeTypeContentDiff(before.keyType, after.keyType),
    valueType: makeTypeContentDiff(before.valueType, after.valueType),
});

export const makeTypeContentDiff = (
    before: TypeContentJson,
    after: TypeContentJson,
): TypeContentDiff => {
    if (isSameValue(before, after)) {
        return { status: 'unchanged', value: before };
    }

    const fields = makeTypeShapeDiff(before, after);

    return fields
        ? { status: 'changed', fields: fields }
        : { status: 'changed', before: before, after: after };
};

// ---------------------------------------------------------------------------
// TypeJson (ノード) の差分
// ---------------------------------------------------------------------------

export type TypeDiff = NodeDiff<'type', TypeJson, TypeShapeDiff>;

export const makeTypeDiff = (
    before: TypeJson | ErrorJson,
    after: TypeJson | ErrorJson,
    match: Match = 'slot',
): TypeDiff => {
    return makeNodeDiff('type', before, after, match, (b, a) =>
        makeTypeShapeDiff(toBody(b) as TypeContentJson, toBody(a) as TypeContentJson),
    );
};

export type TypeWithVoidDiff =
    | TypeDiff
    | { kind: 'type'; status: 'unchanged'; value: 'void' }
    | {
          kind: 'type';
          sourceKeys: { before?: ConvertKeys; after?: ConvertKeys };
          status: 'changed';
          match: Match;
          before: Body<TypeJson | ErrorJson> | 'void';
          after: Body<TypeJson | ErrorJson> | 'void';
      };

export const makeTypeWithVoidDiff = (
    before: 'void' | TypeJson | ErrorJson,
    after: 'void' | TypeJson | ErrorJson,
    match: Match = 'slot',
): TypeWithVoidDiff => {
    if (before === 'void' && after === 'void') {
        return { kind: 'type', status: 'unchanged', value: 'void' };
    }

    if (before !== 'void' && after !== 'void') {
        return makeTypeDiff(before, after, match);
    }

    return {
        kind: 'type',
        sourceKeys: {
            ...(before !== 'void' ? { before: before.sourceKeys } : {}),
            ...(after !== 'void' ? { after: after.sourceKeys } : {}),
        },
        status: 'changed',
        match,
        before: before === 'void' ? 'void' : toBody(before),
        after: after === 'void' ? 'void' : toBody(after),
    };
};

/** 型の並び (implements / interface の extends)。順序は意味を持たないので B. 集合 */
export type TypesDiff = ListItemDiff<'type', TypeJson | ErrorJson, TypeDiff>;

export const makeTypesDiff = (
    before: (TypeJson | ErrorJson)[],
    after: (TypeJson | ErrorJson)[],
    sources?: Sources,
): TypesDiff[] => {
    return makeSetDiff('type', before, after, makeTypeDiff, sources);
};

/** オーバーロードの識別などに使う、型の比較用キー */
export const getTypeKey = (target: TypeJson | ErrorJson): string => {
    return target.kind === 'error' ? 'error' : JSON.stringify(toBody(target));
};
