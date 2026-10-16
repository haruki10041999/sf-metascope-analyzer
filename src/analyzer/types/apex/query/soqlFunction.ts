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

const isCoordinateValue = typia.createIs<CoordinateValue>();

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

const isDistanceValue = typia.createIs<DistanceValue>();

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
export type SoqlFunctionField =
    | NormalSoqlFunctionField
    | DateFunctionField
    | CountFunctionField
    | FormatFunctionField
    | FieldsFunctionField
    | DistanceFunctionField;

const isNormalSoqlFunctionField = typia.createIs<NormalSoqlFunctionField>();

const isDateFunctionField = typia.createIs<DateFunctionField>();

const isCountFunctionField = typia.createIs<CountFunctionField>();

const isFormatFunctionField = typia.createIs<FormatFunctionField>();

const isFieldsFunctionField = typia.createIs<FieldsFunctionField>();

const isDistanceFunctionField = typia.createIs<DistanceFunctionField>();

export const isSoqlFunctionField = typia.createIs<SoqlFunctionField>();

export const makeSoqlFunctionField = (
    soqlFunction: SoqlFunctionClass,
): SoqlFunctionField | undefined => {
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
    normal?: { field: NormalSoqlFunctionField; alias?: string }[];
    date?: { field: DateFunctionField; alias?: string }[];
    count?: { field: CountFunctionField; alias?: string }[];
    fields?: { field: FieldsFunctionField; alias?: string }[];
    format?: { field: FormatFunctionField; alias?: string }[];
    distance?: { field: DistanceFunctionField; alias?: string }[];
};

export const assignSoqlFunction = (
    soqlFunction: SoqlFunctionClass,
    soqlFunctionSet: SoqlFunctionSet,
    alias?: string,
): void => {
    const soqlFunctionField = makeSoqlFunctionField(soqlFunction);

    if (soqlFunctionField) {
        if (isNormalSoqlFunctionField(soqlFunctionField)) {
            if (!soqlFunctionSet.normal) {
                soqlFunctionSet.normal = [];
            }

            const field: { field: NormalSoqlFunctionField; alias?: string } = {
                field: soqlFunctionField,
            };

            if (alias) {
                field.alias = alias;
            }

            soqlFunctionSet.normal.push(field);
        }

        if (isDateFunctionField(soqlFunctionField)) {
            if (!soqlFunctionSet.date) {
                soqlFunctionSet.date = [];
            }

            const field: { field: DateFunctionField; alias?: string } = {
                field: soqlFunctionField,
            };
            if (alias) {
                field.alias = alias;
            }
            soqlFunctionSet.date.push(field);
        }

        if (isCountFunctionField(soqlFunctionField)) {
            if (!soqlFunctionSet.count) {
                soqlFunctionSet.count = [];
            }

            const field: { field: CountFunctionField; alias?: string } = {
                field: soqlFunctionField,
            };
            if (alias) {
                field.alias = alias;
            }
            soqlFunctionSet.count.push(field);
        }

        if (isFieldsFunctionField(soqlFunctionField)) {
            if (!soqlFunctionSet.fields) {
                soqlFunctionSet.fields = [];
            }

            const field: { field: FieldsFunctionField; alias?: string } = {
                field: soqlFunctionField,
            };
            if (alias) {
                field.alias = alias;
            }
            soqlFunctionSet.fields.push(field);
        }

        if (isFormatFunctionField(soqlFunctionField)) {
            if (!soqlFunctionSet.format) {
                soqlFunctionSet.format = [];
            }

            const field: { field: FormatFunctionField; alias?: string } = {
                field: soqlFunctionField,
            };
            if (alias) {
                field.alias = alias;
            }
            soqlFunctionSet.format.push(field);
        }

        if (isDistanceFunctionField(soqlFunctionField)) {
            if (!soqlFunctionSet.distance) {
                soqlFunctionSet.distance = [];
            }

            const field: { field: DistanceFunctionField; alias?: string } = {
                field: soqlFunctionField,
            };
            if (alias) {
                field.alias = alias;
            }
            soqlFunctionSet.distance.push(field);
        }
    }
};

export const sortSoqlFunctionSet = (functionSet: SoqlFunctionSet) => {
    if (functionSet.normal) {
        functionSet.normal.sort((a, b) => {
            const aliasDiff = Number(a.alias !== undefined) - Number(b.alias !== undefined);
            if (aliasDiff !== 0) return aliasDiff;

            if (isString(a.alias) && isString(b.alias)) {
                return a.alias.localeCompare(b.alias);
            }

            return soqlFunctionSort(a.field, b.field);
        });
    }

    if (functionSet.date) {
        functionSet.date.sort((a, b) => {
            const aliasDiff = Number(a.alias !== undefined) - Number(b.alias !== undefined);
            if (aliasDiff !== 0) return aliasDiff;

            if (isString(a.alias) && isString(b.alias)) {
                return a.alias.localeCompare(b.alias);
            }

            return soqlFunctionSort(a.field, b.field);
        });
    }

    if (functionSet.count) {
        functionSet.count.sort((a, b) => {
            const aliasDiff = Number(a.alias !== undefined) - Number(b.alias !== undefined);
            if (aliasDiff !== 0) return aliasDiff;

            if (isString(a.alias) && isString(b.alias)) {
                return a.alias.localeCompare(b.alias);
            }

            return soqlFunctionSort(a.field, b.field);
        });
    }

    if (functionSet.fields) {
        functionSet.fields.sort((a, b) => {
            const aliasDiff = Number(a.alias !== undefined) - Number(b.alias !== undefined);
            if (aliasDiff !== 0) return aliasDiff;

            if (isString(a.alias) && isString(b.alias)) {
                return a.alias.localeCompare(b.alias);
            }

            return soqlFunctionSort(a.field, b.field);
        });
    }

    if (functionSet.format) {
        functionSet.format.sort((a, b) => {
            const aliasDiff = Number(a.alias !== undefined) - Number(b.alias !== undefined);
            if (aliasDiff !== 0) return aliasDiff;

            if (isString(a.alias) && isString(b.alias)) {
                return a.alias.localeCompare(b.alias);
            }

            return soqlFunctionSort(a.field, b.field);
        });
    }
    if (functionSet.distance) {
        functionSet.distance.sort((a, b) => {
            const aliasDiff = Number(a.alias !== undefined) - Number(b.alias !== undefined);
            if (aliasDiff !== 0) return aliasDiff;

            if (isString(a.alias) && isString(b.alias)) {
                return a.alias.localeCompare(b.alias);
            }

            return soqlFunctionSort(a.field, b.field);
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

const soqlFunctionSort = (a: SoqlFunctionField, b: SoqlFunctionField): number => {
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

    if (isFormatFunctionField(a) && isFormatFunctionField(b)) {
        const argAType = isStringArray(a.arg) ? 0 : 1;
        const argBType = isStringArray(b.arg) ? 0 : 1;
        const argTypeDiff = argAType - argBType;
        if (argTypeDiff !== 0) return argTypeDiff;

        if (isStringArray(a.arg) && isStringArray(b.arg)) {
            const argLengthDiff = a.arg.length - b.arg.length;
            if (argLengthDiff !== 0) return argLengthDiff;

            for (let i = 0; i < a.arg.length; i++) {
                const diff = a.arg[i]!.localeCompare(b.arg[i]!);
                if (diff !== 0) return diff;
            }
        }

        if (isSoqlFunctionField(a) && isSoqlFunctionField(b)) {
            return soqlFunctionSort(a, b);
        }
    }

    if (isDistanceFunctionField(a) && isDistanceFunctionField(b)) {
        const fieldArgLengthDiff = a.arg.field.length - b.arg.field.length;
        if (fieldArgLengthDiff !== 0) return fieldArgLengthDiff;

        for (let i = 0; i < a.arg.field.length; i++) {
            const diff = a.arg.field[i]!.localeCompare(b.arg.field[i]!);
            if (diff !== 0) return diff;
        }

        const locationAType = isStringArray(a.arg.location)
            ? 0
            : isExpressionType(a.arg.location)
              ? 1
              : 2;
        const locationBType = isStringArray(b.arg.location)
            ? 0
            : isExpressionType(b.arg.location)
              ? 1
              : 2;
        const locationTypeDiff = locationAType - locationBType;
        if (locationTypeDiff !== 0) return locationTypeDiff;

        const locationLengthDiff =
            isStringArray(a.arg.location) && isStringArray(b.arg.location)
                ? a.arg.location.length - b.arg.location.length
                : 0;
        if (locationLengthDiff !== 0) return locationLengthDiff;

        if (isStringArray(a.arg.location) && isStringArray(b.arg.location)) {
            for (let i = 0; i < a.arg.location.length; i++) {
                const diff = a.arg.location[i]!.localeCompare(b.arg.location[i]!);
                if (diff !== 0) return diff;
            }
        }

        return a.arg.unit.localeCompare(b.arg.unit);
    }

    return 0;
};

