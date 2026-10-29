import typia from 'typia';

import { ConvertExcludeError, ConvertKeys, ErrorJson, makeErrorJson } from '../commons';

import {
    FieldNameType,
    DateFieldNameType,
    SoqlFieldsParameterType,
    CoordinateValueType,
    LocationValueType,
    SoqlFunctionType,
} from '../converter';

import { BaseExpressionJson, makeExpressionJsonConvert } from '../expression';

const ERROR_KIND = 'soqlFunction';

const makeFieldNameJson = (target: ConvertExcludeError<FieldNameType>): string[] => {
    return target.value.map((v) => v.value.value);
};

export type DateFieldNameJson = {
    name: string[];
    isConvertTimeZone: boolean;
};
export const isDateFieldNameJson = typia.createIs<DateFieldNameJson>();
const makeDateFieldNameJson = (
    target: ConvertExcludeError<DateFieldNameType>,
): DateFieldNameJson => {
    const name = makeFieldNameJson(target.value);
    const isConvertTimeZone = target.isConvertTimeZone;

    return {
        name: name,
        isConvertTimeZone: isConvertTimeZone,
    };
};

const makeSoqlFieldParameterJson = (
    target: ConvertExcludeError<SoqlFieldsParameterType>,
): 'ALL' | 'CUSTOM' | 'STANDARD' => {
    return target.value;
};

type CoordinateElementJson =
    | {
          type: 'bind';
          value: BaseExpressionJson | ErrorJson;
      }
    | {
          type: 'literal';
          value: string;
          valueType: string;
          operator?: string;
      };

const makeCoordinateElementParamJson = (
    target: ConvertExcludeError<CoordinateValueType>,
): CoordinateElementJson => {
    if (target.value.type === 'boundExpression') {
        const expressionValue = makeExpressionJsonConvert(target.value.value);
        return {
            type: 'bind',
            value: expressionValue,
        };
    } else {
        const literalValue = target.value.value;
        const valueType = target.value.valueType;
        const operator = target.value.operator;

        const coordinateElementParamJson: CoordinateElementJson = {
            type: 'literal',
            value: literalValue,
            valueType: valueType,
        };

        if (operator) {
            coordinateElementParamJson.operator = operator;
        }

        return coordinateElementParamJson;
    }
};

type CoordinateValueJson = {
    latitude: CoordinateElementJson;
    longitude: CoordinateElementJson;
};

const makeCoordinateParamValueJson = (
    target: ConvertExcludeError<CoordinateValueType>[],
    owner: ConvertKeys,
): CoordinateValueJson | ErrorJson => {
    const [latitude, longitude] = target;
    if (target.length !== 2 || !latitude || !longitude) {
        return makeErrorJson(owner, ERROR_KIND);
    }

    return {
        latitude: makeCoordinateElementParamJson(latitude),
        longitude: makeCoordinateElementParamJson(longitude),
    };
};

type LocationValueElementJson =
    | {
          type: 'field';
          field: string[];
      }
    | {
          type: 'bind';
          field: BaseExpressionJson | ErrorJson;
      }
    | {
          type: 'coordinate';
          field: CoordinateValueJson | ErrorJson;
      };

const makeLocationValueElementJson = (
    target: ConvertExcludeError<LocationValueType>,
): LocationValueElementJson => {
    if (Array.isArray(target.value)) {
        return {
            type: 'coordinate',
            field: makeCoordinateParamValueJson(target.value, target),
        };
    } else if (target.value.type === 'fieldName') {
        const fieldValue = makeFieldNameJson(target.value);
        return {
            type: 'field',
            field: fieldValue,
        };
    } else {
        const expressionValue = makeExpressionJsonConvert(target.value.value);
        return {
            type: 'bind',
            field: expressionValue,
        };
    }
};

export type DistanceValueJson = {
    field: LocationValueElementJson;
    target: LocationValueElementJson;
    unit: string;
};
export const isDistanceValueJson = typia.createIs<DistanceValueJson>();

// DISTANCE(場所, 場所, 単位) の 3 引数。形が想定と違う場合は関数全体を ErrorJson にする
export const makeDistanceValueJson = (
    target: (ConvertExcludeError<LocationValueType> | string)[],
    owner: ConvertKeys,
): DistanceValueJson | ErrorJson => {
    const [fieldParam, targetParam, unit] = target;
    if (
        target.length !== 3 ||
        fieldParam === undefined ||
        typeof fieldParam === 'string' ||
        targetParam === undefined ||
        typeof targetParam === 'string' ||
        typeof unit !== 'string'
    ) {
        return makeErrorJson(owner, ERROR_KIND);
    }

    return {
        field: makeLocationValueElementJson(fieldParam),
        target: makeLocationValueElementJson(targetParam),
        unit: unit,
    };
};

export type SoqlFunctionJson = { type: 'soqlFunction' } & (
    | {
          func:
              | 'AVG'
              | 'COUNT_DISTINCT'
              | 'MIN'
              | 'MAX'
              | 'SUM'
              | 'TOLABEL'
              | 'GROUPING'
              | 'CONVERT_CURRENCY';
          arg: string[];
      }
    | {
          func:
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
          arg: DateFieldNameJson;
      }
    | {
          func: 'COUNT';
          arg?: string[];
      }
    | {
          func: 'FORMAT';
          arg: string[] | Omit<SoqlFunctionJson, 'type'> | ErrorJson;
      }
    | {
          func: 'FIELDS';
          arg: 'ALL' | 'CUSTOM' | 'STANDARD';
      }
    | {
          func: 'DISTANCE';
          arg: DistanceValueJson | ErrorJson;
      }
);

export const isSoqlFunctionJson = typia.createIs<SoqlFunctionJson>();

export const makeSoqlFunctionJson = (
    target: ConvertExcludeError<SoqlFunctionType>,
): SoqlFunctionJson => {
    if (
        target.value === 'AVG' ||
        target.value === 'COUNT_DISTINCT' ||
        target.value === 'MIN' ||
        target.value === 'MAX' ||
        target.value === 'SUM' ||
        target.value === 'TOLABEL' ||
        target.value === 'GROUPING' ||
        target.value === 'CONVERT_CURRENCY'
    ) {
        return {
            type: 'soqlFunction',
            func: target.value,
            arg: makeFieldNameJson(target.param),
        };
    } else if (
        target.value === 'CALENDAR_MONTH' ||
        target.value === 'CALENDAR_QUARTER' ||
        target.value === 'CALENDAR_YEAR' ||
        target.value === 'DAY_IN_MONTH' ||
        target.value === 'DAY_IN_WEEK' ||
        target.value === 'DAY_IN_YEAR' ||
        target.value === 'DAY_ONLY' ||
        target.value === 'FISCAL_MONTH' ||
        target.value === 'FISCAL_QUARTER' ||
        target.value === 'FISCAL_YEAR' ||
        target.value === 'HOUR_IN_DAY' ||
        target.value === 'WEEK_IN_MONTH' ||
        target.value === 'WEEK_IN_YEAR'
    ) {
        return {
            type: 'soqlFunction',
            func: target.value,
            arg: makeDateFieldNameJson(target.param),
        };
    } else if (target.value === 'COUNT') {
        const soqlFunctionJson: SoqlFunctionJson = {
            type: 'soqlFunction',
            func: target.value,
        };
        if (target.param) {
            soqlFunctionJson.arg = makeFieldNameJson(target.param);
        }

        return soqlFunctionJson;
    } else if (target.value === 'FORMAT') {
        if (target.param.type === 'fieldName') {
            return {
                type: 'soqlFunction',
                func: target.value,
                arg: makeFieldNameJson(target.param),
            };
        } else {
            const paramSoqlFunction = makeSoqlFunctionJson(target.param);
            const { type, ...content } = paramSoqlFunction;
            return {
                type: 'soqlFunction',
                func: target.value,
                arg: content,
            };
        }
    } else if (target.value === 'FIELDS') {
        return {
            type: 'soqlFunction',
            func: target.value,
            arg: makeSoqlFieldParameterJson(target.param),
        };
    } else {
        return {
            type: 'soqlFunction',
            func: target.value,
            arg: makeDistanceValueJson(
                target.param as (ConvertExcludeError<LocationValueType> | string)[],
                target,
            ),
        };
    }
};

