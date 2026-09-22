import {
    VariableDeclaratorsContext,
    VariableDeclaratorContext,
    TypeNameContext,
} from '@apexdevtools/apex-parser';

export type CommonPrimitiveType =
    | 'Id'
    | 'String'
    | 'Double'
    | 'Integer'
    | 'Long'
    | 'Boolean'
    | 'Date'
    | 'DateTime'
    | 'Time'
    | 'Decimal'
    | 'Blob'
    | 'Object';

const COMMON_PRIMITIVE_TYPES: CommonPrimitiveType[] = [
    'Id',
    'String',
    'Double',
    'Integer',
    'Long',
    'Boolean',
    'Date',
    'DateTime',
    'Time',
    'Decimal',
    'Blob',
    'Object',
];

export type ApexType =
    | {
          type: 'void';
      }
    | {
          type: 'primitive';
          name: CommonPrimitiveType;
      }
    | {
          type: 'custom';
          name: string;
      }
    | {
          type: 'List' | 'Set';
          elementType: ApexType;
      }
    | {
          type: 'Map';
          keyType: ApexType;
          valueType: ApexType;
      };

export type ApexParameter = {
    identifier: string;
    type: ApexType;
};

const isCommonPrimitiveType = (type: string): type is CommonPrimitiveType => {
    return COMMON_PRIMITIVE_TYPES.includes(type as CommonPrimitiveType);
};

const isList = (type: string): boolean => {
    return /^List<.+>$/.test(type);
};

const isSet = (type: string): boolean => {
    return /^Set<.+>$/.test(type);
};

const isMap = (type: string): boolean => {
    return /^Map<.+>$/.test(type);
};

const getGenericType = (type: string): string => {
    const match = type.match(/<(.+)>/);
    return match![1]!;
};

const makeApexType = (type: string): ApexType => {
    if (type === 'void') {
        return {
            type: 'void',
        };
    }

    if (isCommonPrimitiveType(type)) {
        return {
            type: 'primitive',
            name: type,
        };
    }

    if (isList(type) || isSet(type)) {
        const result = getGenericType(type);
        return {
            type: isList(type) ? 'List' : 'Set',
            elementType: makeApexType(result),
        };
    }

    if (isMap(type)) {
        const result = getGenericType(type);

        const index = result.indexOf(',');
        const keyType = result.slice(0, index).trim();
        const valueType = result.slice(index + 1).trim();
        return {
            type: 'Map',
            keyType: makeApexType(keyType),
            valueType: makeApexType(valueType),
        };
    }

    return {
        type: 'custom',
        name: type,
    };
};
