import typia from 'typia';

import { ConvertExcludeError, ConvertType, ErrorJson, JsonType, convertValue, makeJsonType } from './commons';

import { TypeRefType } from './converter';

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

// 型の中身。境界ノード（TypeJson）は最上位の型だけで、ジェネリクス・要素型はこの形（キーなし）で持つ
type PrimitiveTypeContentJson = {
    type: 'primitive';
    primitiveType: string;
};

type CustomTypeContentJson = {
    type: 'custom';
    customType: string | string[];
    generic?: TypeContentJson[];
};

type ArrayTypeContentJson = {
    collectionType: 'array';
    elementType: TypeContentJson;
    dimension: number;
};

type ListTypeContentJson = {
    collectionType: 'list';
    elementType: TypeContentJson;
};

type SetTypeContentJson = {
    collectionType: 'set';
    elementType: TypeContentJson;
};

type MapTypeContentJson = {
    collectionType: 'map';
    keyType: TypeContentJson;
    valueType: TypeContentJson;
};

export type TypeContentJson =
    | PrimitiveTypeContentJson
    | CustomTypeContentJson
    | ArrayTypeContentJson
    | ListTypeContentJson
    | SetTypeContentJson
    | MapTypeContentJson;

type PrimitiveTypeJson = JsonType<'type'> & PrimitiveTypeContentJson;
export const isPrimitiveTypeJson = typia.createIs<PrimitiveTypeJson>();

type CustomTypeJson = JsonType<'type'> & CustomTypeContentJson;
export const isCustomTypeJson = typia.createIs<CustomTypeJson>();

type ArrayTypeJson = JsonType<'type'> & ArrayTypeContentJson;
export const isArrayTypeJson = typia.createIs<ArrayTypeJson>();

type ListTypeJson = JsonType<'type'> & ListTypeContentJson;
export const isListTypeJson = typia.createIs<ListTypeJson>();

type SetTypeJson = JsonType<'type'> & SetTypeContentJson;
export const isSetTypeJson = typia.createIs<SetTypeJson>();

type MapTypeJson = JsonType<'type'> & MapTypeContentJson;
export const isMapTypeJson = typia.createIs<MapTypeJson>();

export type TypeJson =
    PrimitiveTypeJson | CustomTypeJson | ArrayTypeJson | ListTypeJson | SetTypeJson | MapTypeJson;
export const isTypeJson = typia.createIs<TypeJson>();

// 境界ノードの検査を通った後に呼ぶため、エラーノードは含まれない
const makeTypeContentJson = (target: ConvertExcludeError<TypeRefType>): TypeContentJson => {
    const collection = target.value;
    const dimension = target.dimension.value;

    if (dimension) {
        return {
            collectionType: 'array',
            elementType: makeTypeContentJson({
                ...target,
                dimension: { ...target.dimension, value: null },
            }),
            dimension: dimension,
        };
    }

    const nameOf = (item: (typeof collection)[number]) =>
        typeof item.value === 'string' ? item.value : item.value.value;

    if (collection.length !== 1) {
        const generic = collection.at(-1)?.generic?.value?.value;
        return {
            type: 'custom',
            customType: collection.map(nameOf),
            ...(generic && generic.length > 0
                ? { generic: generic.map((item) => makeTypeContentJson(item)) }
                : {}),
        };
    }

    const collectionItem = collection.at(0)!;
    const collectionName = nameOf(collectionItem);
    const generic = collectionItem.generic?.value?.value ?? null;

    if (isPrimitiveType(collectionName) && !collectionItem.generic) {
        return {
            type: 'primitive',
            primitiveType: collectionName,
        };
    }

    if ((isListType(collectionName) || isSetType(collectionName)) && generic?.length === 1) {
        return {
            collectionType: isListType(collectionName) ? 'list' : 'set',
            elementType: makeTypeContentJson(generic[0]!),
        };
    }

    if (isMapType(collectionName) && generic?.length === 2) {
        return {
            collectionType: 'map',
            keyType: makeTypeContentJson(generic[0]!),
            valueType: makeTypeContentJson(generic[1]!),
        };
    }

    return {
        type: 'custom',
        customType: collectionName,
        ...(generic && generic.length > 0
            ? { generic: generic.map((item) => makeTypeContentJson(item)) }
            : {}),
    };
};

export const makeTypeJson = (target: ConvertType<TypeRefType>): TypeJson | ErrorJson => {
    return convertValue<'typeRef', TypeRefType, TypeJson>(target, 'type', (target, targetRecords) => {
        return makeJsonType('type', targetRecords.base, makeTypeContentJson(target));
    });
};
