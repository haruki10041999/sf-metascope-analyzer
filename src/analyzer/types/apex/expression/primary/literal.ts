import { LiteralContext, LiteralPrimaryContext } from '@apexdevtools/apex-parser';

export type LiteralField =
    | {
          type: 'integer';
          value: string;
      }
    | {
          type: 'long';
          value: string;
      }
    | {
          type: 'number';
          value: string;
      }
    | {
          type: 'string';
          value: string;
      }
    | {
          type: 'multilineString';
          value: string;
      }
    | {
          type: 'boolean';
          value: string;
      }
    | {
          type: 'null';
          value: null;
      };

export type LiteralPrimaryType = {
    type: 'literal';
    literal: LiteralField;
};

export const makeLiteralPrimaryType = (ctx: LiteralPrimaryContext): LiteralPrimaryType => {
    if (ctx.literal().IntegerLiteral()) {
        return {
            type: 'literal',
            literal: {
                type: 'integer',
                value: ctx.literal().getText(),
            },
        };
    }

    if (ctx.literal().LongLiteral()) {
        return {
            type: 'literal',
            literal: {
                type: 'long',
                value: ctx.literal().getText(),
            },
        };
    }

    if (ctx.literal().NumberLiteral()) {
        return {
            type: 'literal',
            literal: {
                type: 'number',
                value: ctx.literal().getText(),
            },
        };
    }

    if (ctx.literal().StringLiteral()) {
        return {
            type: 'literal',
            literal: {
                type: 'string',
                value: ctx.literal().getText(),
            },
        };
    }

    if (ctx.literal().MultilineStringLiteral()) {
        return {
            type: 'literal',
            literal: {
                type: 'multilineString',
                value: ctx.literal().getText(),
            },
        };
    }

    if (ctx.literal().BooleanLiteral()) {
        return {
            type: 'literal',
            literal: {
                type: 'boolean',
                value: ctx.literal().getText(),
            },
        };
    }

    if (ctx.literal().NULL()) {
        return {
            type: 'literal',
            literal: {
                type: 'null',
                value: null,
            },
        };
    }

    throw new Error(`Unknown literal: ${ctx.getText()}`);
};
