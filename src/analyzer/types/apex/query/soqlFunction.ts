import typia from 'typia';

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

import { ExpressionType, isExpressionType, makeExpressionType } from '../expression';

type CoordinateValue = {
    latitude: ExpressionType | { value: string; valueType: string; operator?: string };
    longitude: ExpressionType | { value: string; valueType: string; operator?: string };
};

const isCoordinateValue = typia.createIs<CoordinateValue>;

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

const isDistanceValue = typia.createIs<DistanceValue>;

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
                    unit: unit.replace(/^(['"])(.*)\1$/, '$2'),
                };
            }

            if (isExpressionClass(location)) {
                const expression = makeExpressionType(location);
                if (expression) {
                    return {
                        field: field,
                        location: expression,
                        unit: unit.replace(/^(['"])(.*)\1$/, '$2'),
                    };
                }
            }

            if (isCoordinateValueArray(location)) {
                const coordinateValue = makeCoordinateValue(location);
                if (coordinateValue) {
                    return {
                        field: field,
                        location: coordinateValue,
                        unit: unit.replace(/^(['"])(.*)\1$/, '$2'),
                    };
                }
            }
        }
    }

    return undefined;
};

type NormalSoqlFunctionName =
    'AVG' | 'COUNT_DISTINCT' | 'MIN' | 'MAX' | 'SUM' | 'TOLABEL' | 'GROUPING' | 'CONVERT_CURRENCY';

const isNormalSoqlFunctionName = (funcName: string): funcName is NormalSoqlFunctionName => {
    return [
        'AVG',
        'COUNT_DISTINCT',
        'MIN',
        'MAX',
        'SUM',
        'TOLABEL',
        'GROUPING',
        'CONVERT_CURRENCY',
    ].includes(funcName.toUpperCase());
};

type NormalSoqlFunctionField = {
    funcName: NormalSoqlFunctionName;
    arg: string[];
};

type CountFunctionName = 'COUNT';

export const isCountFunctionName = (funcName: string): funcName is CountFunctionName => {
    return funcName.toUpperCase() === 'COUNT';
};

type CountFunctionField = {
    funcName: CountFunctionName;
    arg?: string[];
};

type FormatFunctionName = 'FORMAT';

export const isFormatFunctionName = (funcName: string): funcName is FormatFunctionName => {
    return funcName.toUpperCase() === 'FORMAT';
};

type FormatFunctionField = {
    funcName: FormatFunctionName;
    arg: string[] | SoqlFunctionField;
};
type FieldsFunctionName = 'FIELDS';

export const isFieldsFunctionName = (funcName: string): funcName is FieldsFunctionName => {
    return funcName.toUpperCase() === 'FIELDS';
};

type FieldsFunctionField = {
    funcName: FieldsFunctionName;
    arg: string;
};

type DistanceFunctionName = 'DISTANCE';

export const isDistanceFunctionName = (funcName: string): funcName is DistanceFunctionName => {
    return funcName.toUpperCase() === 'DISTANCE';
};

type DistanceFunctionField = {
    funcName: DistanceFunctionName;
    arg: DistanceValue;
};

type DateFunctionName =
    | 'CALENDAR_MONTH'
    | 'CALENDAR_QUARTER'
    | 'CALENDAR_YEAR'
    | 'DAY_IN_MONTH'
    | 'DAY_IN_WEEK'
    | 'DAY_IN_YEAR'
    | 'DAY_ONLY'
    | 'FISCAL_MONTH'
    | 'FISCAL_QUARTER'
    | 'FISCAL_YEAR'
    | 'HOUR_IN_DAY'
    | 'WEEK_IN_MONTH'
    | 'WEEK_IN_YEAR';

export const isDateFunctionName = (funcName: string): funcName is DateFunctionName => {
    return [
        'CALENDAR_MONTH',
        'CALENDAR_QUARTER',
        'CALENDAR_YEAR',
        'DAY_IN_MONTH',
        'DAY_IN_WEEK',
        'DAY_IN_YEAR',
        'DAY_ONLY',
        'FISCAL_MONTH',
        'FISCAL_QUARTER',
        'FISCAL_YEAR',
        'HOUR_IN_DAY',
        'WEEK_IN_MONTH',
        'WEEK_IN_YEAR',
    ].includes(funcName.toUpperCase());
};

type DateFunctionField = {
    funcName: DateFunctionName;
    arg: { field: string[]; isConvertTimeZone: boolean };
};
type SoqlFunctionField =
    | NormalSoqlFunctionField
    | DateFunctionField
    | CountFunctionField
    | FormatFunctionField
    | FieldsFunctionField
    | DistanceFunctionField;

const isNormalSoqlFunctionField = (
    soqlFunctionField: SoqlFunctionField,
): soqlFunctionField is NormalSoqlFunctionField => {
    return isNormalSoqlFunctionName(soqlFunctionField.funcName);
};

const isDateFunctionField = (
    soqlFunctionField: SoqlFunctionField,
): soqlFunctionField is DateFunctionField => {
    return isDateFunctionName(soqlFunctionField.funcName);
};

const isCountFunctionField = (
    soqlFunctionField: SoqlFunctionField,
): soqlFunctionField is CountFunctionField => {
    return isCountFunctionName(soqlFunctionField.funcName);
};

const isFormatFunctionField = (
    soqlFunctionField: SoqlFunctionField,
): soqlFunctionField is FormatFunctionField => {
    return isFormatFunctionName(soqlFunctionField.funcName);
};

const isFieldsFunctionField = (
    soqlFunctionField: SoqlFunctionField,
): soqlFunctionField is FieldsFunctionField => {
    return isFieldsFunctionName(soqlFunctionField.funcName);
};

const isDistanceFunctionField = (
    soqlFunctionField: SoqlFunctionField,
): soqlFunctionField is DistanceFunctionField => {
    return isDistanceFunctionName(soqlFunctionField.funcName);
};

const isSoqlFunctionField = (soqlFunctionField: any): soqlFunctionField is SoqlFunctionField => {
    return (
        typeof soqlFunctionField === 'object' &&
        soqlFunctionField !== null &&
        'funcName' in soqlFunctionField &&
        typeof soqlFunctionField.funcName === 'string' &&
        (isNormalSoqlFunctionName(soqlFunctionField.funcName) ||
            isDateFunctionField(soqlFunctionField.funcName) ||
            isFieldsFunctionName(soqlFunctionField.funcName) ||
            isFormatFunctionName(soqlFunctionField.funcName) ||
            isDistanceFunctionName(soqlFunctionField.funcName) ||
            isCountFunctionName(soqlFunctionField.funcName))
    );
};

const makeSoqlFunctionField = (soqlFunction: SoqlFunctionClass): SoqlFunctionField | undefined => {
    const value = soqlFunction.getValue();
    const param = soqlFunction.getParam();

    if (value) {
        if (isNormalSoqlFunctionName(value) && isStringArray(param)) {
            return {
                funcName: value,
                arg: param,
            };
        }

        if (isDateFunctionName(value) && isDateFieldNameClass(param)) {
            const fieldName = param.getValue();
            const isConvertTimeZone = param.getIsConvertTimeZone() || false;
            if (fieldName.length > 0) {
                return {
                    funcName: value,
                    arg: {
                        field: fieldName,
                        isConvertTimeZone: isConvertTimeZone,
                    },
                };
            }
        }

        if (isCountFunctionName(value)) {
            const soqlFunction: SoqlFunctionField = {
                funcName: value,
            };

            if (param && isStringArray(param)) {
                soqlFunction.arg = param;
            }

            return soqlFunction;
        }

        if (isFieldsFunctionName(value) && isString(param)) {
            return {
                funcName: value,
                arg: param,
            };
        }

        if (isFormatFunctionName(value)) {
            if (isStringArray(param)) {
                return {
                    funcName: value,
                    arg: param,
                };
            }

            if (isSoqlFunctionClass(param)) {
                const soqlFunction = makeSoqlFunctionField(param);
                if (soqlFunction) {
                    return {
                        funcName: value,
                        arg: soqlFunction,
                    };
                }
            }
        }

        if (isDistanceFunctionName(value) && isDistanceValueArray(param)) {
            const distanceValue = makeDistanceValue(param);
            if (distanceValue) {
                return {
                    funcName: value,
                    arg: distanceValue,
                };
            }
        }
    }

    return undefined;
};

export type SoqlFunctionSet = {
    normal?: NormalSoqlFunctionField[];
    date?: DateFunctionField[];
    count?: CountFunctionField[];
    fields?: FieldsFunctionField[];
    format: FormatFunctionField[];
    distance?: DistanceFunctionField[];
};

export const assignSoqlFunction = (
    soqlFunction: SoqlFunctionClass,
    soqlFunctionSet: SoqlFunctionSet,
): void => {
    const soqlFunctionField = makeSoqlFunctionField(soqlFunction);

    if (soqlFunctionField) {
        if (isNormalSoqlFunctionField(soqlFunctionField)) {
            if (!soqlFunctionSet.normal) {
                soqlFunctionSet.normal = [];
            }

            soqlFunctionSet.normal.push(soqlFunctionField);
        }

        if (isDateFunctionField(soqlFunctionField)) {
            if (!soqlFunctionSet.date) {
                soqlFunctionSet.date = [];
            }

            soqlFunctionSet.date.push(soqlFunctionField);
        }

        if (isCountFunctionField(soqlFunctionField)) {
            if (!soqlFunctionSet.count) {
                soqlFunctionSet.count = [];
            }

            soqlFunctionSet.count.push(soqlFunctionField);
        }

        if (isFieldsFunctionField(soqlFunctionField)) {
            if (!soqlFunctionSet.fields) {
                soqlFunctionSet.fields = [];
            }

            soqlFunctionSet.fields.push(soqlFunctionField);
        }

        if (isFormatFunctionField(soqlFunctionField)) {
            if (!soqlFunctionSet.format) {
                soqlFunctionSet.format = [];
            }

            soqlFunctionSet.format.push(soqlFunctionField);
        }

        if (isDistanceFunctionField(soqlFunctionField)) {
            if (!soqlFunctionSet.distance) {
                soqlFunctionSet.distance = [];
            }

            soqlFunctionSet.distance.push(soqlFunctionField);
        }
    }
};

export const sortSoqlFunctionSet = (functionSet: SoqlFunctionSet) => {
    if (functionSet.normal) {
        functionSet.normal.sort((a, b) => {
            const funcNameDiff = a.funcName.localeCompare(b.funcName);
            if (funcNameDiff !== 0) return funcNameDiff;

            const argLengthDiff = a.arg.length - b.arg.length;
            if (argLengthDiff !== 0) return argLengthDiff;

            for (let i = 0; i < a.arg.length; i++) {
                const diff = a.arg[i]!.localeCompare(b.arg[i]!);
                if (diff !== 0) return diff;
            }

            return 0;
        });
    }

    if (functionSet.date) {
        functionSet.date.sort((a, b) => {
            const funcNameDiff = a.funcName.localeCompare(b.funcName);
            if (funcNameDiff !== 0) return funcNameDiff;

            const argLengthDiff = a.arg.field.length - b.arg.field.length;
            if (argLengthDiff !== 0) return argLengthDiff;

            for (let i = 0; i < a.arg.field.length; i++) {
                const diff = a.arg.field[i]!.localeCompare(b.arg.field[i]!);
                if (diff !== 0) return diff;
            }

            const isConvertTimeZoneDiff =
                Number(a.arg.isConvertTimeZone) - Number(b.arg.isConvertTimeZone);
            if (isConvertTimeZoneDiff !== 0) return isConvertTimeZoneDiff;

            return 0;
        });
    }

    if (functionSet.count) {
        functionSet.count.sort((a, b) => {
            const isAArg = Number(a.arg !== undefined);
            const isBArg = Number(b.arg !== undefined);
            if (isAArg - isBArg !== 0) return isAArg - isBArg;

            if (a.arg && b.arg) {
                const argLengthDiff = a.arg!.length - b.arg.length;
                if (argLengthDiff !== 0) return argLengthDiff;

                for (let i = 0; i < a.arg.length; i++) {
                    const diff = a.arg[i]!.localeCompare(b.arg[i]!);
                    if (diff !== 0) return diff;
                }
            }

            return 0;
        });
    }

    if (functionSet.fields) {
        functionSet.fields.sort((a, b) => a.arg.localeCompare(b.arg));
    }

    if (functionSet.format) {
        functionSet.format.sort((a, b) => {
            const typeDiff = assignFormatSortNumber(a) - assignFormatSortNumber(b);
            if (typeDiff !== 0) return typeDiff;

            if (isStringArray(a.arg) && isStringArray(b.arg)) {
                const argLengthDiff = a.arg!.length - b.arg.length;
                if (argLengthDiff !== 0) return argLengthDiff;

                for (let i = 0; i < a.arg.length; i++) {
                    const diff = a.arg[i]!.localeCompare(b.arg[i]!);
                    if (diff !== 0) return diff;
                }
            }

            if (isSoqlFunctionField(a.arg) && isNormalSoqlFunctionField(b.arg)) return 0;
        });
    }
};

const assignSoqlFunctionFieldNumber = (functionField: SoqlFunctionField): number => {
    if (isNormalSoqlFunctionField(functionField)) return 1;
    if (isDateFunctionField(functionField)) return 2;
    if (isCountFunctionField(functionField)) return 3;
    if (isFieldsFunctionField(functionField)) return 4;
    if (isFormatFunctionField(functionField)) return 5;
    if (isDistanceFunctionField(functionField)) return 6;

    return 0;
};

const functionSort = (a: SoqlFunctionField, b: SoqlFunctionField): number => {
    const funcNameDiff = a.funcName.localeCompare(b.funcName);
    if (funcNameDiff !== 0) return funcNameDiff;

    const typeDiff = assignSoqlFunctionFieldNumber(a) - assignSoqlFunctionFieldNumber(b);
    if (typeDiff !== 0) return typeDiff;

    if (isNormalSoqlFunctionField(a) && isNormalSoqlFunctionField(b)) {
        const argLengthDiff = a.arg.length - b.arg.length;
        if (argLengthDiff !== 0) return argLengthDiff;

        for (let i = 0; i < a.arg.length; i++) {
            const diff = a.arg[i]!.localeCompare(b.arg[i]!);
            if (diff !== 0) return diff;
        }
    }

    if (isDateFunctionField(a) && isDateFunctionField(b)) {
        const argLengthDiff = a.arg.field.length - b.arg.field.length;
        if (argLengthDiff !== 0) return argLengthDiff;

        for (let i = 0; i < a.arg.field.length; i++) {
            const diff = a.arg.field[i]!.localeCompare(b.arg.field[i]!);
            if (diff !== 0) return diff;
        }

        const isConvertTimeZoneDiff =
            Number(a.arg.isConvertTimeZone) - Number(b.arg.isConvertTimeZone);
        if (isConvertTimeZoneDiff !== 0) return isConvertTimeZoneDiff;
    }

    if (isCountFunctionField(a) && isCountFunctionField(b)) {
        const isAArg = Number(a.arg !== undefined);
        const isBArg = Number(b.arg !== undefined);
        if (isAArg - isBArg !== 0) return isAArg - isBArg;

        if (a.arg && b.arg) {
            const argLengthDiff = a.arg!.length - b.arg.length;
            if (argLengthDiff !== 0) return argLengthDiff;

            for (let i = 0; i < a.arg.length; i++) {
                const diff = a.arg[i]!.localeCompare(b.arg[i]!);
                if (diff !== 0) return diff;
            }
        }
    }

    if (isFieldsFunctionField(a) && isFieldsFunctionField(b)) {
        const paramDiff = a.arg.localeCompare(b.arg);
        if (paramDiff !== 0) return paramDiff;
    }

    if (isFormatFunctionField(a) && isFormatFunctionField(b)) return 0;
};
