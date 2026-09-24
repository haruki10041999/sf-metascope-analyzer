import { OffsetClauseContext } from '@apexdevtools/apex-parser';

export type OffsetField =
    | {
          type: 'lieteral';
          value: string;
      }
    | {
          type: 'bind';
          variant: string;
      };

export const makeOffsetField = (ctx: OffsetClauseContext): OffsetField => {
    if (ctx.boundExpression()) {
        return {
            type: 'bind',
            variant: ctx.boundExpression().getText(),
        };
    }

    return {
        type: 'lieteral',
        value: ctx.IntegerLiteral().getText(),
    };
};
