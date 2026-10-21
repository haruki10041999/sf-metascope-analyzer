import typia from 'typia';

import {
    JsonType,
    SourceJson,
    CommonTypeExtractSourceInfo,
    makeHashKeyAndSplit,
    outputError,
    isCommonWithoutSourceInfo,
} from './commons';

import {
    SourceInfo,
    ErrorType,
    ValueRuleValue,
    isErrorType,
    TypeRefType,
    TypeArgumentsType,
    TypeListType,
    TypeNameType,
    ArraySubscriptsType,
    IdType,
    isIdType,
    isTypeRefType,
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

export const makeTypeType = async (
    target: TypeRefType | ErrorType,
    source: SourceJson[],
): Promise<JsonType<TypeType> | ErrorType> => {
    if (isErrorType(target)) {
        return target;
    }

    const { objectKey, sourceKey, content } = await makeHashKeyAndSplit(target, source);

    const typeRef = makeTypeRef(content) as TypeRef;
};

const _makeTypeType = (typeRef: TypeRef): TypeType => {
    const typeName = typeRef.typeName;
    const dimension = typeRef.arrayDimension;

    if (typeof dimension === 'number' && dimension > 0) {

};

type TypeRef = {
    typeName: (TypeName | ErrorType)[];
    arrayDimension: number | null | ErrorType;
};

type TypeName = {
    collection: string | ErrorType;
    typeList: (TypeRef | ErrorType)[] | ErrorType | null;
};

const makeTypeRef = (
    target: ValueRuleValue<CommonTypeExtractSourceInfo<TypeRefType>>,
): TypeRef | ErrorType => {
    return outputError(target, (target: CommonTypeExtractSourceInfo<TypeRefType>) => {
        const value = target.value;
        const dimension = target.dimension;

        const typeName = value.map((item) => makeTypeName(item));
        const arrayDimension = makeArraySubscripts(dimension);

        return {
            typeName,
            arrayDimension,
        };
    });
};

const makeTypeName = (
    target: ValueRuleValue<CommonTypeExtractSourceInfo<TypeNameType>>,
): TypeName | ErrorType => {
    return outputError(target, (target: CommonTypeExtractSourceInfo<TypeNameType>) => {
        const value = target.value;
        const generic = target.generic;

        const collection = outputError(
            value,
            (target: CommonTypeExtractSourceInfo<IdType> | string) => {
                if (isCommonWithoutSourceInfo(target, isIdType)) {
                    return target.value;
                }

                return target;
            },
        );

        const typeList = generic ? makeTypeArguments(generic) : null;

        return {
            collection,
            typeList,
        };
    });
};

const makeTypeList = (
    target: CommonTypeExtractSourceInfo<TypeListType> | ErrorType,
): (TypeRef | ErrorType)[] | ErrorType => {
    return outputError(target, (target: CommonTypeExtractSourceInfo<TypeListType>) => {
        return target.value.map((item) => makeTypeRef(item));
    });
};

const makeTypeArguments = (
    target: ValueRuleValue<CommonTypeExtractSourceInfo<TypeArgumentsType>>,
): (TypeRef | ErrorType)[] | ErrorType | null => {
    return outputError(target, (target: CommonTypeExtractSourceInfo<TypeArgumentsType>) => {
        return target.value ? makeTypeList(target.value) : null;
    });
};

const makeArraySubscripts = (
    target: ValueRuleValue<CommonTypeExtractSourceInfo<ArraySubscriptsType>>,
): number | null | ErrorType => {
    return outputError(target, (target: CommonTypeExtractSourceInfo<ArraySubscriptsType>) => {
        return outputError(target.value, (target: number | null) => {
            return target;
        });
    });
};
