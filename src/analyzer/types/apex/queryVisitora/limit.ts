import { LimitClauseContext } from '@apexdevtools/apex-parser';

export type LimitField =
    | {
          type: 'literal';
          value: string;
      }
    | {
          type: 'bind';
          variant: string;
      };

export const makeLimitField = (ctx: LimitClauseContext): LimitField => {
    if (ctx.boundExpression()) {
        return {
            type: 'bind',
            variant: ctx.boundExpression().getText(),
        };
    }
    return {
        type: 'literal',
        value: ctx.IntegerLiteral().getText(),
    };
};
