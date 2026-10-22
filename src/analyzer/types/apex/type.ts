import typia from 'typia';

import {
    Convert,
    ErrorJson,
    isErrorJson,
    JsonType,
    SourceJson,
    searchConvertAll,
    isError,
    writeSourceKeys,
    removeSourceInfo,
    castExcludeErrorInfo,
    castExcludeErrorInfoArray,
    castConvert,
    castConvertArray,
} from './commons';

import { TypeRefType, ErrorInfo } from './converter';

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

type PrimitiveTypeJson = JsonType & {
    type: 'primitive';
    primitiveType: string;
};
export const isPrimitiveTypeJson = typia.createIs<PrimitiveTypeJson>();

type CustomTypeJson = JsonType & {
    type: 'custom';
    customType: string | string[];
    generic?: Omit<TypeJson, 'kind' | 'sourceKeys'>[];
};
export const isCustomTypeJson = typia.createIs<CustomTypeJson>();

type ArrayTypeJson = JsonType & {
    collectionType: 'array';
    elementType: string;
    dimension: number;
};
export const isArrayTypeJson = typia.createIs<ArrayTypeJson>();

type ListTypeJson = JsonType & {
    collectionType: 'list';
    elementType: Omit<TypeJson, 'kind' | 'sourceKeys'>;
};
export const isListTypeJson = typia.createIs<ListTypeJson>();

type SetTypeJson = JsonType & {
    collectionType: 'set';
    elementType: Omit<TypeJson, 'kind' | 'sourceKeys'>;
};
export const isSetTypeJson = typia.createIs<SetTypeJson>();

type MapTypeJson = JsonType & {
    collectionType: 'map';
    keyType: Omit<TypeJson, 'kind' | 'sourceKeys'>;
    valueType: Omit<TypeJson, 'kind' | 'sourceKeys'>;
};
export const isMapTypeJson = typia.createIs<MapTypeJson>();

export type TypeJson =
    PrimitiveTypeJson | CustomTypeJson | ArrayTypeJson | ListTypeJson | SetTypeJson | MapTypeJson;
export const isTypeJson = typia.createIs<TypeJson>();

export const makeTypeJson = (
    target: Convert<TypeRefType | ErrorInfo>,
    sourceObject: SourceJson[],
): TypeJson | ErrorJson => {
    const targetObjectKey = target.objectKey;
    const targetSourceKey = target.sourceKey;
    const convertJsons = searchConvertAll(target);
    removeSourceInfo(sourceObject, convertJsons, [targetSourceKey]);

    const error: ErrorJson = {
        kind: 'error',
        kindType: 'type',
        sourceKeys: {},
    };

    writeSourceKeys(error, targetObjectKey, targetSourceKey);

    if (isError(convertJsons)) {
        return error;
    }

    const _target = target as Convert<TypeRefType>;

    const collection = castConvertArray(castExcludeErrorInfoArray(_target.value));
    const collectionValue: { collection: string; generic: Convert<TypeRefType>[] | null }[] =
        collection.map((item) => {
            const collection =
                typeof item.value === 'string'
                    ? item.value
                    : castConvert(castExcludeErrorInfo(item.value)).value;
            const typeArgument = castExcludeErrorInfo(item.generic);
            const typeList = typeArgument ? castExcludeErrorInfo(typeArgument.value) : null;
            const generic = typeList
                ? castConvertArray(castExcludeErrorInfoArray(typeList.value))
                : null;

            return { collection, generic };
        });

    const dimension = castConvert(castExcludeErrorInfo(_target.dimension));
    const dimensionValue = castExcludeErrorInfo(dimension.value);

    if (collectionValue.length === 1) {
        const collectionItem = collectionValue.at(0)!;

        if (isPrimitiveType(collectionItem.collection) && !collectionItem.generic) {
            const typeType: PrimitiveTypeJson = {
                kind: 'type',
                sourceKeys: {},
                type: 'primitive',
                primitiveType: collectionItem.collection,
            };
            writeSourceKeys(typeType, targetObjectKey, targetSourceKey);
            return typeType;
        }

        if (dimensionValue && !collectionItem.generic) {
            const typeType: ArrayTypeJson = {
                kind: 'type',
                sourceKeys: {},
                collectionType: 'array',
                elementType: collectionItem.collection,
                dimension: dimensionValue,
            };
            writeSourceKeys(typeType, targetObjectKey, targetSourceKey);
            return typeType;
        }

        if (
            (isListType(collectionItem.collection) || isSetType(collectionItem.collection)) &&
            collectionItem.generic &&
            collectionItem.generic.length === 1
        ) {
            const nestedTypeJson = makeTypeJson(collectionItem.generic.at(0)!, sourceObject);

            if (isTypeJson(nestedTypeJson)) {
                const { kind, sourceKeys, ...content } = nestedTypeJson;
                const typeType: ListTypeJson | SetTypeJson = {
                    kind: 'type',
                    sourceKeys: {},
                    collectionType: isListType(collectionItem.collection) ? 'list' : 'set',
                    elementType: content,
                };
                writeSourceKeys(typeType, targetObjectKey, targetSourceKey);
                return typeType;
            }
        }

        if (
            isMapType(collectionItem.collection) &&
            collectionItem.generic &&
            collectionItem.generic.length === 2
        ) {
            const keyTypeJson = makeTypeJson(collectionItem.generic.at(0)!, sourceObject);
            const valueTypeJson = makeTypeJson(collectionItem.generic.at(1)!, sourceObject);

            if (isTypeJson(keyTypeJson) && isTypeJson(valueTypeJson)) {
                const { kind: _keyKind, sourceKeys: _keySourceKey, ...keyContent } = keyTypeJson;
                const {
                    kind: _valueKind,
                    sourceKeys: _valueSourceKey,
                    ...valueContent
                } = valueTypeJson;

                const typeType: MapTypeJson = {
                    kind: 'type',
                    sourceKeys: {},
                    collectionType: 'map',
                    keyType: keyContent,
                    valueType: valueContent,
                };
                writeSourceKeys(typeType, targetObjectKey, targetSourceKey);
                return typeType;
            }
        }

        const typeType: CustomTypeJson = {
            kind: 'type',
            sourceKeys: {},
            type: 'custom',
            customType: collectionItem.collection,
        };

        const genericedTypes: (TypeJson | ErrorJson)[] = [];
        if (collectionItem.generic && collectionItem.generic.length > 0) {
            genericedTypes.push(
                ...collectionItem.generic.map((item) => {
                    const typeJson = makeTypeJson(item, sourceObject);
                    return typeJson;
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

            writeSourceKeys(typeType, targetObjectKey, targetSourceKey);
            return typeType;
        }
    }

    if (collectionValue.length > 0) {
        const typeType: CustomTypeJson = {
            kind: 'type',
            sourceKeys: {},
            type: 'custom',
            customType: collectionValue.map((collection) => collection.collection),
        };

        const generic = collectionValue.at(-1)!.generic;

        const genericedTypes: (TypeJson | ErrorJson)[] = [];
        if (generic && generic.length > 0) {
            genericedTypes.push(
                ...generic.map((item) => {
                    const typeJson = makeTypeJson(item, sourceObject);
                    return typeJson;
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

            writeSourceKeys(typeType, targetObjectKey, targetSourceKey);
            return typeType;
        }
    }

    return error;
};
