import typia from 'typia';

import {
    ErrorJson,
    isErrorJson,
    JsonType,
    makeJsonType,
    convertValue,
    ConvertType,
} from './commons';

import { TypeRefType, ErrorType } from './converter';

const isPrimitiveType = (type: string): boolean => {
    return [
        'BOOLEAN',
        'BLOB',
        'DATE',
        'DATETIME',
        'DECIMAL',
        'DOUBLE',
        'ID',
        'INTEGER',
        'LONG',
        'OBJECT',
        'STRING',
        'TIME',
    ].includes(type.toUpperCase());
};

const isListType = (type: string): boolean => {
    return 'LIST' === type.toUpperCase();
};

const isSetType = (type: string): boolean => {
    return 'SET' === type.toUpperCase();
};

const isMapType = (type: string): boolean => {
    return 'MAP' === type.toUpperCase();
};

type PrimitiveTypeJson = JsonType<'type'> & {
    type: 'primitive';
    primitiveType: string;
};
export const isPrimitiveTypeJson = typia.createIs<PrimitiveTypeJson>();

type CustomTypeJson = JsonType<'type'> & {
    type: 'custom';
    customType: string | string[];
    generic?: Omit<TypeJson | ErrorJson, 'kind' | 'sourceKeys'>[];
};
export const isCustomTypeJson = typia.createIs<CustomTypeJson>();

type ArrayTypeJson = JsonType<'type'> & {
    collectionType: 'array';
    elementType: Omit<TypeJson | ErrorJson, 'kind' | 'sourceKeys'>;
    dimension: number;
};
export const isArrayTypeJson = typia.createIs<ArrayTypeJson>();

type ListTypeJson = JsonType<'type'> & {
    collectionType: 'list';
    elementType: Omit<TypeJson | ErrorJson, 'kind' | 'sourceKeys'>;
};
export const isListTypeJson = typia.createIs<ListTypeJson>();

type SetTypeJson = JsonType<'type'> & {
    collectionType: 'set';
    elementType: Omit<TypeJson | ErrorJson, 'kind' | 'sourceKeys'>;
};
export const isSetTypeJson = typia.createIs<SetTypeJson>();

type MapTypeJson = JsonType<'type'> & {
    collectionType: 'map';
    keyType: Omit<TypeJson | ErrorJson, 'kind' | 'sourceKeys'>;
    valueType: Omit<TypeJson | ErrorJson, 'kind' | 'sourceKeys'>;
};
export const isMapTypeJson = typia.createIs<MapTypeJson>();

export type TypeJson =
    PrimitiveTypeJson | CustomTypeJson | ArrayTypeJson | ListTypeJson | SetTypeJson | MapTypeJson;
export const isTypeJson = typia.createIs<TypeJson>();

export const makeTypeJson = (
    target: ConvertType<TypeRefType>,
    targetRecords?: Record<string, string[]>,
): TypeJson | ErrorJson => {
    // ConvertType は条件型のため target から TCommonType を推論できず、明示しないと CommonType<'typeRef'> に落ちる
    return convertValue<'typeRef', TypeRefType, TypeJson>(
        ['typeRef'],
        target,
        'type',
        (target, targetRecords) => {
            const collection = target.value;
            const dimension = target.dimension.value;

            if (dimension) {
                const result = makeTypeJson({
                    ...target,
                    dimension: { ...target.dimension, value: null },
                });
                const { kind, sourceKeys, ...content } = result;
                return makeJsonType('type', targetRecords, {
                    collectionType: 'array',
                    elementType: content,
                    dimension: dimension,
                });
            }

            if (collection.length === 1) {
                const collectionItem = collection.at(0)!;
                const collectionName =
                    typeof collectionItem.value === 'string'
                        ? collectionItem.value
                        : collectionItem.value.value;
                const generic = collectionItem.generic
                    ? collectionItem.generic.value
                        ? collectionItem.generic.value.value
                        : null
                    : null;

                if (isPrimitiveType(collectionName) && !collectionItem.generic) {
                    return makeJsonType('type', targetRecords, {
                        type: 'primitive',
                        primitiveType: collectionName,
                    });
                }

                if (
                    (isListType(collectionName) || isSetType(collectionName)) &&
                    generic &&
                    generic.length === 1
                ) {
                    const result = makeTypeJson(generic.at(0)!);

                    const { kind, sourceKeys, ...content } = result;
                    return makeJsonType('type', targetRecords, {
                        collectionType: isListType(collectionName) ? 'list' : 'set',
                        elementType: content,
                    });
                }

                if (isMapType(collectionName) && generic && generic.length === 2) {
                    const keyResult = makeTypeJson(generic.at(0)!);
                    const valueResult = makeTypeJson(generic.at(1)!);

                    const { kind: keyKind, sourceKeys: keySourceKeys, ...keyContent } = keyResult;
                    const {
                        kind: valueKind,
                        sourceKeys: valueSourceKeys,
                        ...valueContent
                    } = valueResult;
                    return makeJsonType('type', targetRecords, {
                        collectionType: 'map',
                        keyType: keyContent,
                        valueType: valueContent,
                    });
                }

                return makeJsonType('type', targetRecords, {
                    type: 'custom',
                    customType: collectionName,
                    ...(generic && generic.length > 0
                        ? {
                              generic: generic.map((item) => {
                                  return makeTypeJson(item);
                              }),
                          }
                        : {}),
                });
            } else {
                const generic = collection.at(-1)!.generic?.value?.value;
                return makeJsonType('type', targetRecords, {
                    type: 'custom',
                    customType: collection.map((c) =>
                        typeof c.value === 'string' ? c.value : c.value.value,
                    ),
                    ...(generic && generic.length > 0
                        ? {
                              generic: generic.map((item) => {
                                  const result = makeTypeJson(item);
                                  return result;
                              }),
                          }
                        : {}),
                });
            }
        },
        targetRecords,
    );
};

