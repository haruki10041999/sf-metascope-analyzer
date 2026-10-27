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
    convertValue,
    ConvertType,
    StructureJsonType,
    makeStructureJsonType,
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

export const makeValueJson = (
    target: ConvertType<ValueType>,
    targetRecords?: Record<string, string[]>,
): ValueJson | ErrorJson => {
    return convertValue<'value', 'value', ValueType, ValueJson | ErrorJson>(
        ['value'],
        target,
        ['value'],
        'value',
        (value, records, errorJson) => {
            if (!('valueType' in value)) {
                return errorJson;
            }

            if (typeof value.value === 'string') {
                return makeJsonType('value', records, {
                    type: value.valueType,
                    value: value.value,
                });
            }

            if (value.valueType === 'number') {
                const signedNumberJson = makeSignedNumberJson(value.value);
                return makeJsonType('value', records, {
                    type: value.valueType,
                    ...signedNumberJson,
                });
            }

            if (value.valueType === 'dateFormula') {
                const dateFormulaJson = makeDateFormulaJson(value.value);
                return makeJsonType('value', records, {
                    type: value.valueType,
                    ...dateFormulaJson,
                });
            }

            if (value.valueType === 'subQuery') {
                const subQueryJson = makeSubQueryJson(value.value);
                if (isErrorJson(subQueryJson)) {
                    return errorJson;
                }

                const { kind, sourceKeys, ...content } = subQueryJson;
                return makeJsonType('value', records, {
                    type: value.valueType,
                    ...content,
                });
            }

            if (value.valueType === 'list') {
                const values = value.value.value.map((item) => makeValueJson(item));
                if (values.some(isErrorJson)) {
                    return errorJson;
                }

                return makeJsonType('value', records, {
                    type: value.valueType,
                    value: values.map(({ kind, sourceKeys, ...content }) => content),
                });
            }

            if (value.valueType === 'bind') {
                const expressionJson = makeExpressionJson(value.value.value);
                return makeJsonType('value', records, {
                    type: value.valueType,
                    ...expressionJson,
                });
            }

            return errorJson;
        },
        targetRecords,
    );
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

export type SingleConditionJson = StructureJsonType<
    'singleCondition',
    {
        field:
            | Omit<FieldJson, 'sourceKeys'>
            | Omit<SoqlFunctionJson, 'sourceKeys'>
            | Omit<ErrorJson, 'sourceKeys'>;
        value: Omit<ValueJson, 'sourceKeys'> | Omit<ErrorJson, 'sourceKeys'>;
    }
> & {
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

export const isSingleConditionJson = typia.createIs<SingleConditionJson>();

export const makeSingleConditionJson = (
    target: ConvertType<FieldExpressionType>,
    targetRecords?: Record<string, string[]>,
): SingleConditionJson | ErrorJson => {
    return convertValue<
        'fieldExpression',
        'singleCondition',
        FieldExpressionType,
        SingleConditionJson
    >(
        ['fieldExpression'],
        target,
        ['singleCondition'],
        'singleCondition',
        (target, _targetRecords, _errorJson) => {
            const field = target.left;
            const operator = makeComparisonOperatorJson(target.operator);
            const value = makeValueJson(target.right);

            let fieldValue: FieldJson | SoqlFunctionJson | ErrorJson;
            if (field.type === 'fieldName') {
                fieldValue = makeFieldJson(field);
            } else {
                fieldValue = makeSoqlFunctionJson(field);
            }

            return makeStructureJsonType(
                'singleCondition',
                {
                    field: fieldValue,
                    value: value,
                },
                { operator: operator },
            );
        },
        targetRecords,
    );
};

export type LogicalConditionJson = StructureJsonType<
    'logicalCondition',
    {
        condition: (
            | Omit<SingleConditionJson, 'sourceKeys'>
            | Omit<LogicalConditionJson, 'sourceKeys'>
            | Omit<ErrorJson, 'sourceKeys'>
        )[];
    }
> & { operator?: 'AND' | 'OR' | 'NOT' };

export const isLogicalConditionJson = typia.createIs<LogicalConditionJson>();

export const makeLogicalConditionJson = (
    target: ConvertType<LogicalExpressionType>,
    targetRecords?: Record<string, string[]>,
): LogicalConditionJson | ErrorJson => {
    return convertValue<
        'logicalExpression',
        'logicalCondition',
        LogicalExpressionType,
        LogicalConditionJson
    >(
        ['logicalExpression'],
        target,
        ['logicalCondition'],
        'logicalCondition',
        (target, _targetRecord, _errorJson) => {
            const operator = target.operator;
            const condition: (SingleConditionJson | LogicalConditionJson | ErrorJson)[] = [];
            target.value.forEach((v) => {
                if (v.value.type === 'fieldExpression') {
                    condition.push(makeSingleConditionJson(v.value));
                } else {
                    condition.push(makeLogicalConditionJson(v.value));
                }
            });

            return makeStructureJsonType(
                'logicalCondition',
                { condition: condition },
                operator !== null ? { operator } : {},
            );
        },
        targetRecords,
    );
};
