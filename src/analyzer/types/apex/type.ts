import typia from 'typia';

import {
    Convert,
    GenerateResult,
    ErrorJson,
    isErrorJson,
    JsonType,
    makeJsonType,
    convertExcludeError,
    collectDelteteKeys,
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
    elementType: Omit<TypeJson, 'kind' | 'sourceKeys'>;
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
): GenerateResult<TypeJson | ErrorJson> => {
    const targetRecords: Record<string, string[]> = { [target.objectKey]: [target.sourceKey] };
    const deleteKeys = collectDelteteKeys(target, targetRecords);

    const { value, errorInfos } = convertExcludeError(target);

    const error: ErrorJson = makeJsonType('error', targetRecords, { kindType: 'type' });

    if (!value || errorInfos.length > 0) {
        return { result: error, deleteKeys: deleteKeys };
    }

    const collection = value!.value;
    const dimension = value!.dimension.value;

    if (dimension) {
        const { result } = makeTypeJson({
            type: target.type,
            objectKey: target.objectKey,
            sourceKey: target.sourceKey,
            value: collection,
        } as Convert<TypeRefType>);
        const { kind, sourceKeys, ...content } = result;
        return {
            result: makeJsonType('type', targetRecords, {
                collectionType: 'array',
                elementType: content,
                dimension: dimension,
            }),
            deleteKeys: deleteKeys,
        };
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
            return {
                result: makeJsonType('type', targetRecords, {
                    type: 'primitive',
                    primitiveType: collectionName,
                }),
                deleteKeys: deleteKeys,
            };
        }

        if (
            (isListType(collectionName) || isSetType(collectionName)) &&
            generic &&
            generic.length === 1
        ) {
            const { result } = makeTypeJson(generic.at(0)!);

            if (isTypeJson(result)) {
                const { kind, sourceKeys, ...content } = result;
                return {
                    result: makeJsonType('type', targetRecords, {
                        collectionType: isListType(collectionName) ? 'list' : 'set',
                        elementType: content,
                    }),
                    deleteKeys: deleteKeys,
                };
            }
        }

        if (isMapType(collectionName) && generic && generic.length === 2) {
            const { result: keyResult } = makeTypeJson(generic.at(0)!);
            const { result: valueResult } = makeTypeJson(generic.at(1)!);

            if (isTypeJson(keyResult) && isTypeJson(valueResult)) {
                const { kind: keyKind, sourceKeys: keySourceKeys, ...keyContent } = keyResult;
                const {
                    kind: valueKind,
                    sourceKeys: valueSourceKeys,
                    ...valueContent
                } = valueResult;
                return {
                    result: makeJsonType('type', targetRecords, {
                        collectionType: 'map',
                        keyType: keyContent,
                        valueType: valueContent,
                    }),
                    deleteKeys: deleteKeys,
                };
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
                    const { result } = makeTypeJson(item);
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

            return { result: typeType, deleteKeys: deleteKeys };
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
                    const { result } = makeTypeJson(item);
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

            return { result: typeType, deleteKeys: deleteKeys };
        }
    }

    return { result: error, deleteKeys: deleteKeys };
};
