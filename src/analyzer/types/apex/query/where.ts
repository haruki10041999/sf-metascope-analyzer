import typia from 'typia';

import {
    Convert,
    isConvert,
    ErrorJson,
    JsonType,
    SourceJson,
    searchConvertAll,
    isError,
    writeSourceKeys,
    removeSourceInfo,
    castExcludeErrorInfo,
    castExcludeErrorInfoArray,
    castConvert,
    castConvertArray,
    isErrorJson,
} from '../commons';

import {
    WhereClauseType,
    WhereLogicalExpressionType,
    WhereConditionalExpressionType,
    WhereFieldExpressionType,
    FieldExpressionType,
    ComparisonOperatorType,
    ValueType,
    isFieldExpressionType,
    isWhereFieldExpressionType,
} from '../converter';

import {
    makeComparisonOperatorJson,
    ValueJson,
    makeValueJson,
    SingleConditionJson,
    isSingleConditionJson,
    makeSingleConditionJson,
} from './commons';

type WhereSingleConditionJson =
    | SingleConditionJson
    | {
          field: string;
          operator: string;
          value: ValueJson;
      };
export const isWhereSingleConditionJson = typia.createIs<WhereSingleConditionJson>();

export const makeWhereSingleConditionJson = (
    target: Convert<WhereFieldExpressionType>,
): WhereSingleConditionJson => {
    const field =
        typeof target.left === 'string'
            ? target.left
            : makeSingleConditionJson(castConvert(castExcludeErrorInfo(target.left)));
    const operator = target.operator
        ? makeComparisonOperatorJson(castConvert(castExcludeErrorInfo(target.operator)))
        : null;
    const value = target.right
        ? makeValueJson(castConvert(castExcludeErrorInfo(target.right)))
        : null;

    if (isSingleConditionJson(field)) {
        return field;
    } else {
        const _operator = operator as string;
        const _value = value as ValueJson;

        return {
            field: field as string,
            operator: _operator,
            value: _value,
        };
    }
};

type WhereLogicalExpressionJson = {
    operator?: string;
    conditions: (WhereSingleConditionJson | WhereLogicalExpressionJson)[];
};
export const isWhereLogicalExpressionJson = typia.createIs<WhereLogicalExpressionJson>();

export const makeWhereLogicalExpressionJson = (
    target: Convert<WhereLogicalExpressionType>,
): WhereLogicalExpressionJson => {
    const operator = target.operator;

    const conditions = castConvertArray(castExcludeErrorInfoArray(target.value)).map((c) => {
        const condition = castConvert(castExcludeErrorInfo(c.value));

        if (isConvert(condition, isWhereFieldExpressionType)) {
            return makeWhereSingleConditionJson(condition);
        } else {
            const _condition = condition as Convert<WhereLogicalExpressionType>;
            return makeWhereLogicalExpressionJson(_condition);
        }
    });

    const whereLogicalExpressionJson: WhereLogicalExpressionJson = {
        conditions: conditions,
    };

    if (operator) {
        whereLogicalExpressionJson.operator = operator;
    }

    return whereLogicalExpressionJson;
};

export type WhereJson = JsonType & {
    kind: 'where';
} & WhereLogicalExpressionJson;

export const isWhereJson = typia.createIs<WhereJson>();

export const makeWhereJson = (
    target: Convert<WhereClauseType>,
    sourceObject: SourceJson[],
): WhereJson | ErrorJson => {
    const targetObjectKey = target.objectKey;
    const targetSourceKey = target.sourceKey;
    const convertJsons = searchConvertAll(target);

    removeSourceInfo(sourceObject, convertJsons, [targetSourceKey]);
    const error: ErrorJson = {
        kind: 'error',
        kindType: 'where',
        sourceKeys: {},
    };
    writeSourceKeys(error, targetObjectKey, targetSourceKey);
    if (isError(convertJsons)) {
        return error;
    }

    const whereLogicalExpressionJson = makeWhereLogicalExpressionJson(
        castConvert(castExcludeErrorInfo(target.value)),
    );

    const whereJson: WhereJson = {
        kind: 'where',
        sourceKeys: {},
        ...whereLogicalExpressionJson,
    };
    writeSourceKeys(whereJson, targetObjectKey, targetSourceKey);

    return whereJson;
};
