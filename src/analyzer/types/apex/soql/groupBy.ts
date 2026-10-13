import {
    SoqlFunctionClass,
    LogicalExpressionClass,
    FieldExpressionClass,
    NormalValueClass,
    SubQueryClass,
    isString,
    isStringArray,
    isExpressionClass,
    isSignedLiteralClass,
    isNormalValueClassArray,
    isDateFormulaClass,
    isSubQueryClass,
    isSoqlFunctionClass,
    isLogicalExpressionClass,
    isFieldExpressionClass,
    GroupByClauseClass,
} from '../converter';

import { ExpressionType, makeExpressionType } from '../expression';
import { SoqlFunctionField, makeSoqlFunctionField } from './soqlFunction';

type ValueType =
    | {
          kind: string;
          value: string;
          operator?: string;
      }
    | {
          kind: 'bind';
          value: ExpressionType;
      }
    | ValueType[]
    | {
          kind: 'dateFormula';
          funcName: string;
          param?: {
              value: string;
              valueType: string;
              operator?: string;
          };
      }
    | SubQueryClass;

type HavingField =
    | {
          field: string | string[] | SoqlFunctionField;
          operator: string;
          value: ValueType;
      }
    | HavingField[]
    | {
          logicalOperator: 'AND' | 'OR' | 'NOT';
          conditions: HavingField[];
      };

export type GroupByField = {
    field: (
        | {
              kind: 'field';
              field: string[];
          }
        | {
              kind: 'function';
              field: SoqlFunctionField;
          }
    )[];
    mode?: string;
    having?: HavingField;
};

const makeValue = (value: NormalValueClass): ValueType | undefined => {
    const valueValue = value.getValue();

    if (valueValue) {
        if (isString(valueValue)) {
            const valueType = value.getValueType();

            if (valueType) {
                return {
                    kind: valueType,
                    value: valueValue,
                };
            }
        }

        if (isExpressionClass(valueValue)) {
            return {
                kind: 'bind',
                value: makeExpressionType(valueValue),
            };
        }

        if (isSignedLiteralClass(valueValue)) {
            const literal = valueValue.getValue();
            const literalType = valueValue.getValueType();
            const literalOperator = valueValue.getOperator();

            if (literal && literalType) {
                const valueType: ValueType = {
                    kind: literalType,
                    value: literal,
                };

                if (literalOperator) {
                    valueType.operator = literalOperator;
                }

                return valueType;
            }
        }

        if (isNormalValueClassArray(valueValue)) {
            if (valueValue.length > 0) {
                return valueValue.map((v) => makeValue(v)).filter((v) => v !== undefined);
            }
        }

        if (isDateFormulaClass(valueValue)) {
            const funcName = valueValue.getValue();
            const param = valueValue.getParam();

            if (funcName) {
                const valueType: ValueType = {
                    kind: 'dateFormula',
                    funcName: funcName,
                };

                if (param) {
                    const literal = valueValue.getValue();
                    const literalType = param.getValueType();
                    const literalOperator = param.getOperator();

                    if (literal && literalType) {
                        valueType.param = {
                            value: literal,
                            valueType: literalType,
                        };
                        if (literalOperator) {
                            valueType.param.operator = literalOperator;
                        }
                    }
                    return valueType;
                }
            }

            if (isSubQueryClass(valueValue)) {
                return valueValue;
            }
        }
    }

    return undefined;
};

const makeHavingSingleField = (havingField: FieldExpressionClass): HavingField | undefined => {
    const field = havingField.getLeft();
    const operator = havingField.getOperator();
    const value = makeValue(havingField.getRight());

    if (field && operator && value) {
        if (isStringArray(field) && field.length > 0) {
            return {
                field: field,
                operator: operator,
                value: value,
            };
        }

        if (isSoqlFunctionClass(field)) {
            const soqlField = makeSoqlFunctionField(field);
            if (soqlField) {
                return {
                    field: soqlField,
                    operator: operator,
                    value: value,
                };
            }
        }
    }

    return undefined;
};

const makeHavingField = (whereClause: LogicalExpressionClass): HavingField => {
    const whereFields: HavingField[] = [];

    const conditions = whereClause.getValue();
    const logicalOperator = whereClause.getOperator();

    conditions.forEach((condition) => {
        if (isFieldExpressionClass(condition)) {
            const whereField = makeHavingSingleField(condition);
            if (whereField) {
                whereFields.push(whereField);
            }
        }

        if (isLogicalExpressionClass(condition)) {
            whereFields.push(makeHavingField(condition));
        }
    });

    if (!logicalOperator) {
        return whereFields;
    }

    return {
        logicalOperator:
            logicalOperator.toUpperCase() === 'AND'
                ? 'AND'
                : logicalOperator.toUpperCase() === 'OR'
                  ? 'OR'
                  : 'NOT',
        conditions: whereFields,
    };
};

export const makeGroupByField = (groupByClause: GroupByClauseClass): GroupByField => {
    const groupByField: GroupByField = {
        field: [],
    };

    const value = groupByClause.getValue();
    const mode = groupByClause.getMode();
    const having = groupByClause.getHaving();

    value.forEach((v) => {
        if (isStringArray(v) && v.length > 0) {
            groupByField.field.push({
                kind: 'field',
                field: v,
            });
        }

        if (isSoqlFunctionClass(v)) {
            const func = makeSoqlFunctionField(v);
            if (func) {
                groupByField.field.push({
                    kind: 'function',
                    field: func,
                });
            }
        }
    });

    if (mode) {
        groupByField.mode = mode;
    }

    if (having.getValue().length > 0) {
        groupByField.having = makeHavingField(having);
    }

    return groupByField;
};
