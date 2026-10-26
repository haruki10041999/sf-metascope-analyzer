import typia from 'typia';

import {
    Convert,
    isConvert,
    ErrorJson,
    isErrorJson,
    JsonType,
    makeJsonType,
    convertExcludeError,
    ConvertExcludeError,
    ConvertType,
    convertValue,
} from '../commons';

import {
    FieldNameType,
    DateFieldNameType,
    SoqlFieldsParameterType,
    CoordinateValueType,
    SignedNumberType,
    LocationValueType,
    SoqlFunctionType,
    isSoqlFunctionType,
    isBoundExpressionType,
    BoundExpressionType,
    isFieldNameType,
    isDateFieldNameType,
    isSoqlFieldsParameterType,
} from '../converter';

import { ExpressionJson, makeExpressionJson } from '../expression';

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
          value: ExpressionJson;
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
        const expressionValue = makeExpressionJson(target.value.value);
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
): CoordinateValueJson => {
    const latitude = makeCoordinateElementParamJson(target[0]!);
    const longitude = makeCoordinateElementParamJson(target[1]!);

    return {
        latitude: latitude,
        longitude: longitude,
    };
};

type LocationValueElementJson =
    | {
          type: 'field';
          field: string[];
      }
    | {
          type: 'bind';
          field: ExpressionJson;
      }
    | {
          type: 'coordinate';
          field: CoordinateValueJson;
      };

const makeLocationValueElementJson = (
    target: ConvertExcludeError<LocationValueType>,
): LocationValueElementJson => {
    if (Array.isArray(target.value)) {
        return {
            type: 'coordinate',
            field: makeCoordinateParamValueJson(target.value),
        };
    } else if (target.value.type === 'fieldName') {
        const fieldValue = makeFieldNameJson(target.value);
        return {
            type: 'field',
            field: fieldValue,
        };
    } else {
        const expressionValue = makeExpressionJson(target.value.value);
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

export const makeDistanceValueJson = (
    target: (ConvertExcludeError<LocationValueType> | string)[],
): DistanceValueJson => {
    const fieldParam = target[0]! as ConvertExcludeError<LocationValueType>;
    const targetParam = target[1]! as ConvertExcludeError<LocationValueType>;
    const unit = target[2]! as string;

    return {
        field: makeLocationValueElementJson(fieldParam),
        target: makeLocationValueElementJson(targetParam),
        unit: unit,
    };
};

export type SoqlFunctionJson = JsonType<'soqlFunction'> &
    (
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
              arg: string[] | Omit<SoqlFunctionJson, 'kind' | 'sourceKeys'>;
          }
        | {
              func: 'FIELDS';
              arg: 'ALL' | 'CUSTOM' | 'STANDARD';
          }
        | {
              func: 'DISTANCE';
              arg: DistanceValueJson;
          }
    );

export const isSoqlFunctionJson = typia.createIs<SoqlFunctionJson>();

export const makeSoqlFunctionJson = (
    target: ConvertType<SoqlFunctionType>,
    targetRecords?: Record<string, string[]>,
): SoqlFunctionJson | ErrorJson => {
    return convertValue<'soqlFunction', 'soqlFunction', SoqlFunctionType, SoqlFunctionJson>(
        ['soqlFunction'],
        target,
        'soqlFunction',
        (kind, target, targetRecords, errorJson) => {
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
                return makeJsonType(kind, targetRecords, {
                    func: target.value,
                    arg: makeFieldNameJson(target.param),
                });
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
                return makeJsonType(kind, targetRecords, {
                    func: target.value,
                    arg: makeDateFieldNameJson(target.param),
                });
            } else if (target.value === 'COUNT') {
                const soqlFunctionJson = makeJsonType(kind, targetRecords, {
                    func: target.value,
                });
                if (target.param) {
                    soqlFunctionJson.arg = makeFieldNameJson(target.param);
                }

                return soqlFunctionJson;
            } else if (target.value === 'FORMAT') {
                if (target.param.type === 'fieldName') {
                    return makeJsonType(kind, targetRecords, {
                        func: target.value,
                        arg: makeFieldNameJson(target.param),
                    });
                } else {
                    const paramSoqlFunction = makeSoqlFunctionJson(target.param);
                    const { kind, sourceKeys, ...content } = paramSoqlFunction;
                    return makeJsonType(kind, targetRecords, {
                        func: target.value,
                        arg: content,
                    });
                }
            } else if (target.value === 'FIELDS') {
                return makeJsonType(kind, targetRecords, {
                    func: target.value,
                    arg: makeSoqlFieldParameterJson(target.param),
                });
            } else if (target.value === 'DISTANCE') {
                return makeJsonType(kind, targetRecords, {
                    func: target.value,
                    arg: makeDistanceValueJson(target.param),
                });
            } else {
                return errorJson;
            }
        },
    );
};
