import type {
    CoordinateValueTypeClass,
    DateFieldNameTypeClass,
    FieldNameTypeClass,
    LocationValueTypeClass,
    SoqlFieldsParameterTypeClass,
    SoqlFunctionType,
    SoqlFunctionTypeClass,
} from '../../apex_IR';

import { JsonType } from '../../commons';
import { makeDerivedNodeJson, makeNodeJson } from '../commons/node';
import { BaseExpressionJson, makeExpressionJsonConvert } from '../expression';

const makeFieldNameJson = (target: FieldNameTypeClass): string[] => {
    return target.getFields().value.map((v) => v.getFields().value.getFields().value);
};

/** 日付の関数の引数の項目 (convertTimezone(x) で包んだかどうか) */
export type DateFieldNameJson = JsonType<'soqlDateField'> & {
    name: string[];
    isConvertTimeZone: boolean;
};
const makeDateFieldNameJson = (target: DateFieldNameTypeClass): DateFieldNameJson => {
    const { value, isConvertTimeZone } = target.getFields();

    return makeNodeJson<DateFieldNameJson>('soqlDateField', target, {
        name: makeFieldNameJson(value),
        isConvertTimeZone: isConvertTimeZone,
    });
};

const makeSoqlFieldParameterJson = (
    target: SoqlFieldsParameterTypeClass,
): 'ALL' | 'CUSTOM' | 'STANDARD' => {
    return target.getFields().value;
};

/** GEOLOCATION の緯度・経度の 1 つ */
export type CoordinateElementJson = JsonType<'soqlCoordinateElement'> &
    (
        | {
              type: 'bind';
              value: BaseExpressionJson;
          }
        | {
              type: 'literal';
              value: string;
              valueType: string;
              operator?: string;
          }
    );

const makeCoordinateElementParamJson = (
    target: CoordinateValueTypeClass,
): CoordinateElementJson => {
    const value = target.getFields().value;
    switch (value.kind) {
        case 'boundExpression':
            // バインド式 (:var) は中の式を出す
            return makeNodeJson<CoordinateElementJson>('soqlCoordinateElement', target, {
                type: 'bind',
                value: makeExpressionJsonConvert(value.getFields().value),
            });
        case 'signedNumber': {
            const { value: literalValue, valueType, operator } = value.getFields();

            return makeNodeJson<CoordinateElementJson>('soqlCoordinateElement', target, {
                type: 'literal',
                value: literalValue,
                valueType: valueType,
                ...(operator ? { operator } : {}),
            });
        }
    }
};

/** GEOLOCATION(緯度, 経度)。IR に対応するノードがないので、位置は GEOLOCATION を含む引数のもの */
export type CoordinateValueJson = JsonType<'soqlCoordinate'> & {
    latitude: CoordinateElementJson;
    longitude: CoordinateElementJson;
};

/** DISTANCE の起点・終点の 1 つ */
export type LocationValueElementJson = JsonType<'soqlLocation'> &
    (
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
          }
    );

const makeLocationValueElementJson = (target: LocationValueTypeClass): LocationValueElementJson => {
    const fields = target.getFields();
    switch (fields.kind) {
        case 'geolocation':
            // GEOLOCATION(緯度, 経度)。v2 では緯度と経度が必ずそろっている
            return makeNodeJson<LocationValueElementJson>('soqlLocation', target, {
                type: 'coordinate',
                field: makeDerivedNodeJson<CoordinateValueJson>('soqlCoordinate', target, {
                    latitude: makeCoordinateElementParamJson(fields.latitude),
                    longitude: makeCoordinateElementParamJson(fields.longitude),
                }),
            });
        case 'field':
            return makeNodeJson<LocationValueElementJson>('soqlLocation', target, {
                type: 'field',
                field: makeFieldNameJson(fields.value),
            });
        case 'bind':
            // バインド式 (:var) は中の式を出す
            return makeNodeJson<LocationValueElementJson>('soqlLocation', target, {
                type: 'bind',
                field: makeExpressionJsonConvert(fields.value.getFields().value),
            });
    }
};

/** DISTANCE(起点, 終点, 単位) の引数。IR に対応するノードがないので、位置は DISTANCE の関数のもの */
export type DistanceValueJson = JsonType<'soqlDistance'> & {
    field: LocationValueElementJson;
    target: LocationValueElementJson;
    unit: string;
};

type DistanceParam = Extract<SoqlFunctionType, { kind: 'DISTANCE' }>['param'];

// DISTANCE(起点, 終点, 単位) の 3 引数。単位は文字列リテラル (引用符つき) のまま
const makeDistanceValueJson = (
    owner: SoqlFunctionTypeClass,
    param: DistanceParam,
): DistanceValueJson =>
    makeDerivedNodeJson<DistanceValueJson>('soqlDistance', owner, {
        field: makeLocationValueElementJson(param.from),
        target: makeLocationValueElementJson(param.to),
        unit: param.unit,
    });

/** SOQL の関数 (条件の左辺・GROUP BY・SOSL の項目などに単独で置くもの) */
export type SoqlFunctionJson = JsonType<'soqlFunction'> & SoqlFunctionBody;

/** SOQL の関数の中身 (SELECT・ORDER BY の項目のノードに展開するときはこちら) */
export type SoqlFunctionBody = { type: 'soqlFunction' } & (
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
          /** FORMAT(関数) の中の関数はノード */
          arg: string[] | SoqlFunctionJson;
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

export const makeSoqlFunctionJson = (target: SoqlFunctionTypeClass): SoqlFunctionJson =>
    makeNodeJson<SoqlFunctionJson>('soqlFunction', target, makeSoqlFunctionBody(target));

export const makeSoqlFunctionBody = (target: SoqlFunctionTypeClass): SoqlFunctionBody => {
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
            const soqlFunctionJson: SoqlFunctionBody = {
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
            return {
                type: 'soqlFunction',
                func: fields.kind,
                arg: makeSoqlFunctionJson(param),
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
                arg: makeDistanceValueJson(target, fields.param),
            };
    }
};
