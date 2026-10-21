import typia from 'typia';

import {
    Convert,
    ErrorJson,
    isConvert,
    SourceJson,
    searchConvertAll,
    isError,
    writeSourceKeys,
    removeSourceInfo,
} from './commons';

import {
    SourceInfo,
    ValueRuleValue,
    TypeRefType,
    TypeArgumentsType,
    TypeListType,
    TypeNameType,
    ArraySubscriptsType,
    IdType,
    isIdType,
    isTypeRefType,
    ErrorInfo,
} from './converter';

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

type PrimitiveTypeType = {
    kind: 'primitive';
    name: string;
};

type CustomTypeType = {
    kind: 'custom';
    name: string[];
    generic?: TypeType[];
};

type ArrayTypeType = {
    kind: 'array';
    name: TypeType;
    dimension: number;
};

type ListTypeType = {
    kind: 'list';
    type: TypeType;
};

type SetTypeType = {
    kind: 'set';
    type: TypeType;
};

type MapTypeType = {
    kind: 'map';
    keyType: TypeType;
    valueType: TypeType;
};

export type TypeType = { objectType: 'type' } & (
    PrimitiveTypeType | CustomTypeType | ArrayTypeType | ListTypeType | SetTypeType | MapTypeType
);

export const isTypeType = typia.createIs<TypeType>();

export const makeTypeType = (
    target: Convert<TypeRefType | ErrorInfo>,
    sourceObject: SourceJson[],
) => {
    const convertJsons = searchConvertAll(target);
    if (isError(convertJsons)) {
        const error: ErrorJson = {
            kind: 'error',
            kindType: 'type',
            souceKeys: {},
        };
        writeSourceKeys(error, target.objectKey, target.sourceKey);
        removeSourceInfo(sourceObject, convertJsons, error.souceKeys[target.objectKey]!);

        return error;
    }

    const _target = target as Convert<TypeRefType>;

    const { value:collection,generic:generic } = _target.value as TypeNameType[];
    const {value:dimension} = _target.dimension as ArraySubscriptsType;

    if (dimension)
};
