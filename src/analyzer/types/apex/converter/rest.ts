import {
    ErrorTypeClass,
    ArrayCreatorRestTypeClass,
    ClassCreatorRestTypeClass,
    CreatorTypeClass,
    MapCreatorRestTypeClass,
    NoRestTypeClass,
    SetCreatorRestTypeClass,
    RestAllTypeClass,
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

import { toPrimitiveValue, toTypeClass } from './commons';
import { NormalArguments, normalArgumentsConvert } from './arguments';
import { Expression, expressionConvert } from './expression';
import { CreatedName, createdNameConvert } from './name';
import { MapCreatorRestPair, mapCreatorRestPairConvert } from './pair';
import { ArrayInitializer, arrayInitializerConvert } from './variable';

export type ArrayCreatorRest = {
    value: ArrayInitializer;
    size: Expression;
};

export const arrayCreatorRestConvert = (
    target: ArrayCreatorRestTypeClass,
    errorClass: ErrorTypeClass[],
): ArrayCreatorRest => {
    const valueTypeClass = target.getValue();
    const initializer = valueTypeClass
        ? toTypeClass(valueTypeClass, isArrayInitializerType, errorClass)
        : undefined;

    const sizeTypeClass = target.getSize();
    const size = sizeTypeClass
        ? toTypeClass(sizeTypeClass, isExpressionTypeAll, errorClass)
        : undefined;

    return {
        value: initializer ? arrayInitializerConvert(initializer, errorClass) : undefined,
        size: size ? expressionConvert(size, errorClass) : undefined,
    };
};

export type ClassCreatorRest = NormalArguments;

export const classCreatorRestConvert = (
    target: ClassCreatorRestTypeClass,
    errorClass: ErrorTypeClass[],
): ClassCreatorRest => {
    const valueTypeClass = toTypeClass(target.getValue(), isNormalArgumentsType, errorClass);
    return valueTypeClass ? normalArgumentsConvert(valueTypeClass, errorClass) : undefined;
};

export type MapCreatorRest = MapCreatorRestPair[] | undefined;

export const mapCreatorRestConvert = (
    target: MapCreatorRestTypeClass,
    errorClass: ErrorTypeClass[],
): MapCreatorRest => {
    const values: MapCreatorRestPair[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isMapCreatorRestPairType, errorClass);
        if (valueTypeClass) {
            values.push(mapCreatorRestPairConvert(valueTypeClass, errorClass));
        }
    });
    return values.length > 0 ? values : undefined;
};

export type NoRest = string | undefined;

export const noRestConvert = (target: NoRestTypeClass, errorClass: ErrorTypeClass[]): NoRest => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export type SetCreatorRest = Expression[] | undefined;

export const setCreatorRestConvert = (
    target: SetCreatorRestTypeClass,
    errorClass: ErrorTypeClass[],
): SetCreatorRest => {
    const values: Expression[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isExpressionTypeAll, errorClass);
        if (valueTypeClass) {
            values.push(expressionConvert(valueTypeClass, errorClass));
        }
    });
    return values.length > 0 ? values : undefined;
};

export type Creator =
    | {
          type: string;
          value: CreatedName;
          content: ArrayCreatorRest | ClassCreatorRest | MapCreatorRest | NoRest | SetCreatorRest;
      }
    | undefined;

export const creatorConvert = (target: CreatorTypeClass, errorClass: ErrorTypeClass[]): Creator => {
    const valueTypeClass = toTypeClass(target.getValue(), isCreatedNameType, errorClass);
    const contentTypeClass = toTypeClass(target.getContent(), isRestTypeAll, errorClass);

    if (!contentTypeClass) {
        return undefined;
    }

    if (isArrayCreatorRestType(contentTypeClass)) {
        return {
            type: 'array',
            value: valueTypeClass ? createdNameConvert(valueTypeClass, errorClass) : undefined,
            content: arrayCreatorRestConvert(contentTypeClass, errorClass),
        };
    }
    if (isClassCreatorRestType(contentTypeClass)) {
        return {
            type: 'class',
            value: valueTypeClass ? createdNameConvert(valueTypeClass, errorClass) : undefined,
            content: classCreatorRestConvert(contentTypeClass, errorClass),
        };
    }
    if (isMapCreatorRestType(contentTypeClass)) {
        return {
            type: 'map',
            value: valueTypeClass ? createdNameConvert(valueTypeClass, errorClass) : undefined,
            content: mapCreatorRestConvert(contentTypeClass, errorClass),
        };
    }
    if (isNoRestType(contentTypeClass)) {
        return {
            type: 'no',
            value: valueTypeClass ? createdNameConvert(valueTypeClass, errorClass) : undefined,
            content: noRestConvert(contentTypeClass, errorClass),
        };
    }
    if (isSetCreatorRestType(contentTypeClass)) {
        return {
            type: 'set',
            value: valueTypeClass ? createdNameConvert(valueTypeClass, errorClass) : undefined,
            content: setCreatorRestConvert(contentTypeClass, errorClass),
        };
    }

    return undefined;
};
