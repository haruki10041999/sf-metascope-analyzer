import typia from 'typia';

import type {
    CoordinateValueTypeClass,
    DateFieldNameTypeClass,
    FieldNameTypeClass,
    LocationValueTypeClass,
    SoqlFieldsParameterTypeClass,
    SoqlFunctionType,
    SoqlFunctionTypeClass,
} from '../../apex_IR';

import { BaseExpressionJson, makeExpressionJsonConvert } from '../expression';

const makeFieldNameJson = (target: FieldNameTypeClass): string[] => {
    return target.getFields().value.map((v) => v.getFields().value.getFields().value);
};

export type DateFieldNameJson = {
    name: string[];
    isConvertTimeZone: boolean;
};
export const isDateFieldNameJson = typia.createIs<DateFieldNameJson>();
const makeDateFieldNameJson = (target: DateFieldNameTypeClass): DateFieldNameJson => {
    const { value, isConvertTimeZone } = target.getFields();

    return {
        name: makeFieldNameJson(value),
        isConvertTimeZone: isConvertTimeZone,
    };
};

const makeSoqlFieldParameterJson = (
    target: SoqlFieldsParameterTypeClass,
): 'ALL' | 'CUSTOM' | 'STANDARD' => {
    return target.getFields().value;
};

export type CoordinateElementJson =
    | {
          type: 'bind';
          value: BaseExpressionJson;
      }
    | {
          type: 'literal';
          value: string;
          valueType: string;
          operator?: string;
      };

const makeCoordinateElementParamJson = (
    target: CoordinateValueTypeClass,
): CoordinateElementJson => {
    const value = target.getFields().value;
    switch (value.kind) {
        case 'boundExpression':
            // バインド式 (:var) は中の式を出す
            return {
                type: 'bind',
                value: makeExpressionJsonConvert(value.getFields().value),
            };
        case 'signedNumber': {
            const { value: literalValue, valueType, operator } = value.getFields();

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
    }
};

export type CoordinateValueJson = {
    latitude: CoordinateElementJson;
    longitude: CoordinateElementJson;
};

type LocationValueElementJson =
    | {
          type: 'field';
          field: string[];
      }
    | {
          type: 'bind';
          field: BaseExpressionJson;
      }
    | {
          type: 'coordinate';
          field: CoordinateValueJson;
      };

const makeLocationValueElementJson = (target: LocationValueTypeClass): LocationValueElementJson => {
    const fields = target.getFields();
    switch (fields.kind) {
        case 'geolocation':
            // GEOLOCATION(緯度, 経度)。v2 では緯度と経度が必ずそろっている
            return {
                type: 'coordinate',
                field: {
                    latitude: makeCoordinateElementParamJson(fields.latitude),
                    longitude: makeCoordinateElementParamJson(fields.longitude),
                },
            };
        case 'field':
            return {
                type: 'field',
                field: makeFieldNameJson(fields.value),
            };
        case 'bind':
            // バインド式 (:var) は中の式を出す
            return {
                type: 'bind',
                field: makeExpressionJsonConvert(fields.value.getFields().value),
            };
    }
};

export type DistanceValueJson = {
    field: LocationValueElementJson;
    target: LocationValueElementJson;
    unit: string;
};
export const isDistanceValueJson = typia.createIs<DistanceValueJson>();

type DistanceParam = Extract<SoqlFunctionType, { kind: 'DISTANCE' }>['param'];

// DISTANCE(起点, 終点, 単位) の 3 引数。単位は文字列リテラル (引用符つき) のまま
export const makeDistanceValueJson = (target: DistanceParam): DistanceValueJson => {
    return {
        field: makeLocationValueElementJson(target.from),
        target: makeLocationValueElementJson(target.to),
        unit: target.unit,
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
          arg: string[] | Omit<SoqlFunctionJson, 'type'>;
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

export const makeSoqlFunctionJson = (target: SoqlFunctionTypeClass): SoqlFunctionJson => {
    const fields = target.getFields();
    switch (fields.kind) {
        case 'AVG':
        case 'COUNT_DISTINCT':
        case 'MIN':
        case 'MAX':
        case 'SUM':
        case 'TOLABEL':
        case 'GROUPING':
        case 'CONVERT_CURRENCY':
            return {
                type: 'soqlFunction',
                func: fields.kind,
                arg: makeFieldNameJson(fields.param),
            };
        case 'CALENDAR_MONTH':
        case 'CALENDAR_QUARTER':
        case 'CALENDAR_YEAR':
        case 'DAY_IN_MONTH':
        case 'DAY_IN_WEEK':
        case 'DAY_IN_YEAR':
        case 'DAY_ONLY':
        case 'FISCAL_MONTH':
        case 'FISCAL_QUARTER':
        case 'FISCAL_YEAR':
        case 'HOUR_IN_DAY':
        case 'WEEK_IN_MONTH':
        case 'WEEK_IN_YEAR':
            return {
                type: 'soqlFunction',
                func: fields.kind,
                arg: makeDateFieldNameJson(fields.param),
            };
        case 'COUNT': {
            const soqlFunctionJson: SoqlFunctionJson = {
                type: 'soqlFunction',
                func: fields.kind,
            };
            if (fields.param) {
                soqlFunctionJson.arg = makeFieldNameJson(fields.param);
            }

            return soqlFunctionJson;
        }
        case 'FORMAT': {
            const param = fields.param;
            if (param.kind === 'fieldName') {
                return {
                    type: 'soqlFunction',
                    func: fields.kind,
                    arg: makeFieldNameJson(param),
                };
            }
            // FORMAT(関数) は、中の関数の type を除いたものを arg にする
            const { type: _type, ...content } = makeSoqlFunctionJson(param);
            return {
                type: 'soqlFunction',
                func: fields.kind,
                arg: content,
            };
        }
        case 'FIELDS':
            return {
                type: 'soqlFunction',
                func: fields.kind,
                arg: makeSoqlFieldParameterJson(fields.param),
            };
        case 'DISTANCE':
            return {
                type: 'soqlFunction',
                func: fields.kind,
                arg: makeDistanceValueJson(fields.param),
            };
    }
};
