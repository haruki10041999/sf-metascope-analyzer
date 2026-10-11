import { TypeRef, TypeName } from './converter';

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

export type TypeType =
    | {
          kind: 'primitive';
          name: string;
      }
    | {
          kind: 'custom';
          name: string[];
          generic?: TypeType[];
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
    | {
          kind: 'unSupported';
      };

export const makeTypeType = (type: TypeRef): TypeType => {
    const { value, dimension }: TypeRef = type;

    if (value && value.length > 0) {
        if (dimension) {
            return {
                kind: 'array',
                name: makeTypeType({ value: value }),
                dimension: dimension,
            };
        }

        if (value.length === 1) {
            const { value: typeName, generic }: TypeName = value.at(0)!;

            if (typeName) {
                if (isPrimitiveType(typeName)) {
                    return {
                        kind: 'primitive',
                        name: typeName,
                    };
                }

                if (generic) {
                    if ((isListType(typeName) || isSetType(typeName)) && generic.length === 1) {
                        return {
                            kind: isListType(typeName) ? 'list' : 'set',
                            type: makeTypeType(generic.at(0)!),
                        };
                    }

                    if (isMapType(typeName) && generic.length === 2) {
                        return {
                            kind: 'map',
                            keyType: makeTypeType(generic.at(0)!),
                            valueType: makeTypeType(generic.at(1)!),
                        };
                    }
                }

                const typeType: TypeType = {
                    kind: 'custom',
                    name: [typeName],
                };

                if (generic) {
                    typeType.generic = generic.map((g) => makeTypeType(g));
                }
                return typeType;
            }
        } else {
            const typeType: TypeType = {
                kind: 'custom',
                name: type.value.map((v) => v.value!),
            };

            if (type.value.at(-1) && type.value.at(-1)!.generic) {
                const generic = type.value.at(-1)!.generic;
                typeType.generic = generic.map((g) => makeTypeType(g));
            }
            return typeType;
        }
    }

    return {
        kind: 'unSupported',
    };
};
