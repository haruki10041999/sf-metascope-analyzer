import { ExpressionClass, isString, isExpressionClass } from '../converter';

import { ExpressionType, makeExpressionType } from '../expression';

export type offsetField =
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
): offsetField | undefined => {
    if (isString(offsetClause)) {
        return {
            kind: 'number',
            value: offsetClause,
        };
    }

    if (isExpressionClass(offsetClause)) {
        return {
            kind: 'bind',
            value: makeExpressionType(offsetClause),
        };
    }

    return undefined;
};
