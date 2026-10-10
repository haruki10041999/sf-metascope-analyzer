import { TypeRef } from './converter';

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
    ].includes(type.toLocaleUpperCase());
};

export type TypeType =
    | {
          kind: 'primitive';
          name: string;
      }
    | {
          kind: 'custom';
          name: string[];
      }
    | {
          kind: 'array';
          name: TypeType;
          dimension: number;
      }
    | {
          kind: 'list' | 'set';
          type: TypeType;
      }
    | {
          kind: 'map';
          keyType: TypeType;
          valueType: TypeType;
      }
    | undefined;

export const makeTypeType = (type: TypeRef): TypeType => {
    if (type.value) {
        if (type.dimension) {
            return {
                kind: 'array',
                name: makeTypeType({ value: type.value }),
                dimension: type.dimension,
            };
        }

        if (type.value.length === 1) {
            const typeName = type.value[0]!.value;
            const typeGeneric = type.value[0]!.generic;
            if (typeName) {
                if (isPrimitiveType(typeName)) {
                    return {
                        kind: 'primitive',
                        name: typeName,
                    };
                }
                if (typeGeneric) {
                    if ((typeName === 'list' || typeName === 'set') && typeGeneric.length === 1) {
                        return {
                            kind: typeName,
                            type: makeTypeType(typeGeneric[0]!),
                        };
                    }

                    if (typeName === 'map' && typeGeneric.length === 2) {
                        return {
                            kind: 'map',
                            keyType: makeTypeType(typeGeneric[0]!),
                            valueType: makeTypeType(typeGeneric[1]!),
                        };
                    }
                }

                return {
                    kind: 'custom',
                    name: [typeName],
                };
            }
        } else {
            return {
                kind: 'custom',
                name: type.value.map((v) => v.value!),
            };
        }
    }

    return undefined;
};
