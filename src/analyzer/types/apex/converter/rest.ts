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
import { ExpressionClass, expressionConvert } from './expression';
import { createdNameConvert } from './name';
import { IdCreatedNamePairClass, MapCreatorRestPairClass, mapCreatorRestPairConvert } from './pair';
import { arrayInitializerConvert } from './variable';

export class ArrayCreatorRestClass extends CommonClass {
    private value: ExpressionClass[] = [];
    private size: ExpressionClass = new ExpressionClass();

    resetValue(): void {
        this.value = [];
    }

    setValue(value: ExpressionClass[]): void {
        this.value.push(...value);
    }

    setSize(size: ExpressionClass) {
        this.size.copy(size);
    }

    getValue(): ExpressionClass[] {
        return this.value;
    }

    getSize(): ExpressionClass {
        return this.size;
    }

    copy(commonClass: ArrayCreatorRestClass): void {
        this.resetValue();
        this.setValue(commonClass.getValue());
        this.setSize(commonClass.getSize());
    }
}

export const isArrayCreatorRestClass = (target: any): target is ArrayCreatorRestClass => {
    return isCommonClass(target, ArrayCreatorRestClass);
};

export const isArrayCreatorRestClassArray = (target: any): target is ArrayCreatorRestClass[] => {
    return Array.isArray(target) && target.every((t) => isArrayCreatorRestClass(t));
};

export const arrayCreatorRestConvert = (
    target: ArrayCreatorRestTypeClass,
    errorClass: ErrorTypeClass[],
): ArrayCreatorRestClass => {
    const arrayCreatorRest = new ArrayCreatorRestClass();

    const value = target.getValue();
    if (value) {
        const valueTypeClass = toTypeClass(value, isArrayInitializerType, errorClass);
        if (valueTypeClass) {
            arrayCreatorRest.setValue(arrayInitializerConvert(valueTypeClass, errorClass));
        }
    }

    const sizeValue = target.getSize();
    if (sizeValue) {
        const sizeTypeClass = toTypeClass(sizeValue, isExpressionTypeAll, errorClass);
        if (sizeTypeClass) {
            arrayCreatorRest.setSize(expressionConvert(sizeTypeClass, errorClass));
        }
    }

    return arrayCreatorRest;
};

export const classCreatorRestConvert = (
    target: ClassCreatorRestTypeClass,
    errorClass: ErrorTypeClass[],
): ExpressionClass[] => {
    const valueTypeClass = toTypeClass(target.getValue(), isNormalArgumentsType, errorClass);
    if (valueTypeClass) {
        return normalArgumentsConvert(valueTypeClass, errorClass);
    }

    return [];
};

export const mapCreatorRestConvert = (
    target: MapCreatorRestTypeClass,
    errorClass: ErrorTypeClass[],
): MapCreatorRestPairClass[] => {
    const values: MapCreatorRestPairClass[] = [];
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
): string | null => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export const setCreatorRestConvert = (
    target: SetCreatorRestTypeClass,
    errorClass: ErrorTypeClass[],
): ExpressionClass[] => {
    const values: ExpressionClass[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isExpressionTypeAll, errorClass);
        if (valueTypeClass) {
            values.push(expressionConvert(valueTypeClass, errorClass));
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
    IdCreatedNamePairClass[],
    ArrayCreatorRestClass
> {
    constructor(value: IdCreatedNamePairClass[], content: ArrayCreatorRestClass) {
        super('array', value, content);
    }
}

export const isArrayElementClass = (target: CommonClass): target is ArrayRestElementClass => {
    return isCommonClass(target, ArrayRestElementClass);
};

export class ExpressionArrayRestElementClass extends RestElementClass<
    'class' | 'set',
    IdCreatedNamePairClass[],
    ExpressionClass[]
> {
    constructor(
        type: 'class' | 'set',
        value: IdCreatedNamePairClass[],
        content: ExpressionClass[],
    ) {
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
    IdCreatedNamePairClass[],
    MapCreatorRestPairClass[]
> {
    constructor(value: IdCreatedNamePairClass[], content: MapCreatorRestPairClass[]) {
        super('map', value, content);
    }
}

export const isMapRestElementClass = (target: CommonClass): target is MapRestElementClass => {
    return isCommonClass(target, MapRestElementClass);
};

export class NoRestElementClass extends RestElementClass<
    'no',
    IdCreatedNamePairClass[],
    string | null
> {
    constructor(value: IdCreatedNamePairClass[], content: string | null) {
        super('no', value, content);
    }
}

export const isNoRestElementClass = (target: CommonClass): target is NoRestElementClass => {
    return isCommonClass(target, NoRestElementClass);
};

export class CreatorClass extends CommonClass {
    private value:
        | ArrayRestElementClass
        | ExpressionArrayRestElementClass
        | MapRestElementClass
        | NoRestElementClass
        | null = null;

    setValue(
        value:
            | ArrayRestElementClass
            | ExpressionArrayRestElementClass
            | MapRestElementClass
            | NoRestElementClass
            | null,
    ) {
        this.value = value;
    }

    getValue():
        | ArrayRestElementClass
        | ExpressionArrayRestElementClass
        | MapRestElementClass
        | NoRestElementClass
        | null {
        return this.value;
    }

    copy(commonClass: CreatorClass): void {
        this.setValue(commonClass.getValue());
    }
}

export const isCreatorClass = (target: any): target is CreatorClass => {
    return isCommonClass(target, CreatorClass);
};

export const isCreatorClassArray = (target: any): target is CreatorClass[] => {
    return Array.isArray(target) && target.every((t) => isCreatorClass(t));
};

export const creatorConvert = (
    target: CreatorTypeClass,
    errorClass: ErrorTypeClass[],
): CreatorClass => {
    const creator = new CreatorClass();

    const createdName: IdCreatedNamePairClass[] = [];
    const valueTypeClass = toTypeClass(target.getValue(), isCreatedNameType, errorClass);
    if (valueTypeClass) {
        createdName.push(...createdNameConvert(valueTypeClass, errorClass));
    }

    const contentTypeClass = toTypeClass(target.getContent(), isRestTypeAll, errorClass);
    if (contentTypeClass) {
        if (isArrayCreatorRestType(contentTypeClass)) {
            creator.setValue(
                new ArrayRestElementClass(
                    createdName,
                    arrayCreatorRestConvert(contentTypeClass, errorClass),
                ),
            );
        }

        if (isClassCreatorRestType(contentTypeClass)) {
            creator.setValue(
                new ExpressionArrayRestElementClass(
                    'class',
                    createdName,
                    classCreatorRestConvert(contentTypeClass, errorClass),
                ),
            );
        }
        if (isMapCreatorRestType(contentTypeClass)) {
            creator.setValue(
                new MapRestElementClass(
                    createdName,
                    mapCreatorRestConvert(contentTypeClass, errorClass),
                ),
            );
        }
        if (isNoRestType(contentTypeClass)) {
            creator.setValue(
                new NoRestElementClass(createdName, noRestConvert(contentTypeClass, errorClass)),
            );
        }
        if (isSetCreatorRestType(contentTypeClass)) {
            creator.setValue(
                new ExpressionArrayRestElementClass(
                    'set',
                    createdName,
                    setCreatorRestConvert(contentTypeClass, errorClass),
                ),
            );
        }
    }

    return creator;
};
