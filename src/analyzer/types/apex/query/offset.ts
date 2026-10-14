import { ExpressionClass, isString, isExpressionClass } from '../converter';

import { ExpressionType, makeExpressionType } from '../expression';

export type OffsetField =
    | {
          kind: 'number';
          value: string;
      }
    | {
          kind: 'bind';
          value: ExpressionType;
      };

export const makeOffsetField = (
    offsetClause: string | ExpressionClass,
): OffsetField | undefined => {
    if (isString(offsetClause)) {
        return {
            kind: 'number',
            value: offsetClause,
        };
    }

    if (isExpressionClass(offsetClause)) {
        const expression = makeExpressionType(offsetClause);
        if (expression) {
            return {
                kind: 'bind',
                value: expression,
            };
        }
    }

    return undefined;
};
