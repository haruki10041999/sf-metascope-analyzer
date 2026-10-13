import {
    WhereLogicalExpressionClass,
    WhereFieldExpressionClass,
    FieldExpressionClass,
    SoqlFunctionClass,
    NormalValueClass,
    SignedLiteralClass,
    DateFieldNameClass,
    SubQueryClass,
    ExpressionClass,
    isFieldExpressionClass,
    isWhereFieldExpressionClass,
    isWhereLogicalExpressionClass,
    isSignedLiteralClass,
    isString,
    isNormalValueClassArray,
    isDateFormulaClass,
    isSubQueryClass,
    isExpressionClass,
    isStringArray,
    isSoqlFunctionClass,
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

export type WhereField =
    | {
          field: string | string[] | SoqlFunctionField;
          operator: string;
          value: ValueType;
      }
    | WhereField[]
    | {
          logicalOperator: 'AND' | 'OR' | 'NOT';
          conditions: WhereField[];
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

const makeWhereSingleField = (whereField: WhereFieldExpressionClass): WhereField | undefined => {
    const left = whereField.getLeft();

    if (isFieldExpressionClass(left)) {
        const field = left.getLeft();
        const operator = whereField.getOperator();
        const value = makeValue(whereField.getRight());

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
    }

    if (isString(left)) {
        const operator = whereField.getOperator();
        const right = makeValue(whereField.getRight());

        if (operator && right) {
            return {
                field: left,
                operator: operator,
                value: right,
            };
        }
    }

    return undefined;
};

export const makeWhereField = (whereClause: WhereLogicalExpressionClass): WhereField => {
    const whereFields: WhereField[] = [];

    const conditions = whereClause.getValue();
    const logicalOperator = whereClause.getOperator();

    conditions.forEach((condition) => {
        if (isWhereFieldExpressionClass(condition)) {
            const whereField = makeWhereSingleField(condition);
            if (whereField) {
                whereFields.push(whereField);
            }
        }

        if (isWhereLogicalExpressionClass(condition)) {
            whereFields.push(makeWhereField(condition));
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
