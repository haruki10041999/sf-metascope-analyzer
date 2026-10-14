import { ExpressionClass, isString, isExpressionClass } from '../converter';

import { ExpressionType, makeExpressionType } from '../expression';

export type LimitField =
    | {
          kind: 'number';
          value: string;
      }
    | {
          kind: 'bind';
          value: ExpressionType;
      };

export const makeLimitField = (limitClause: string | ExpressionClass): LimitField | undefined => {
    if (isString(limitClause)) {
        return {
            kind: 'number',
            value: limitClause,
        };
    }

    if (isExpressionClass(limitClause)) {
        const expression = makeExpressionType(limitClause);
        if (expression) {
            return {
                kind: 'bind',
                value: expression,
            };
        }
    }

    return undefined;
};
