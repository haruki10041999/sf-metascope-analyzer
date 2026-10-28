import typia from 'typia';

import {
    Convert,
    ConvertExcludeError,
    ErrorJson,
    JsonType,
    makeJsonType,
    convertExcludeError,
    mergeRecord,
    convertValue,
    ConvertType,
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

import { BaseExpressionJson, makeExpressionJsonConvert } from '../expression';
import { SubQueryJson, makeSubQueryJson } from './subQuery';
import { SoqlFunctionJson, makeSoqlFunctionJson } from './soqlFunction';
import { FieldJson, makeFieldJson } from './select';

export type SignedNumberJson = {
    value: string;
    valueType: 'number' | 'integer';
    operator?: '+' | '-';
};
export const isSignedNumberJson = typia.createIs<SignedNumberJson>();

export const makeSignedNumberJson = (
    target: ConvertExcludeError<SignedNumberType>,
): SignedNumberJson => {
    const value = target.value;
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

export type ValueJson =
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
    | { type: 'subQuery'; value: SubQueryJson }
    | { type: 'list'; value: ValueJson[] }
    | { type: 'bind'; value: BaseExpressionJson | ErrorJson };

export const isValueJson = typia.createIs<ValueJson>();

export const makeValueJson = (target: ConvertExcludeError<ValueType>): ValueJson => {
    if (target.valueType === 'error') {
        throw new Error('Cannot convert error value to JSON');
    }

    if (target.valueType === 'number') {
        return {
            type: target.valueType,
            ...makeSignedNumberJson(target.value),
        };
    } else if (target.valueType === 'dateFormula') {
        return {
            type: target.valueType,
            ...makeDateFormulaJson(target.value),
        };
    } else if (target.valueType === 'subQuery') {
        return {
            type: target.valueType,
            value: makeSubQueryJson(target.value),
        };
    } else if (target.valueType === 'list') {
        return {
            type: target.valueType,
            value: target.value.value.map((item) => makeValueJson(item)),
        };
    } else if (target.valueType === 'bind') {
        return {
            type: target.valueType,
            value: makeExpressionJsonConvert(target.value.value),
        };
    } else {
        return {
            type: target.valueType,
            value: target.value,
        };
    }
};

export type QueryOperatorJson = JsonType<'queryOperator'> & {
    operator:
        | '='
        | '!='
        | '<'
        | '>'
        | '<='
        | '>='
        | '<>'
        | 'LIKE'
        | 'IN'
        | 'NOT IN'
        | 'INCLUDES'
        | 'EXCLUDES';
};
export const isQueryOperatorJson = typia.createIs<QueryOperatorJson>();

export const makeComparisonOperatorJson = (
    target: ConvertExcludeError<ComparisonOperatorType>,
):
    | '='
    | '!='
    | '<'
    | '>'
    | '<='
    | '>='
    | '<>'
    | 'LIKE'
    | 'IN'
    | 'NOT IN'
    | 'INCLUDES'
    | 'EXCLUDES' => {
    return target.value;
};

export type SingleConditionJson = JsonType<'singleCondition'> & {
    field: Omit<FieldJson | SoqlFunctionJson, 'sourceKeys'> | ErrorJson;
    operator:
        | '='
        | '!='
        | '<'
        | '>'
        | '<='
        | '>='
        | '<>'
        | 'LIKE'
        | 'IN'
        | 'NOT IN'
        | 'INCLUDES'
        | 'EXCLUDES';
    value: ValueJson;
};

export const isSingleConditionJson = typia.createIs<SingleConditionJson>();

export const makeSingleConditionJson = (
    target: ConvertType<FieldExpressionType>,
    targetRecords?: Record<string, string[]>,
): SingleConditionJson | ErrorJson => {
    return convertValue<'fieldExpression', FieldExpressionType, SingleConditionJson>(
        ['fieldExpression'],
        target,
        'singleCondition',
        (target, targetRecords) => {
            const field = target.left;
            const operator = makeComparisonOperatorJson(target.operator);
            const value = makeValueJson(target.right);

            let fieldValue: FieldJson | SoqlFunctionJson | ErrorJson;
            if (field.type === 'fieldName') {
                fieldValue = makeFieldJson(field, targetRecords);
            } else {
                fieldValue = makeSoqlFunctionJson(field, targetRecords);
            }

            if (fieldValue.kind === 'error') {
                return makeJsonType('singleCondition', targetRecords, {
                    field: fieldValue,
                    operator: operator,
                    value: value,
                });
            }

            const { sourceKeys, ...content } = fieldValue;
            return makeJsonType('singleCondition', targetRecords, {
                field: content,
                operator: operator,
                value: value,
            });
        },
        targetRecords,
    );
};

export type LogicalConditionJson = {
    condition: (SingleConditionJson | LogicalConditionJson | ErrorJson)[];
    operator?: 'AND' | 'OR' | 'NOT';
};

export const isLogicalConditionJson = typia.createIs<LogicalConditionJson>();

export const makeLogicalConditionJson = (
    target: ConvertExcludeError<LogicalExpressionType>,
): LogicalConditionJson => {
    const operator = target.operator;
    const condition: (SingleConditionJson | LogicalConditionJson | ErrorJson)[] = [];
    target.value.forEach((v) => {
        if (v.value.type === 'fieldExpression') {
            condition.push(makeSingleConditionJson(v.value));
        } else {
            condition.push(makeLogicalConditionJson(v.value));
        }
    });

    return {
        condition: condition,
        ...(operator !== null ? { operator: operator } : {}),
    };
};
