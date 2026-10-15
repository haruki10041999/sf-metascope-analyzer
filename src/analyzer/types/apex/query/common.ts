import {
    LogicalExpressionClass,
    FieldExpressionClass,
    NormalValueClass,
    isString,
    isExpressionClass,
    isSoqlFunctionClass,
    isLogicalExpressionClass,
    isFieldExpressionClass,
    isSignedLiteralClass,
    isNormalValueClassArray,
    isDateFormulaClass,
    isSubQueryClass,
    isStringArray,
} from '../converter';

import { ExpressionType, makeExpressionType } from '../expression';
import { SoqlFunctionField, makeSoqlFunctionField } from './soqlFunction';
import { SubQueryField, makeSubQueryField } from './subQuery';

export type ValueType =
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
    | ({
          kind: 'subQuery';
      } & SubQueryField);

export type LogicalField =
    | {
          field: string[] | SoqlFunctionField;
          operator: string;
          value: ValueType;
      }
    | LogicalField[]
    | {
          logicalOperator: 'AND' | 'OR' | 'NOT';
          conditions: LogicalField[];
      };

export const makeValueType = (value: NormalValueClass): ValueType | undefined => {
    const valueValue = value.getValue();

    if (valueValue) {
        if (isString(valueValue)) {
            const valueType = value.getValueType();

            if (valueType) {
                return {
                    kind: valueType,
                    value: valueValue.replace(/^(['"])(.*)\1$/, '$2'),
                };
            }
        }

        if (isExpressionClass(valueValue)) {
            const expression = makeExpressionType(valueValue);
            if (expression) {
                return {
                    kind: 'bind',
                    value: expression,
                };
            }
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
                return valueValue.map((v) => makeValueType(v)).filter((v) => v !== undefined);
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
                    const literal = param.getValue();
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
        }

        if (isSubQueryClass(valueValue)) {
            const subQuery = makeSubQueryField(valueValue);
            if (subQuery) {
                return {
                    kind: 'subQuery',
                    ...subQuery,
                };
            }
        }
    }

    return undefined;
};

export const makeSingleLogicalField = (
    fieldExpression: FieldExpressionClass,
): LogicalField | undefined => {
    const field = fieldExpression.getLeft();
    const operator = fieldExpression.getOperator();
    const value = makeValueType(fieldExpression.getRight());

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

export const makeLogicalField = (
    logicalExpression: LogicalExpressionClass,
): LogicalField | undefined => {
    const logicalFields: LogicalField[] = [];

    const conditions = logicalExpression.getValue();
    const logicalOperator = logicalExpression.getOperator();

    conditions.forEach((condition) => {
        if (isFieldExpressionClass(condition)) {
            const logicalField = makeSingleLogicalField(condition);
            if (logicalField) {
                logicalFields.push(logicalField);
            }
        }

        if (isLogicalExpressionClass(condition)) {
            const logical = makeLogicalField(condition);

            if (logical) {
                logicalFields.push(logical);
            }
        }
    });

    if (logicalFields.length > 0) {
        if (!logicalOperator) {
            return logicalFields;
        }
        return {
            logicalOperator:
                logicalOperator.toUpperCase() === 'AND'
                    ? 'AND'
                    : logicalOperator.toUpperCase() === 'OR'
                      ? 'OR'
                      : 'NOT',
            conditions: logicalFields,
        };
    }

    return undefined;
};
