import {
    ArrayTypeContentJson,
    CustomTypeContentJson,
    ListTypeContentJson,
    MapTypeContentJson,
    PrimitiveTypeContentJson,
    SetTypeContentJson,
    TypeContentJson,
    TypeJson,
} from '../../../types';

export type PrimitiveTypeContentDiff = {
    type: 'primitive';
    primitiveType:
        | {
              status: 'unchanged';
              value: string;
          }
        | {
              status: 'changed';
              value: { before: string; after: string };
          };
};

export const makePrimitiveTypeContentDiff = (
    before: PrimitiveTypeContentJson,
    after: PrimitiveTypeContentJson,
): PrimitiveTypeContentDiff => {
    if (before.primitiveType === after.primitiveType) {
        return {
            type: 'primitive',
            primitiveType: {
                status: 'unchanged',
                value: before.primitiveType,
            },
        };
    } else {
        return {
            type: 'primitive',
            primitiveType: {
                status: 'changed',
                value: { before: before.primitiveType, after: after.primitiveType },
            },
        };
    }
};

export type CustomTypeContentDiff = {
    type: 'custom';
    customType:
        | {
              status: 'unchanged';
              value: string | string[];
          }
        | {
              status: 'changed';
              value:
                  | { before: string | string[]; after: string | string[] }
                  | (
                        | {
                              status: 'added' | 'removed' | 'unchanged';
                              value: string;
                          }
                        | {
                              status: 'changed';
                              before: string;
                              after: string;
                          }
                    )[];
          };
    generic?:
        | (TypeContentDiff | { status: 'added' | 'removed'; value: TypeContentJson })[]
        | { status: 'changed'; before: TypeContentJson[] | null; after: TypeContentJson[] | null };
};

export const makeCustomTypeContentDiff = (
    before: CustomTypeContentJson,
    after: CustomTypeContentJson,
): CustomTypeContentDiff => {
    let customTypeDiff: CustomTypeContentDiff['customType'];

    if (
        (typeof before.customType === 'string' &&
            typeof after.customType === 'string' &&
            before.customType === after.customType) ||
        (Array.isArray(before.customType) &&
            Array.isArray(after.customType) &&
            before.customType.every((b, index) => b === after.customType[index]))
    ) {
        customTypeDiff = {
            status: 'unchanged',
            value: before.customType,
        };
    } else if (Array.isArray(before.customType) && Array.isArray(after.customType)) {
        const customTypeArrayDiff: (
            | {
                  status: 'added' | 'removed' | 'unchanged';
                  value: string;
              }
            | {
                  status: 'changed';
                  before: string;
                  after: string;
              }
        )[] = [];

        const length = Math.max(before.customType.length, after.customType.length);

        for (let index = 0; index < length; index++) {
            const b = before.customType[index];
            const a = after.customType[index];

            if (b === undefined && a !== undefined) {
                customTypeArrayDiff.push({
                    status: 'added',
                    value: a,
                });
            } else if (b !== undefined && a === undefined) {
                customTypeArrayDiff.push({
                    status: 'removed',
                    value: b,
                });
            } else if (b !== undefined && a !== undefined) {
                if (b === a) {
                    customTypeArrayDiff.push({
                        status: 'unchanged',
                        value: b,
                    });
                } else {
                    customTypeArrayDiff.push({
                        status: 'changed',
                        before: b,
                        after: a,
                    });
                }
            }
        }

        customTypeDiff = {
            status: 'changed',
            value: customTypeArrayDiff,
        };
    } else {
        customTypeDiff = {
            status: 'changed',
            value: { before: before.customType, after: after.customType },
        };
    }

    const diff: CustomTypeContentDiff = {
        type: 'custom',
        customType: customTypeDiff,
    };

    if (before.generic || after.generic) {
        if (before.generic && after.generic) {
            const genericDiff: (
                TypeContentDiff | { status: 'added' | 'removed'; value: TypeContentJson }
            )[] = [];
            const _after = [...after.generic];

            const length = Math.max(before.generic.length, after.generic.length);

            for (let index = 0; index < length; index++) {
                const b = before.generic[index];
                const a = after.generic[index];

                if (b === undefined && a !== undefined) {
                    genericDiff.push({ status: 'added', value: a });
                } else if (b !== undefined && a === undefined) {
                    genericDiff.push({
                        status: 'removed',
                        value: b,
                    });
                } else if (b !== undefined && a !== undefined) {
                    const typeContentDiff = makeTypeContentDiff(b, a);
                    genericDiff.push(typeContentDiff);
                }
            }
            diff.generic = genericDiff;
        } else {
            diff.generic = {
                status: 'changed',
                before: before.generic || null,
                after: after.generic || null,
            };
        }
    }

    return diff;
};

export type ArrayTypeContentDiff = {
    type: 'array';
    elementType: TypeContentDiff;
    dimention:
        | {
              status: 'unchanged';
              value: number;
          }
        | {
              status: 'changed';
              value: { before: number; after: number };
          };
};

export const makeArrayTypeContentDiff = (
    before: ArrayTypeContentJson,
    after: ArrayTypeContentJson,
): ArrayTypeContentDiff => {
    const elementTypeContentDiff = makeTypeContentDiff(before.elementType, after.elementType);

    return {
        type: 'array',
        elementType: elementTypeContentDiff,
        dimention:
            before.dimension === after.dimension
                ? { status: 'unchanged', value: before.dimension }
                : {
                      status: 'changed',
                      value: { before: before.dimension, after: after.dimension },
                  },
    };
};

export type ListTypeContentDiff = {
    type: 'list';
    elementType: TypeContentDiff;
};

export const makeListTypeContentDiff = (
    before: ListTypeContentJson,
    after: ListTypeContentJson,
): ListTypeContentDiff => {
    return {
        type: 'list',
        elementType: makeTypeContentDiff(before.elementType, after.elementType),
    };
};

export type SetTypeContentDiff = {
    type: 'set';
    elementType: TypeContentDiff;
};

export const makeSetTypeContentDiff = (
    before: SetTypeContentJson,
    after: SetTypeContentJson,
): SetTypeContentDiff => {
    return {
        type: 'set',
        elementType: makeTypeContentDiff(before.elementType, after.elementType),
    };
};

export type MapTypeContentDiff = {
    type: 'map';
    keyType: TypeContentDiff;
    valueType: TypeContentDiff;
};

export const makeMapTypeContentDiff = (
    before: MapTypeContentJson,
    after: MapTypeContentJson,
): MapTypeContentDiff => {
    return {
        type: 'map',
        keyType: makeTypeContentDiff(before.keyType, after.keyType),
        valueType: makeTypeContentDiff(before.valueType, after.valueType),
    };
};

export type TypeContentDiff =
    | PrimitiveTypeContentDiff
    | CustomTypeContentDiff
    | ArrayTypeContentDiff
    | ListTypeContentDiff
    | SetTypeContentDiff
    | MapTypeContentDiff
    | {
          status: 'changed';
          before: TypeContentJson;
          after: TypeContentJson;
      };

export const makeTypeContentDiff = (
    before: TypeContentJson,
    after: TypeContentJson,
): TypeContentDiff => {
    if (before.type === 'primitive' && after.type === 'primitive') {
        return makePrimitiveTypeContentDiff(before, after);
    } else if (before.type === 'custom' && after.type === 'custom') {
        return makeCustomTypeContentDiff(before, after);
    } else if (before.type === 'list' && after.type === 'list') {
        return makeListTypeContentDiff(before, after);
    } else if (before.type === 'set' && after.type === 'set') {
        return makeSetTypeContentDiff(before, after);
    } else if (before.type === 'map' && after.type === 'map') {
        return makeMapTypeContentDiff(before, after);
    } else if (before.type === 'array' && after.type === 'array') {
        return makeArrayTypeContentDiff(before, after);
    } else {
        return {
            status: 'changed',
            before: before,
            after: after,
        };
    }
};

export type TypeDiff = {
    kind: 'type';
    sourceKeys: { before: TypeJson['sourceKeys']; after: TypeJson['sourceKeys'] };
} & TypeContentDiff;

export const makeTypeDiff = (before: TypeJson, after: TypeJson): TypeDiff => {
    const { kind: _beforeKind, sourceKeys: beforeSourceKeys, ...beforeRest } = before;
    const { kind: _afterKind, sourceKeys: afterSourceKeys, ...afterRest } = after;

    return {
        kind: 'type',
        sourceKeys: { before: beforeSourceKeys, after: afterSourceKeys },
        ...makeTypeContentDiff(beforeRest, afterRest),
    };
};
