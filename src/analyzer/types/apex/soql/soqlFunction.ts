import { SoqlFunction, DateFieldName, SignedLiteral, Expression } from '../converter';

import { ExpressionType, makeExpressionType } from '../expression';

type CoordinateValue = {
    latitude: ExpressionType | { value: string; valueType: string; operator?: string };
    longitude: ExpressionType | { value: string; valueType: string; operator?: string };
};

const isExpression = (param: unknown): param is Expression => {
    return (
        typeof param === 'object' &&
        param !== null &&
        'type' in param &&
        typeof param.type === 'string' &&
        [
            'normal',
            'primary',
            'dot',
            'array',
            'methodCall',
            'new',
            'cast',
            'sub',
            'postOp',
            'preOp',
            'neg',
            'arth1',
            'arth2',
            'bit',
            'equality',
            'bitAnd',
            'bitOr',
            'bitNot',
            'assign',
            'cmp',
            'logAnd',
            'logOr',
            'coal',
            'instanceOf',
            'cond',
        ].includes(param.type)
    );
};

const isSignLiteral = (param: any): param is SignedLiteral => {
    return (
        typeof param === 'object' &&
        param !== null &&
        'value' in param &&
        'valueType' in param &&
        'operator' in param
    );
};

const makeCoordinateLiteral = (
    literal: Expression | SignedLiteral,
): ExpressionType | { value: string; valueType: string; operator?: string } | undefined => {
    if (isExpression(literal)) {
        return makeExpressionType(literal);
    }

    if (isSignLiteral(literal)) {
        const { value, valueType, operator } = literal;
        if (value) {
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
    coordinateValues: (Expression | SignedLiteral)[],
): CoordinateValue | undefined => {
    if (coordinateValues.length === 2) {
        const latitude = makeCoordinateLiteral(coordinateValues.at(0)!);
        const longitude = makeCoordinateLiteral(coordinateValues.at(1)!);

        if (latitude && longitude) {
            return {
                latitude: latitude,
                longitude: longitude,
            };
        }
    }

    return undefined;
};

type LocationValue = string | string[] | (SignedLiteral | Expression)[] | Expression;

type DistanceArg = {
    field: string[];
    location: string[] | ExpressionType | CoordinateValue;
    unit: string;
};

const isString = (param: any): param is string => {
    return typeof param === 'string';
};

const isStringArray = (param: any): param is string[] => {
    return Array.isArray(param) && param.every((p) => typeof p === 'string');
};

const isCoordinateValues = (param: any): param is (SignedLiteral | Expression)[] => {
    return Array.isArray(param) && param.every((p) => isSignLiteral(param) || isExpression(param));
};

const makeDistanceArg = (locationValues: LocationValue[]): DistanceArg | undefined => {
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

            if (isExpression(location)) {
                return {
                    field: field,
                    location: makeExpressionType(location),
                    unit: unit,
                };
            }

            if (isCoordinateValues(location)) {
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
    kind: 'function';
    funcName: string;
    arg?:
        | string[]
        | { fieldName: string[]; isConvertTimeZone: boolean }
        | string
        | Omit<SoqlFunctionField, 'kind'>
        | DistanceArg;
};

const isDateFieldName = (param: any): param is DateFieldName => {
    return (
        typeof param === 'object' &&
        param !== null &&
        'value' in param &&
        'isConvertTimeZone' in param
    );
};

const isLocationValue = (
    param: any,
): param is (string | string[] | (SignedLiteral | Expression)[] | Expression)[] => {
    return (
        Array.isArray(param) &&
        param.every(
            (item) =>
                typeof item === 'string' ||
                (Array.isArray(item) && item.every((i) => typeof i === 'string')) ||
                isCoordinateValues(item) ||
                isExpression(item),
        )
    );
};

const isSoqlFunction = (param: any): param is SoqlFunction => {
    return typeof param === 'object' && param !== null && 'value' in param && 'param' in param;
};

export const makeSoqlFunctionField = (
    soqlFunction: SoqlFunction,
): SoqlFunctionField | undefined => {
    const { value, param } = soqlFunction;

    if (value) {
        const soqlFunctionField: SoqlFunctionField = {
            kind: 'function',
            funcName: value,
        };

        if (param) {
            if (isString(param)) {
                soqlFunctionField.arg = param;
                return soqlFunctionField;
            }

            if (isStringArray(param) && param.length > 0) {
                soqlFunctionField.arg = param;
            }

            if (isDateFieldName(param)) {
                soqlFunctionField.arg = {
                    fieldName: param.value,
                    isConvertTimeZone: param.isConvertTimeZone,
                };
            }

            if (isLocationValue(param)) {
                const distanceArg = makeDistanceArg(param);
                if (distanceArg) {
                    soqlFunctionField.arg = distanceArg;
                }
            }

            if (isSoqlFunction(param)) {
                const soqlFunction = makeSoqlFunctionField(param);
                if (soqlFunction) {
                    const { kind, ...func } = soqlFunction;
                    soqlFunction.arg = func;
                }
            }
        }

        return soqlFunctionField;
    }

    return undefined;
};
