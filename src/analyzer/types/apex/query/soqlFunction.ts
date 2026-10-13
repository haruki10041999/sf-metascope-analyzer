import {
    SoqlFunctionClass,
    SignedLiteralClass,
    ExpressionClass,
    isSoqlFunctionClass,
    isDateFieldNameClass,
    isSignedLiteralClass,
    isExpressionClass,
    isDistanceValueArray,
    isString,
    isStringArray,
    isCoordinateValueArray,
} from '../converter';

import { ExpressionType, makeExpressionType } from '../expression';

type CoordinateValue = {
    latitude: ExpressionType | { value: string; valueType: string; operator?: string };
    longitude: ExpressionType | { value: string; valueType: string; operator?: string };
};

const makeCoordinateElement = (
    coordinateElement: ExpressionClass | SignedLiteralClass,
): ExpressionType | { value: string; valueType: string; operator?: string } | undefined => {
    if (isExpressionClass(coordinateElement)) {
        return makeExpressionType(coordinateElement);
    }

    if (isSignedLiteralClass(coordinateElement)) {
        const value = coordinateElement.getValue();
        const valueType = coordinateElement.getValueType();
        const operator = coordinateElement.getOperator();

        if (value && valueType) {
            const coordinateLiteral: { value: string; valueType: string; operator?: string } = {
                value: value,
                valueType: valueType,
            };
            if (operator) {
                coordinateLiteral.operator = operator;
            }
            return coordinateLiteral;
        }
    }

    return undefined;
};

const makeCoordinateValue = (
    coordinateValues: (ExpressionClass | SignedLiteralClass)[],
): CoordinateValue | undefined => {
    if (coordinateValues.length === 2) {
        const latitude = makeCoordinateElement(coordinateValues.at(0)!);
        const longitude = makeCoordinateElement(coordinateValues.at(1)!);

        if (latitude && longitude) {
            return {
                latitude: latitude,
                longitude: longitude,
            };
        }
    }

    return undefined;
};

type DistanceValue = {
    field: string[];
    location: string[] | ExpressionType | CoordinateValue;
    unit: string;
};

const makeDistanceValue = (
    locationValues: (
        string | (SignedLiteralClass | ExpressionClass)[] | string[] | ExpressionClass
    )[],
): DistanceValue | undefined => {
    if (locationValues.length === 3) {
        const field = locationValues.at(0)!;
        const location = locationValues.at(1)!;
        const unit = locationValues.at(2)!;

        if (isStringArray(field) && isString(unit)) {
            if (isStringArray(location)) {
                return {
                    field: field,
                    location: location,
                    unit: unit,
                };
            }

            if (isExpressionClass(location)) {
                return {
                    field: field,
                    location: makeExpressionType(location),
                    unit: unit,
                };
            }

            if (isCoordinateValueArray(location)) {
                const coordinateValue = makeCoordinateValue(location);
                if (coordinateValue) {
                    return {
                        field: field,
                        location: coordinateValue,
                        unit: unit,
                    };
                }
            }
        }
    }

    return undefined;
};

export type SoqlFunctionField = {
    funcName: string;
    arg?:
        | string[]
        | { fieldName: string[]; isConvertTimeZone: boolean }
        | string
        | SoqlFunctionField
        | DistanceValue;
};

export const makeSoqlFunctionField = (
    soqlFunction: SoqlFunctionClass,
): SoqlFunctionField | undefined => {
    const value = soqlFunction.getValue();
    const param = soqlFunction.getParam();

    if (value) {
        const soqlFunctionField: SoqlFunctionField = {
            funcName: value,
        };

        if (!param) {
            return soqlFunctionField;
        }

        if (param) {
            if (isString(param)) {
                soqlFunctionField.arg = param;
                return soqlFunctionField;
            }

            if (isStringArray(param) && param.length > 0) {
                soqlFunctionField.arg = param;
                return soqlFunctionField;
            }

            if (isDateFieldNameClass(param)) {
                const dateFieldName = param.getValue();
                const isConvertTimeZone = param.getIsConvertTimeZone();

                if (dateFieldName.length > 0 && isConvertTimeZone) {
                    soqlFunctionField.arg = {
                        fieldName: dateFieldName,
                        isConvertTimeZone: isConvertTimeZone,
                    };
                    return soqlFunctionField;
                }
            }

            if (isDistanceValueArray(param)) {
                const locationValue: (
                    string | (SignedLiteralClass | ExpressionClass)[] | string[] | ExpressionClass
                )[] = param;
                const distanceValue = makeDistanceValue(locationValue);
                if (distanceValue) {
                    soqlFunctionField.arg = distanceValue;
                    return soqlFunctionField;
                }
            }

            if (isSoqlFunctionClass(param)) {
                const soqlFunction = makeSoqlFunctionField(param);
                if (soqlFunction) {
                    soqlFunctionField.arg = soqlFunction;
                    return soqlFunctionField;
                }
            }
        }
    }

    return undefined;
};
