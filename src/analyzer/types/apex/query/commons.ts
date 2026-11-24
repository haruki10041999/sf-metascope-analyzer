import { JsonType } from '../../commons';
import type {
    ComparisonOperatorTypeClass,
    DateFormulaTypeClass,
    FieldExpressionTypeClass,
    LogicalExpressionTypeClass,
    SignedIntegerTypeClass,
    SignedNumberTypeClass,
    ValueTypeClass,
} from '../../apex_IR';

import type { FormulaFieldJson } from './where';
import { makeNodeJson } from '../commons/node';
import { BaseExpressionJson, makeExpressionJsonConvert } from '../expression';
import { SubQueryJson, makeSubQueryJson } from './subQuery';
import { SoqlFunctionJson, makeSoqlFunctionJson } from './soqlFunction';
import { FieldJson, makeFieldJson } from './select';

/** 符号つきの数の中身 (条件の値 ValueJson の number に展開する。単独のノードにはしない) */
export type SignedNumberBody = {
    value: string;
    valueType: 'number' | 'integer';
    operator?: '+' | '-';
};

// signedInteger (日付の関数の N) も同じ形 (value・valueType・operator) なので、どちらも受け取る
export const makeSignedNumberBody = (
    target: SignedNumberTypeClass | SignedIntegerTypeClass,
): SignedNumberBody => {
    const { value, valueType, operator } = target.getFields();

    const signedNumberJson: SignedNumberBody = {
        value: value,
        valueType: valueType,
    };

    if (operator) {
        signedNumberJson.operator = operator;
    }

    return signedNumberJson;
};

/** 日付リテラルの関数の中身 (条件の値 ValueJson の dateFormula に展開する。単独のノードにはしない) */
export type DateFormulaBody =
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

export const makeDateFormulaBody = (target: DateFormulaTypeClass): DateFormulaBody => {
    const fields = target.getFields();
    // N の付く関数 (LAST_N_DAYS_N など) だけが引数 (signedInteger) を持つ
    if ('param' in fields) {
        const { value, valueType, operator } = fields.param.getFields();
        const dateFormulaJson: DateFormulaBody = {
            func: fields.kind,
            arg: value,
            argType: valueType,
        };
        if (operator) {
            dateFormulaJson.argOperator = operator;
        }

        return dateFormulaJson;
    } else {
        return {
            func: fields.kind,
        };
    }
};

/** 条件の右辺の値。リストの要素も同じ形 */
export type ValueJson = JsonType<'soqlValue'> & ValueBody;

type ValueBody =
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
      } & SignedNumberBody)
    | ({
          type: 'dateFormula';
      } & DateFormulaBody)
    | { type: 'subQuery'; value: SubQueryJson }
    | { type: 'list'; value: ValueJson[] }
    | { type: 'bind'; value: BaseExpressionJson };

export const makeValueJson = (target: ValueTypeClass): ValueJson =>
    makeNodeJson<ValueJson>('soqlValue', target, makeValueBody(target));

const makeValueBody = (target: ValueTypeClass): ValueBody => {
    const fields = target.getFields();
    switch (fields.kind) {
        case 'number':
            return {
                type: fields.kind,
                ...makeSignedNumberBody(fields.value),
            };
        case 'dateFormula':
            return {
                type: fields.kind,
                ...makeDateFormulaBody(fields.value),
            };
        case 'subQuery':
            return {
                type: fields.kind,
                value: makeSubQueryJson(fields.value),
            };
        case 'list':
            return {
                type: fields.kind,
                value: fields.value.getFields().value.map((item) => makeValueJson(item)),
            };
        case 'bind':
            // バインド式 (:var) は中の式を出す
            return {
                type: fields.kind,
                value: makeExpressionJsonConvert(fields.value.getFields().value),
            };
        default:
            return {
                type: fields.kind,
                value: fields.value,
            };
    }
};

export const makeComparisonOperatorJson = (
    target: ComparisonOperatorTypeClass,
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
    return target.getFields().value;
};

export type SingleConditionJson = JsonType<'singleCondition'> & {
    /** 左辺。FORMULA('...') は WHERE だけ (where.ts) */
    field: FieldJson | SoqlFunctionJson | FormulaFieldJson;
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

export const makeSingleConditionJson = (target: FieldExpressionTypeClass): SingleConditionJson => {
    const { left, operator, right } = target.getFields();
    const operatorJson = makeComparisonOperatorJson(operator);
    const value = makeValueJson(right);

    switch (left.kind) {
        case 'fieldName':
            return makeNodeJson<SingleConditionJson>('singleCondition', target, {
                field: makeFieldJson(left),
                operator: operatorJson,
                value: value,
            });
        case 'soqlFunction':
            return makeNodeJson<SingleConditionJson>('singleCondition', target, {
                field: makeSoqlFunctionJson(left),
                operator: operatorJson,
                value: value,
            });
    }
};

/** AND・OR・NOT の論理条件 (WHERE・HAVING・WITH の条件)。kind の logical は式 (&& など) で使っているので soqlLogical */
export type LogicalConditionJson = JsonType<'soqlLogical'> & {
    condition: (SingleConditionJson | LogicalConditionJson)[];
    operator?: 'AND' | 'OR' | 'NOT';
};

/** LogicalConditionJson か (condition の並びと、AND・OR・NOT の operator) */
export const isLogicalConditionJson = (value: unknown): value is LogicalConditionJson =>
    typeof value === 'object' &&
    value !== null &&
    (value as { kind?: unknown }).kind === 'soqlLogical' &&
    Array.isArray((value as { condition?: unknown }).condition) &&
    [undefined, 'AND', 'OR', 'NOT'].includes((value as { operator?: unknown }).operator as string);

export const makeLogicalConditionJson = (
    target: LogicalExpressionTypeClass,
): LogicalConditionJson => {
    const fields = target.getFields();
    // AND・OR は 2 つ以上、NOT と演算子なし (条件が 1 つだけ) は 1 つの被演算子
    const operands = 'operands' in fields ? fields.operands : [fields.operand];
    const condition: (SingleConditionJson | LogicalConditionJson)[] = operands.map((v) => {
        const value = v.getFields().value;
        switch (value.kind) {
            case 'logicalExpression':
                return makeLogicalConditionJson(value);
            case 'fieldExpression':
                return makeSingleConditionJson(value);
        }
    });

    return makeNodeJson<LogicalConditionJson>('soqlLogical', target, {
        condition: condition,
        ...(fields.operator !== null ? { operator: fields.operator } : {}),
    });
};
