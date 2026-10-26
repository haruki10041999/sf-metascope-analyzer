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
    generic?: Omit<TypeJson, 'kind' | 'sourceKeys'>[];
};
export const isCustomTypeJson = typia.createIs<CustomTypeJson>();

type ArrayTypeJson = JsonType<'type'> & {
    collectionType: 'array';
    elementType: Omit<TypeJson, 'kind' | 'sourceKeys'>;
    dimension: number;
};
export const isArrayTypeJson = typia.createIs<ArrayTypeJson>();

type ListTypeJson = JsonType<'type'> & {
    collectionType: 'list';
    elementType: Omit<TypeJson, 'kind' | 'sourceKeys'>;
};
export const isListTypeJson = typia.createIs<ListTypeJson>();

type SetTypeJson = JsonType<'type'> & {
    collectionType: 'set';
    elementType: Omit<TypeJson, 'kind' | 'sourceKeys'>;
};
export const isSetTypeJson = typia.createIs<SetTypeJson>();

type MapTypeJson = JsonType<'type'> & {
    collectionType: 'map';
    keyType: Omit<TypeJson, 'kind' | 'sourceKeys'>;
    valueType: Omit<TypeJson, 'kind' | 'sourceKeys'>;
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
    return convertValue<'typeRef', 'type', TypeRefType, TypeJson>(
        ['typeRef'],
        target,
        ['type'],
        'type',
        (target, targetRecords, errorJson) => {
            const collection = target.value;
            const dimension = target.dimension.value;

            if (dimension) {
                // 次元を外した要素型として再帰する
                const result = makeTypeJson({
                    ...target,
                    dimension: { ...target.dimension, value: null },
                });
                const { kind, sourceKeys, ...content } = result as TypeJson;
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

                    if (isTypeJson(result)) {
                        const { kind, sourceKeys, ...content } = result as TypeJson;
                        return makeJsonType('type', targetRecords, {
                            collectionType: isListType(collectionName) ? 'list' : 'set',
                            elementType: content,
                        });
                    }
                }

                if (isMapType(collectionName) && generic && generic.length === 2) {
                    const keyResult = makeTypeJson(generic.at(0)!);
                    const valueResult = makeTypeJson(generic.at(1)!);

                    if (isTypeJson(keyResult) && isTypeJson(valueResult)) {
                        const {
                            kind: keyKind,
                            sourceKeys: keySourceKeys,
                            ...keyContent
                        } = keyResult;
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
                }

                const typeType: CustomTypeJson = makeJsonType('type', targetRecords, {
                    type: 'custom',
                    customType: collectionName,
                });

                const genericedTypes: (TypeJson | ErrorJson)[] = [];
                if (generic && generic.length > 0) {
                    genericedTypes.push(
                        ...generic.map((item) => {
                            const result = makeTypeJson(item);
                            return result;
                        }),
                    );
                }

                if (
                    genericedTypes.length === 0 ||
                    (genericedTypes.length > 0 && !genericedTypes.some((item) => isErrorJson(item)))
                ) {
                    if (genericedTypes.length > 0) {
                        typeType.generic = (genericedTypes as TypeJson[]).map(
                            ({ kind, sourceKeys, ...content }) => content,
                        );
                    }

                    return typeType;
                }
            }

            if (collection.length > 0) {
                const typeType: CustomTypeJson = makeJsonType('type', targetRecords, {
                    type: 'custom',
                    customType: collection.map((c) =>
                        typeof c.value === 'string' ? c.value : c.value.value,
                    ),
                });

                const genericTypeRef = collection.at(-1)!;
                const generic = genericTypeRef.generic
                    ? genericTypeRef.generic.value
                        ? genericTypeRef.generic.value.value
                        : null
                    : null;

                const genericedTypes: (TypeJson | ErrorJson)[] = [];
                if (generic && generic.length > 0) {
                    genericedTypes.push(
                        ...generic.map((item) => {
                            const result = makeTypeJson(item);
                            return result;
                        }),
                    );
                }

                if (
                    genericedTypes.length === 0 ||
                    (genericedTypes.length > 0 && !genericedTypes.some((item) => isErrorJson(item)))
                ) {
                    if (genericedTypes.length > 0) {
                        typeType.generic = (genericedTypes as TypeJson[]).map(
                            ({ kind, sourceKeys, ...content }) => content,
                        );
                    }

                    return typeType;
                }
            }

            return errorJson;
        },
        targetRecords,
    );
};
