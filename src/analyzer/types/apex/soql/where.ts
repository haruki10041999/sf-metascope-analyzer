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
} from '../converter';

import { SoqlFunctionField, makeSoqlFunctionField } from './soqlFunction';

export type Where =
    | {
          field: string[] | SoqlFunctionField;
          operator: string;
          value: string;
      }
    | {
          logicalOperator: 'AND' | 'OR';
          conditions: Where[];
      }
    | {
          logicalOperator: 'NOT';
          condition: Where;
      };

const makeWhereField = (whereField: WhereFieldExpressionClass): Where | undefined => {
    const left = whereField.getLeft();

    if (isFieldExpressionClass(left)) {
        const field = left.getLeft();
        const operator = whereField.getOperator();
        const value = whereField.getRight();

        if (field && operator && value) {
            return {
                field,
                operator,
                value,
            };
        }
    }

    return undefined;
};

export const makeWhere = (whereNames: WhereLogicalExpressionClass): Where | undefined => {
    return undefined;
};
