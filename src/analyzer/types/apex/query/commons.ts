import typia from 'typia';

import {
    Convert,
    ConvertExcludeError,
    ErrorJson,
    isErrorJson,
    JsonType,
    makeJsonType,
    convertExcludeError,
    mergeRecord,
} from '..//commons';

import {
    ValueType,
    SignedNumberType,
    DateFormulaType,
    SubQueryType,
    ValueListType,
    BoundExpressionType,
    SignedIntegerType,
    ComparisonOperatorType,
    FieldExpressionType,
    LogicalExpressionType,
    SoqlFunctionType,
    FieldNameType,
} from '../converter';

import { ExpressionJson, makeExpressionJson } from '../expression';
import { SubQueryJson, makeSubQueryJson } from './subQuery';
import { SoqlFunctionJson, makeSoqlFunctionJson } from './soqlFunction';

export type SignedNumberJson = {
    value: string;
    valueType: string;
    operator?: string;
};
export const isSignedNumberJson = typia.createIs<SignedNumberJson>();

export const makeSignedNumberJson = (
    target: ConvertExcludeError<SignedNumberType>,
): SignedNumberJson => {
    const value = target.valueType;
    const valueType = target.valueType;
    const operator = target.operator;

    const signedNumberJson: SignedNumberJson = {
        value: value,
        valueType: valueType,
    };

    if (operator) {
        signedNumberJson.operator = operator;
    }

    return signedNumberJson;
};

export type DateFormulaJson = {
    func: string;
    arg?: string;
    argType?: string;
    argOperator?: string;
};
export const isDateFormulaJson = typia.createIs<DateFormulaJson>();

export const makeDateFormulaJson = (
    target: ConvertExcludeError<DateFormulaType>,
): DateFormulaJson => {
    const func = target.value;
    const param = target.param;

    const dateFormulaJson: DateFormulaJson = {
        func: func,
    };

    if (param) {
        const arg = param.value;
        dateFormulaJson.arg = arg;

        dateFormulaJson.argType = param.type;

        const argOperator = param.operator;
        if (argOperator) {
            dateFormulaJson.argOperator = argOperator;
        }
    }

    return dateFormulaJson;
};

export type ValueJson =
    | {
          type: 'string';
          value: string;
      }
    | ({
          type: 'number';
      } & SignedNumberJson)
    | ({
          type: 'dateFormula';
      } & DateFormulaJson)
    | ({
          type: 'subQuery';
      } & Omit<SubQueryJson, 'type'>)
    | { type: 'list'; value: ValueJson[] }
    | ({ type: 'bind' } & ExpressionJson);

export const isValueJson = typia.createIs<ValueJson>();

export const makeValueJson = (target: ConvertExcludeError<ValueType>): ValueJson => {
    const value = target.value;

    if (typeof value === 'string') {
        return {
            type: 'string',
            value: value,
        };
    } else if (value.type === 'dateFormula') {
        return {
            type: type,
            ...makeDateFormulaJson(value),
        };
    } else if (value.type === 'signedNumber') {
        return {
            type: type,
            ...makeSignedNumberJson(value),
        };
    } else if (value.type === 'subQuery') {
        const subQueryJson = makeSubQueryJson(value);
        const { type, ...content } = subQueryJson;
        return {
            type: type,
            ...content,
        };
    } else if (value.type === 'valueList') {
        return {
            type: type,
            value: value.value.map((v) => makeValueJson(v)),
        };
    } else {
        return {
            type: type,
            ...makeExpressionJson(value.value),
        };
    }
};

export const makeComparisonOperatorJson = (
    target: ConvertExcludeError<ComparisonOperatorType>,
): string => {
    return target.value;
};

export type SingleConditionJson = {
    field: { type: 'field'; name: string[] } | SoqlFunctionJson;
    operator: string;
    value: ValueJson;
};

export const isSingleConditionJson = typia.createIs<SingleConditionJson>();

export const makeSingleConditionJson = (
    target: ConvertExcludeError<FieldExpressionType>,
): SingleConditionJson => {
    const field = target.left;
    const operator = makeComparisonOperatorJson(target.operator);
    const value = makeValueJson(target.right);

    if (value.type === 'fieldName') {
        const fieldValue = field.value.map((v) => v.value.value);

        return {
            field: { type: 'field', name: fieldValue },
            operator: operator,
            value: value,
        };
    } else {
        const fieldValue = makeSoqlFunctionJson(field);

        return {
            field: fieldValue,
            operator: operator,
            value: value,
        };
    }
};

export type LogicalConditionJson = {
    operator?: string;
    condition: (SingleConditionJson | LogicalConditionJson)[];
};
export const isLogicalConditionJson = typia.createIs<LogicalConditionJson>();

export const makeLogicalConditionJson = (
    target: ConvertExcludeError<LogicalExpressionType>,
): LogicalConditionJson => {
    const operator = target.operator;
    const condition = target.value.map((c) => {
        const conditionalExpression = c.value;
        if (isConvert<FieldExpressionType>(conditionalExpression)) {
            return makeSingleConditionJson(conditionalExpression);
        } else {
            return makeLogicalConditionJson(conditionalExpression);
        }
    });

    const logicalConditonJson: LogicalConditionJson = {
        condition: condition,
    };

    if (operator) {
        logicalConditonJson.operator = operator;
    }

    return logicalConditonJson;
};
