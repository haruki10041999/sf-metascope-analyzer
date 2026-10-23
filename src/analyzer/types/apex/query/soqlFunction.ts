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
const makeDateFieldParam = (target: ConvertExcludeError<DateFieldNameType>): DateFieldNameJson => {
    const name = makeFieldNameJson(target.value);
    const isConvertTimeZone = target.isConvertTimeZone;

    return {
        name: name,
        isConvertTimeZone: isConvertTimeZone,
    };
};

const makeSoqlFieldParameterJson = (
    target: ConvertExcludeError<SoqlFieldsParameterType>,
): string => {
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
    if (isConvert<BoundExpressionType>(target.value)) {
        const expressionValue = makeExpressionJson(target.value);
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
    target: Convert<CoordinateValueType>[],
): CoordinateValueJson => {
    const latitude = makeCoordinateElementParamJson(target[0]!);
    const longitude = makeCoordinateElementParamJson(target[1]!);

    return {
        latitude: latitude,
        longitude: longitude,
    };
};

export type DistanceValueJson = {
    field: string[];
    target:
        | {
              type: 'bind';
              value: ExpressionJson;
          }
        | ({
              type: 'coordinate';
          } & CoordinateValueJson);
    unit: string;
};
export const isDistanceValueJson = typia.createIs<DistanceValueJson>();

export const makeDistanceValueJson = (
    target: (Convert<LocationValueType> | string)[],
): DistanceValueJson => {
    const fieldParam = target[0]! as Convert<LocationValueType>;
    const targetParam = target[1]! as Convert<LocationValueType>;
    const unit = target[2]! as string;

    const field = makeFieldNameJson(
        castConvert(castExcludeErrorInfo(fieldParam.value) as FieldNameType),
    );

    let targetValue:
        | {
              type: 'bind';
              value: ExpressionJson;
          }
        | ({
              type: 'coordinate';
          } & CoordinateValueJson);
    const targetValueParamValue = castExcludeErrorInfo(targetParam.value);
    const targetValueParamCoodinates = targetParam.coordinates;
    const targetValueParamValueConverted = targetValueParamValue
        ? castConvert(
              castExcludeErrorInfo(
                  (castConvert(targetValueParamValue) as Convert<BoundExpressionType>).value,
              ),
          )
        : null;
    const targetValueParamCoordinatesConverted = targetValueParamCoodinates
        ? castConvertArray(
              castExcludeErrorInfoArray(castExcludeErrorInfo(targetValueParamCoodinates)),
          )
        : null;
    if (targetValueParamValueConverted) {
        const expression = makeExpressionJson(targetValueParamValueConverted);
        targetValue = {
            type: 'bind',
            value: expression,
        };
    } else {
        const coordinates = makeCoordinateParamValueJson(targetValueParamCoordinatesConverted!);
        targetValue = {
            type: 'coordinate',
            ...coordinates,
        };
    }

    return {
        field,
        target: targetValue,
        unit,
    };
};

export type SoqlFunctionJson = {
    type: 'soqlFunction';
    func: string;
    param?:
        string | string[] | DateFieldNameJson | DistanceValueJson | Omit<SoqlFunctionJson, 'type'>;
};

export const isSoqlFunctionJson = typia.createIs<SoqlFunctionJson>();

export const makeSoqlFunctionJson = (target: Convert<SoqlFunctionType>) => {
    const func = castExcludeErrorInfo(target.value);

    const soqlFunctionJson: SoqlFunctionJson = {
        type: 'soqlFunction',
        func: func,
    };

    const param = castExcludeErrorInfo(target.param);
    const paramValue = param
        ? Array.isArray(param)
            ? param.map((p) => {
                  if (typeof p === 'string') {
                      return p;
                  } else {
                      return castConvert(castExcludeErrorInfo(p));
                  }
              })
            : castConvert(param)
        : null;

    if (isConvert(paramValue, isFieldNameType)) {
        soqlFunctionJson.param = makeFieldNameJson(paramValue);
        return soqlFunctionJson;
    }

    if (isConvert(paramValue, isDateFieldNameType)) {
        soqlFunctionJson.param = makeDateFieldParam(paramValue);
        return soqlFunctionJson;
    }

    if (isConvert(paramValue, isSoqlFieldsParameterType)) {
        soqlFunctionJson.param = makeSoqlFieldParameterJson(paramValue);
        return soqlFunctionJson;
    }

    if (isConvert(paramValue, isSoqlFunctionType)) {
        const param = makeSoqlFunctionJson(paramValue);
        const { type, ...content } = param;
        soqlFunctionJson.param = content;
        return soqlFunctionJson;
    }

    if (Array.isArray(paramValue)) {
        soqlFunctionJson.param = makeDistanceValueJson(paramValue);
        return soqlFunctionJson;
    }

    return soqlFunctionJson;
};
