import {
    WhereLogicalExpressionClass,
    WhereFieldExpressionClass,
    isFieldExpressionClass,
    isWhereFieldExpressionClass,
    isWhereLogicalExpressionClass,
    isString,
} from '../converter';

import { ValueType, makeValueType, LogicalField, makeSingleLogicalField } from './common';

export type WhereField =
    | LogicalField
    | {
          field: string;
          operator: string;
          value: ValueType;
      }
    | WhereField[]
    | {
          logicalOperator: 'AND' | 'OR' | 'NOT';
          conditions: WhereField[];
      };

const makeWhereSingleField = (whereField: WhereFieldExpressionClass): WhereField | undefined => {
    const left = whereField.getLeft();

    if (isFieldExpressionClass(left)) {
        return makeSingleLogicalField(left);
    }

    if (isString(left)) {
        const operator = whereField.getOperator();
        const right = makeValueType(whereField.getRight());

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

export const makeWhereField = (
    whereClause: WhereLogicalExpressionClass,
): WhereField | undefined => {
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
            const logical = makeWhereField(condition);
            if (logical) {
                whereFields.push(logical);
            }
        }
    });

    if (!logicalOperator) {
        return whereFields;
    }

    if (whereFields.length > 0) {
        return {
            logicalOperator:
                logicalOperator.toUpperCase() === 'AND'
                    ? 'AND'
                    : logicalOperator.toUpperCase() === 'OR'
                      ? 'OR'
                      : 'NOT',
            conditions: whereFields,
        };
    }

    return undefined;
};
