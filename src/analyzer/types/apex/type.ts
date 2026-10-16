import typia from 'typia';

import { TypeRefClass, TypeNameClass } from './converter';

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
