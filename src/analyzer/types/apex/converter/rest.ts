import {
    ErrorTypeClass,
    ArrayCreatorRestTypeClass,
    ClassCreatorRestTypeClass,
    CreatorTypeClass,
    MapCreatorRestTypeClass,
    NoRestTypeClass,
    SetCreatorRestTypeClass,
    isArrayCreatorRestType,
    isArrayInitializerType,
    isClassCreatorRestType,
    isCreatedNameType,
    isExpressionTypeAll,
    isMapCreatorRestPairType,
    isMapCreatorRestType,
    isNoRestType,
    isNormalArgumentsType,
    isRestTypeAll,
    isSetCreatorRestType,
} from '../../apex_IR';

import { toPrimitiveValue, toTypeClass, CommonClass, isCommonClass } from './commons';
import { normalArgumentsConvert } from './arguments';
import { Expression, expressionConvert } from './expression';
import { createdNameConvert } from './name';
import { IdCreatedNamePair, MapCreatorRestPair, mapCreatorRestPairConvert } from './pair';
import { arrayInitializerConvert } from './variable';

export class ArrayCreatorRestClass extends CommonClass {
    private value: Expression[];
    private size: Expression | null;

    constructor(value: Expression[], size: Expression | null) {
        super();
        this.value = value;
        this.size = size;
    }

    getValue(): Expression[] {
        return this.value;
    }

    getSize(): Expression | null {
        return this.size;
    }
}

export const isArrayCreatorRestClass = (target: CommonClass): target is ArrayCreatorRestClass => {
    return isCommonClass(target, ArrayCreatorRestClass);
};

export type ArrayCreatorRest = {
    value: Expression[];
    size?: Expression;
};

export const arrayCreatorRestConvert = (
    target: ArrayCreatorRestTypeClass,
    errorClass: ErrorTypeClass[],
): ArrayCreatorRest => {
    const arrayCreatorRest: ArrayCreatorRest = {
        value: [],
    };

    const value = target.getValue();
    if (value) {
        const valueTypeClass = toTypeClass(value, isArrayInitializerType, errorClass);
        if (valueTypeClass) {
            arrayCreatorRest.value.push(...arrayInitializerConvert(valueTypeClass, errorClass));
        }
    }

    const sizeValue = target.getSize();
    if (sizeValue) {
        const sizeTypeClass = toTypeClass(sizeValue, isExpressionTypeAll, errorClass);
        if (sizeTypeClass) {
            const expression = expressionConvert(sizeTypeClass, errorClass);
            if (expression) {
                arrayCreatorRest.size = expression;
            }
        }
    }

    return arrayCreatorRest;
};

export const classCreatorRestConvert = (
    target: ClassCreatorRestTypeClass,
    errorClass: ErrorTypeClass[],
): Expression[] => {
    const valueTypeClass = toTypeClass(target.getValue(), isNormalArgumentsType, errorClass);
    if (valueTypeClass) {
        return normalArgumentsConvert(valueTypeClass, errorClass);
    }

    return [];
};

export const mapCreatorRestConvert = (
    target: MapCreatorRestTypeClass,
    errorClass: ErrorTypeClass[],
): MapCreatorRestPair[] => {
    const values: MapCreatorRestPair[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isMapCreatorRestPairType, errorClass);
        if (valueTypeClass) {
            values.push(mapCreatorRestPairConvert(valueTypeClass, errorClass));
        }
    });
    return values;
};

export const noRestConvert = (
    target: NoRestTypeClass,
    errorClass: ErrorTypeClass[],
): string | undefined => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export const setCreatorRestConvert = (
    target: SetCreatorRestTypeClass,
    errorClass: ErrorTypeClass[],
): Expression[] => {
    const values: Expression[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isExpressionTypeAll, errorClass);
        if (valueTypeClass) {
            const expression = expressionConvert(valueTypeClass, errorClass);
            if (expression) {
                values.push(expression);
            }
        }
    });
    return values;
};

export abstract class RestElementClass<TType, TValue, TContent> extends CommonClass {
    private type: TType;
    private value: TValue;
    private content: TContent;

    constructor(type: TType, value: TValue, content: TContent) {
        super();
        this.type = type;
        this.value = value;
        this.content = content;
    }

    getType(): TType {
        return this.type;
    }

    getValue(): TValue {
        return this.value;
    }

    getContent(): TContent {
        return this.content;
    }
}

export const isRestElementClass = (
    target: CommonClass,
): target is RestElementClass<unknown, unknown, unknown> => {
    return isCommonClass(target, RestElementClass);
};

export class ArrayRestElementClass extends RestElementClass<
    'array',
    IdCreatedNamePair[],
    ArrayCreatorRestClass
> {
    constructor(value: IdCreatedNamePair[], content: ArrayCreatorRestClass) {
        super('array', value, content);
    }
}

export const isArrayElementClass = (target: CommonClass): target is ArrayRestElementClass => {
    return isCommonClass(target, ArrayRestElementClass);
};

export class ExpressionArrayRestElementClass extends RestElementClass<
    'class' | 'set',
    IdCreatedNamePair[],
    Expression[]
> {
    constructor(type: 'class' | 'set', value: IdCreatedNamePair[], content: Expression[]) {
        super(type, value, content);
    }
}

export const isExpressionArrayRestElementClass = (
    target: CommonClass,
): target is ExpressionArrayRestElementClass => {
    return isCommonClass(target, ExpressionArrayRestElementClass);
};

export class MapRestElementClass extends RestElementClass<
    'map',
    IdCreatedNamePair[],
    MapCreatorRestPair[]
> {
    constructor(value: IdCreatedNamePair[], content: MapCreatorRestPair[]) {
        super('map', value, content);
    }
}

export const isMapRestElementClass = (target: CommonClass): target is MapRestElementClass => {
    return isCommonClass(target, MapRestElementClass);
};

export class NoRestElementClass extends RestElementClass<'no', IdCreatedNamePair[], string | null> {
    constructor(value: IdCreatedNamePair[], content: string | null) {
        super('no', value, content);
    }
}

export const isNoRestElementClass = (target: CommonClass): target is NoRestElementClass => {
    return isCommonClass(target, NoRestElementClass);
};

export class CreatorClass extends CommonClass {
    private value: RestElementClass<unknown, unknown, unknown>;

    constructor(value: RestElementClass<unknown, unknown, unknown>) {
        super();
        this.value = value;
    }

    getValue(): RestElementClass<unknown, unknown, unknown> {
        return this.value;
    }
}

export const isCreatorClass = (target: CommonClass): target is CreatorClass => {
    return isCommonClass(target, CreatorClass);
};

export type Creator =
    | {
          type: 'array';
          value: IdCreatedNamePair[];
          content: ArrayCreatorRest;
      }
    | {
          type: 'class';
          value: IdCreatedNamePair[];
          content: Expression[];
      }
    | {
          type: 'map';
          value: IdCreatedNamePair[];
          content: MapCreatorRestPair[];
      }
    | {
          type: 'no';
          value: IdCreatedNamePair[];
          content?: string;
      }
    | {
          type: 'set';
          value: IdCreatedNamePair[];
          content: Expression[];
      };

export const creatorConvert = (
    target: CreatorTypeClass,
    errorClass: ErrorTypeClass[],
): Creator | undefined => {
    const createdName: IdCreatedNamePair[] = [];

    const valueTypeClass = toTypeClass(target.getValue(), isCreatedNameType, errorClass);
    if (valueTypeClass) {
        createdName.push(...createdNameConvert(valueTypeClass, errorClass));
    }

    const contentTypeClass = toTypeClass(target.getContent(), isRestTypeAll, errorClass);

    let creator: Creator | undefined = undefined;

    if (contentTypeClass) {
        if (isArrayCreatorRestType(contentTypeClass)) {
            creator = {
                type: 'array',
                value: createdName,
                content: {
                    value: [],
                },
            };

            const content = arrayCreatorRestConvert(contentTypeClass, errorClass);
            creator.content.value.push(...content.value);
            if (content.size) {
                creator.content.size = content.size;
            }
        }
        if (isClassCreatorRestType(contentTypeClass)) {
            creator = {
                type: 'class',
                value: createdName,
                content: [],
            };

            creator.content.push(...classCreatorRestConvert(contentTypeClass, errorClass));
        }
        if (isMapCreatorRestType(contentTypeClass)) {
            creator = {
                type: 'map',
                value: createdName,
                content: [],
            };
            creator.content.push(...mapCreatorRestConvert(contentTypeClass, errorClass));
        }
        if (isNoRestType(contentTypeClass)) {
            creator = {
                type: 'no',
                value: createdName,
            };
            const content = noRestConvert(contentTypeClass, errorClass);
            if (content) {
                creator.content = content;
            }
        }
        if (isSetCreatorRestType(contentTypeClass)) {
            creator = {
                type: 'set',
                value: createdName,
                content: [],
            };

            creator.content.push(...setCreatorRestConvert(contentTypeClass, errorClass));
        }
    }

    return creator;
};
