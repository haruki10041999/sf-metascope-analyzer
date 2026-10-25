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
    ErrorType,
} from '../converter';

import { ExpressionJson, makeExpressionJson } from '../expression';
import { SubQueryJson, makeSubQueryJson } from './subQuery';
import { SoqlFunctionJson, makeSoqlFunctionJson } from './soqlFunction';

export type SignedNumberJson = {
    value: string;
    valueType: 'number' | 'integer';
    operator?: '+' | '-';
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

export type DateFormulaJson =
    | {
          func:
              | 'YESTERDAY'
              | 'TODAY'
              | 'TOMORROW'
              | 'LAST_WEEK'
              | 'THIS_WEEK'
              | 'NEXT_WEEK'
              | 'LAST_MONTH'
              | 'THIS_MONTH'
              | 'NEXT_MONTH'
              | 'LAST_90_DAYS'
              | 'NEXT_90_DAYS'
              | 'THIS_QUARTER'
              | 'LAST_QUARTER'
              | 'NEXT_QUARTER'
              | 'THIS_YEAR'
              | 'LAST_YEAR'
              | 'NEXT_YEAR'
              | 'THIS_FISCAL_QUARTER'
              | 'LAST_FISCAL_QUARTER'
              | 'NEXT_FISCAL_QUARTER'
              | 'THIS_FISCAL_YEAR'
              | 'LAST_FISCAL_YEAR'
              | 'NEXT_FISCAL_YEAR';
      }
    | {
          func:
              | 'LAST_N_DAYS_N'
              | 'NEXT_N_DAYS_N'
              | 'N_DAYS_AGO_N'
              | 'NEXT_N_WEEKS_N'
              | 'LAST_N_WEEKS_N'
              | 'N_WEEKS_AGO_N'
              | 'NEXT_N_MONTHS_N'
              | 'LAST_N_MONTHS_N'
              | 'N_MONTHS_AGO_N'
              | 'NEXT_N_QUARTERS_N'
              | 'LAST_N_QUARTERS_N'
              | 'N_QUARTERS_AGO_N'
              | 'NEXT_N_FISCAL_QUARTERS_N'
              | 'LAST_N_FISCAL_QUARTERS_N'
              | 'N_FISCAL_QUARTERS_AGO_N'
              | 'NEXT_N_YEARS_N'
              | 'LAST_N_YEARS_N'
              | 'N_YEARS_AGO_N'
              | 'NEXT_N_FISCAL_YEARS_N'
              | 'LAST_N_FISCAL_YEARS_N'
              | 'N_FISCAL_YEARS_AGO_N';
          arg: string;
          argType: 'integer';
          argOperator?: '+' | '-';
      };
export const isDateFormulaJson = typia.createIs<DateFormulaJson>();

export const makeDateFormulaJson = (
    target: ConvertExcludeError<DateFormulaType>,
): DateFormulaJson => {
    if (
        target.value === 'LAST_N_DAYS_N' ||
        target.value === 'NEXT_N_DAYS_N' ||
        target.value === 'N_DAYS_AGO_N' ||
        target.value === 'NEXT_N_WEEKS_N' ||
        target.value === 'LAST_N_WEEKS_N' ||
        target.value === 'N_WEEKS_AGO_N' ||
        target.value === 'NEXT_N_MONTHS_N' ||
        target.value === 'LAST_N_MONTHS_N' ||
        target.value === 'N_MONTHS_AGO_N' ||
        target.value === 'NEXT_N_QUARTERS_N' ||
        target.value === 'LAST_N_QUARTERS_N' ||
        target.value === 'N_QUARTERS_AGO_N' ||
        target.value === 'NEXT_N_FISCAL_QUARTERS_N' ||
        target.value === 'LAST_N_FISCAL_QUARTERS_N' ||
        target.value === 'N_FISCAL_QUARTERS_AGO_N' ||
        target.value === 'NEXT_N_YEARS_N' ||
        target.value === 'LAST_N_YEARS_N' ||
        target.value === 'N_YEARS_AGO_N' ||
        target.value === 'NEXT_N_FISCAL_YEARS_N' ||
        target.value === 'LAST_N_FISCAL_YEARS_N' ||
        target.value === 'N_FISCAL_YEARS_AGO_N'
    ) {
        const param = target.param;
        const dateFormulaJson: DateFormulaJson = {
            func: target.value,
            arg: param.value,
            argType: param.valueType,
        };
        if (param.operator) {
            dateFormulaJson.argOperator = param.operator;
        }

        return dateFormulaJson;
    } else {
        return {
            func: target.value,
        };
    }
};

export type ValueJson = JsonType<'value'> &
    (
        | {
              type:
                  | 'null'
                  | 'boolean'
                  | 'string'
                  | 'integer'
                  | 'longText'
                  | 'date'
                  | 'time'
                  | 'dateTime'
                  | 'currency';
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
        | { type: 'list'; value: Omit<ValueJson, 'kind' | 'sourceKeys'>[] }
        | ({ type: 'bind' } & ExpressionJson)
    );

export const isValueJson = typia.createIs<ValueJson>();

export const makeValueJson = (target: Convert<ValueType | ErrorType>): ValueJson | ErrorJson => {
    const targetRecords: Record<string, string[]> = { [target.objectKey]: [target.sourceKey] };

    const { value, errorInfos } = convertExcludeError<ValueType | ErrorType>(target);

    const error: ErrorJson = makeJsonType('error', targetRecords, { kindType: 'value' });

    if (!value || errorInfos.length > 0 || !('valueType' in value)) {
        return error;
    }

    if (typeof value.value === 'string') {
        return makeJsonType('value', targetRecords, {
            type: value.valueType,
            value: value.value,
        });
    }

    if (value.valueType === 'number') {
        const signedNumberJson = makeSignedNumberJson(value.value);
        return makeJsonType('value', targetRecords, {
            type: value.valueType,
            ...signedNumberJson,
        });
    }

    if (value.valueType === 'dateFormula') {
        const dateForumlaJson = makeDateFormulaJson(value.value);
        return makeJsonType('value', targetRecords, {
            type: value.valueType,
            ...dateForumlaJson,
        });
    }

    if (value.valueType === 'subQuery') {
        const subQueryJson = makeSubQueryJson(value.value);
        const { type, ...content } = subQueryJson;

        return makeJsonType('value', targetRecords, {
            type: value.valueType,
            ...content,
        });
    }

    if (value.valueType === 'list') {
        return makeJsonType('value', targetRecords, {
            type: value.valueType,
            value: value.value.value.map((v) => {
                const { kind, sourceKeys, ...content } = makeValueJson(v);
                return content;
            }),
        });
    }

    if (value.valueType === 'bind') {
        const expressionJson = makeExpressionJson(value.value.value);
        return makeJsonType('value', targetRecords, {
            type: value.valueType,
            ...expressionJson,
        });
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
