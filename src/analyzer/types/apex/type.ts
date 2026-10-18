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
    splitSourceInfo,
} from './commons';

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

export const makeTypeListType = (
    type: string,
    typeListTypeClass: TypeListTypeClass,
    sourceInfo: { [key: string]: SourceInfo },
    errorInfo: ErrorInfo[],
) => {
    const typeListType = typeListTypeClass.getType();

    return assignMultiClass(typeListTypeClass.getValue(), [
        {
            isValid: (target: unknown) => isTargetTypeClass(target, isTypeRefType),
            construct: (typeClass: TypeRefTypeClass) => {
                return makeTypeRefType(
                    [type, typeListType].join('_'),
                    typeClass,
                    sourceInfo,
                    errorInfo,
                );
            },
        },
        makeErrorAssignRule(errorInfo),
    ]);
};

export const makeTypeNameType = (
    type: string,
    typeNameTypeClass: TypeNameTypeClass,
    sourceInfo: { [key: string]: SourceInfo },
    errorInfo: ErrorInfo[],
) => {
    const typeNameType = typeNameTypeClass.getType();
    const collection = assignMultiClass(typeNameTypeClass.getValue(), [
        {
            isValid: (target: unknown) => isTargetTypeClass(target, isNormalIdType),
            construct: (typeClass: NormalIdTypeClass) => {
                return splitSourceInfo(
                    typeClass,
                    [type, typeNameType, typeClass.getType()].join('_'),
                    sourceInfo,
                ).getValue();
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
                return assignMultiClass(typeClass.getValue(), [
                    {
                        isValid: (target: unknown) => isTargetTypeClass(target, isTypeListType),
                        construct: (typeClass: TypeListTypeClass) => {
                            return makeTypeListType(
                                [type, typeNameType, typeArugumentsType].join('_'),
                                typeClass,
                                sourceInfo,
                                errorInfo,
                            );
                        },
                    },
                    makeErrorAssignRule(errorInfo),
                ]);
            },
        },
        makeErrorAssignRule(errorInfo),
    ]);
};

export const makeTypeRefType = (
    type: string,
    typeRefTypeClass: TypeRefTypeClass,
    sourceInfo: { [key: string]: SourceInfo },
    errorInfo: ErrorInfo[],
) => {
    const typeRefType = typeRefTypeClass.getType();
    const typeRef = typeRefTypeClass.getValue().forEach((v) => {
        return assignMultiClass(v, [
            {
                isValid: (target: unknown) => isTargetTypeClass(target, isTypeNameType),
                construct: (typeClass: TypeNameTypeClass) => {
                    return makeTypeNameType(
                        [type, typeRefType].join('_'),
                        typeClass,
                        sourceInfo,
                        errorInfo,
                    );
                },
            },
            makeErrorAssignRule(errorInfo),
        ]);
    });
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
                            splitSourceInfo(
                                arraySubscriptsTypeClass,
                                [type, typeRefType, arraySubscriptsType].join('_'),
                                sourceInfo,
                            );
                            return typeClass;
                        },
                    },
                    makeErrorAssignRule(errorInfo),
                ]);
            },
        },
        makeErrorAssignRule(errorInfo),
    ]);

    return { type, arrayDimension };
};

export const makeTypeType = (type: TypeRefClass): TypeType | undefined => {
    const value = type.getValue();
    const dimension = type.getDimension();

    if (value && value.length > 0) {
        if (dimension) {
            const arrayedType = new TypeRefClass();
            arrayedType.setValue(value);
            const arrayedTypeType = makeTypeType(arrayedType);

            if (arrayedTypeType) {
                return {
                    kind: 'array',
                    name: arrayedTypeType,
                    dimension: dimension,
                };
            }
        }

        if (value.length === 1) {
            const typeName = value.at(0)!.getValue();
            const generic = value.at(0)!.getGeneric();

            if (typeName) {
                if (isPrimitiveType(typeName)) {
                    return {
                        kind: 'primitive',
                        name: typeName,
                    };
                }

                if (generic.length > 0) {
                    if ((isListType(typeName) || isSetType(typeName)) && generic.length === 1) {
                        const type = makeTypeType(generic.at(0)!);
                        if (type) {
                            return {
                                kind: isListType(typeName) ? 'list' : 'set',
                                type: type,
                            };
                        }
                    }

                    if (isMapType(typeName) && generic.length === 2) {
                        const keyType = makeTypeType(generic.at(0)!);
                        const valueType = makeTypeType(generic.at(1)!);

                        if (keyType && valueType) {
                            return {
                                kind: 'map',
                                keyType: keyType,
                                valueType: valueType,
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
                        .map((g) => makeTypeType(g))
                        .filter((g) => g !== undefined);
                }
                return typeType;
            }
        } else {
            const typeType: TypeType = {
                kind: 'custom',
                name: type.getValue().map((v) => v.getValue()!),
            };

            if (type.getValue().at(-1) && type.getValue().at(-1)!.getGeneric().length > 0) {
                const generic = type.getValue().at(-1)!.getGeneric();
                typeType.generic = generic
                    .map((g) => makeTypeType(g))
                    .filter((g) => g !== undefined);
            }
            return typeType;
        }
    }

    return undefined;
};
