import typia from 'typia';

import {
    TypeRefTypeClass,
    TypeNameTypeClass,
    TypeListTypeClass,
    TypeArgumentsTypeClass,
    isTypeRefType,
    isNormalIdType,
    NormalIdTypeClass,
    isTypeArgumentsType,
    isTypeListType,
    isTypeNameType,
    isArraySubscriptsType,
    ArraySubscriptsTypeClass,
} from '../apex_IR';

import {
    SourceInfo,
    ErrorInfo,
    assignMultiClass,
    makeErrorAssignRule,
    isTargetTypeClass,
    SourceInfoMap,
    makeEmptySourceInfoMap,
    makeSingleSourceInfoMap,
} from './converter/commons';

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

export const isPrimitiveTypeType = typia.createIs<PrimitiveTypeType>();

type CustomTypeType = {
    kind: 'custom';
    name: string[];
    generic?: TypeType[];
};

export const isCustomTypeType = typia.createIs<CustomTypeType>();

type ArrayTypeType = {
    kind: 'array';
    name: TypeType;
    dimension: number;
};

export const isArrayTypeType = typia.createIs<ArrayTypeType>();

type ListTypeType = {
    kind: 'list';
    type: TypeType;
};

export const isListTypeType = typia.createIs<ListTypeType>();

type SetTypeType = {
    kind: 'set';
    type: TypeType;
};

export const isSetTypeType = typia.createIs<SetTypeType>();

type MapTypeType = {
    kind: 'map';
    keyType: TypeType;
    valueType: TypeType;
};

export const isMapTypeType = typia.createIs<MapTypeType>();

export type TypeType =
    PrimitiveTypeType | CustomTypeType | ArrayTypeType | ListTypeType | SetTypeType | MapTypeType;

export const isTypeType = typia.createIs<TypeType>();

type TypeRefTypeResult = {
    typeRef: TypeNameTypeResult[];
    arrayDimension: number | null | void;
};

type TypeNameTypeResult = {
    collection: string | null | void;
    generic: TypeRefTypeResult[] | null | void;
};

export const makeTypeListType = (
    typeListTypeClass: TypeListTypeClass,
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): TypeRefTypeResult[] => {
    const typeListType = typeListTypeClass.getType();
    const typeListSourceInfoMap = makeEmptySourceInfoMap();

    const typeList: TypeRefTypeResult[] = typeListTypeClass
        .getValue()
        .map((value, index) =>
            assignMultiClass(value, [
                {
                    isValid: (target: unknown) => isTargetTypeClass(target, isTypeRefType),
                    construct: (typeClass: TypeRefTypeClass) => {
                        const typeRefSourceInfoMap = makeEmptySourceInfoMap();
                        const typeRef = makeTypeRefType(typeClass, typeRefSourceInfoMap, errorInfo);
                        typeListSourceInfoMap[`${typeClass.getType()}_${index}`] =
                            typeRefSourceInfoMap;
                        return typeRef;
                    },
                },
                makeErrorAssignRule(errorInfo),
            ]),
        )
        .filter((item) => item != null);

    sourceInfo[typeListType] = typeListSourceInfoMap;
    return typeList;
};

export const makeTypeNameType = (
    typeNameTypeClass: TypeNameTypeClass,
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): TypeNameTypeResult => {
    const typeNameType = typeNameTypeClass.getType();
    const typeNameSourceInfoMap = makeEmptySourceInfoMap();
    const collection = assignMultiClass(typeNameTypeClass.getValue(), [
        {
            isValid: (target: unknown) => isTargetTypeClass(target, isNormalIdType),
            construct: (typeClass: NormalIdTypeClass) => {
                typeNameSourceInfoMap[typeNameType] = makeSingleSourceInfoMap(typeClass);
                return typeClass.getValue();
            },
        },
        {
            isValid: (target: unknown) => typeof target === 'string' && target === 'list',
            construct: (typeClass: 'list') => {
                return typeClass;
            },
        },
        {
            isValid: (target: unknown) => typeof target === 'string' && target === 'set',
            construct: (typeClass: 'set') => {
                return typeClass;
            },
        },
        {
            isValid: (target: unknown) => typeof target === 'string' && target === 'map',
            construct: (typeClass: 'map') => {
                return typeClass;
            },
        },
        makeErrorAssignRule(errorInfo),
    ]);
    const generic = assignMultiClass(typeNameTypeClass.getGeneric(), [
        {
            isValid: (target: unknown) => isTargetTypeClass(target, isTypeArgumentsType),
            construct: (typeClass: TypeArgumentsTypeClass) => {
                const typeArugumentsType = typeClass.getType();
                const typeArgumentsSourceInfoMap = makeEmptySourceInfoMap();
                return assignMultiClass(typeClass.getValue(), [
                    {
                        isValid: (target: unknown) => isTargetTypeClass(target, isTypeListType),
                        construct: (typeClass: TypeListTypeClass) => {
                            const typeList = makeTypeListType(
                                typeClass,
                                typeArgumentsSourceInfoMap,
                                errorInfo,
                            );
                            typeNameSourceInfoMap[typeArugumentsType] = typeArgumentsSourceInfoMap;
                            return typeList;
                        },
                    },
                    makeErrorAssignRule(errorInfo),
                ]);
            },
        },
        makeErrorAssignRule(errorInfo),
    ]);

    sourceInfo[typeNameType] = typeNameSourceInfoMap;
    return { collection, generic };
};

export const makeTypeRefType = (
    typeRefTypeClass: TypeRefTypeClass,
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): TypeRefTypeResult => {
    const typeRefType = typeRefTypeClass.getType();
    const typeRefSourceInfoMap = makeEmptySourceInfoMap();
    const typeRef = typeRefTypeClass
        .getValue()
        .map((v, index) => {
            const typeRefItem = assignMultiClass(v, [
                {
                    isValid: (target: unknown) => isTargetTypeClass(target, isTypeNameType),
                    construct: (typeClass: TypeNameTypeClass) => {
                        const typeNameSourceInfoMap = makeEmptySourceInfoMap();
                        const typeName = makeTypeNameType(
                            typeClass,
                            typeNameSourceInfoMap,
                            errorInfo,
                        );
                        typeRefSourceInfoMap[`${typeClass.getType()}_${index}`] =
                            typeNameSourceInfoMap;
                        return typeName;
                    },
                },
                makeErrorAssignRule(errorInfo),
            ]);
            return typeRefItem;
        })
        ?.filter((item) => item != null);
    const arrayDimension = assignMultiClass(typeRefTypeClass.getDimension(), [
        {
            isValid: (target: unknown) => isTargetTypeClass(target, isArraySubscriptsType),
            construct: (typeClass: ArraySubscriptsTypeClass) => {
                const arraySubscriptsType = typeClass.getType();
                const arraySubscriptsTypeClass = typeClass;
                return assignMultiClass(typeClass, [
                    {
                        isValid: (target: unknown) => typeof target === 'number',
                        construct: (typeClass: number) => {
                            typeRefSourceInfoMap[arraySubscriptsType] =
                                makeSingleSourceInfoMap(arraySubscriptsTypeClass);
                            return typeClass;
                        },
                    },
                    makeErrorAssignRule(errorInfo),
                ]);
            },
        },
        makeErrorAssignRule(errorInfo),
    ]);

    sourceInfo[typeRefType] = typeRefSourceInfoMap;
    return { typeRef, arrayDimension };
};

const getTypeNameValue = (typeName: TypeNameTypeClass): string | undefined => {
    const value = typeName.getValue();
    if (typeof value === 'string') {
        return value;
    }
    return isTargetTypeClass(value, isNormalIdType) ? value.getValue() : undefined;
};

const getGenericTypeRefs = (typeName: TypeNameTypeClass): TypeRefTypeClass[] | undefined => {
    const argumentsType = typeName.getGeneric();
    if (argumentsType === null) {
        return [];
    }
    if (!isTargetTypeClass(argumentsType, isTypeArgumentsType)) {
        return undefined;
    }

    const typeList = argumentsType.getValue();
    if (!isTargetTypeClass(typeList, isTypeListType)) {
        return undefined;
    }

    const values = typeList.getValue();
    const typeRefs = values.filter((item): item is TypeRefTypeClass =>
        isTargetTypeClass(item, isTypeRefType),
    );
    return typeRefs.length === values.length ? typeRefs : undefined;
};

const makeTypeTypeFromParts = (
    typeNames: TypeNameTypeClass[],
    dimension: number,
): TypeType | undefined => {
    if (typeNames.length === 0) {
        return undefined;
    }

    if (dimension > 0) {
        const arrayedTypeType = makeTypeTypeFromParts(typeNames, 0);
        return arrayedTypeType
            ? {
                  kind: 'array',
                  name: arrayedTypeType,
                  dimension,
              }
            : undefined;
    }

    if (typeNames.length === 1) {
        const typeName = getTypeNameValue(typeNames[0]!);
        if (!typeName) {
            return undefined;
        }

        const generic = getGenericTypeRefs(typeNames[0]!);
        if (!generic) {
            return undefined;
        }
        if (isPrimitiveType(typeName)) {
            return {
                kind: 'primitive',
                name: typeName,
            };
        }

        if (generic.length > 0) {
            if ((isListType(typeName) || isSetType(typeName)) && generic.length === 1) {
                const innerType = makeTypeType(generic[0]!);
                if (innerType) {
                    return {
                        kind: isListType(typeName) ? 'list' : 'set',
                        type: innerType,
                    };
                }
            }

            if (isMapType(typeName) && generic.length === 2) {
                const keyType = makeTypeType(generic[0]!);
                const valueType = makeTypeType(generic[1]!);

                if (keyType && valueType) {
                    return {
                        kind: 'map',
                        keyType,
                        valueType,
                    };
                }
            }
        }

        const typeType: TypeType = {
            kind: 'custom',
            name: [typeName],
        };

        if (generic.length > 0) {
            typeType.generic = generic
                .map((genericType) => makeTypeType(genericType))
                .filter((genericType) => genericType !== undefined);
        }
        return typeType;
    }

    const names = typeNames.map(getTypeNameValue);
    if (!names.every((name): name is string => name !== undefined)) {
        return undefined;
    }

    const typeType: TypeType = {
        kind: 'custom',
        name: names,
    };
    const generic = getGenericTypeRefs(typeNames.at(-1)!);
    if (!generic) {
        return undefined;
    }
    if (generic.length > 0) {
        typeType.generic = generic
            .map((genericType) => makeTypeType(genericType))
            .filter((genericType) => genericType !== undefined);
    }
    return typeType;
};

export const makeTypeType = (type: TypeRefTypeClass): TypeType | undefined => {
    const value = type.getValue();
    const typeNames = value.filter((item): item is TypeNameTypeClass =>
        isTargetTypeClass(item, isTypeNameType),
    );
    if (typeNames.length !== value.length) {
        return undefined;
    }

    const dimensionClass = type.getDimension();
    if (!isTargetTypeClass(dimensionClass, isArraySubscriptsType)) {
        return undefined;
    }

    const dimension = dimensionClass.getValue();
    return typeof dimension === 'number' ? makeTypeTypeFromParts(typeNames, dimension) : undefined;
};
