import { LiteralContext } from '@apexdevtools/apex-parser';

type LiteralField =
    | {
          type: 'integer' | 'long' | 'number' | 'string' | 'multilineString' | 'boolean';
          value: string;
      }
    | {
          type: 'null';
          value: null;
      };

export type LiteralType = {
    type: 'literal';
    literal: LiteralField;
};

export const makeLiteralType = (ctx: LiteralContext): LiteralType => {
    if (ctx.IntegerLiteral()) {
        return {
            type: 'literal',
            literal: {
                type: 'integer',
                value: ctx.IntegerLiteral().getText(),
            },
        };
    }

    if (ctx.LongLiteral()) {
        return {
            type: 'literal',
            literal: {
                type: 'long',
                value: ctx.LongLiteral().getText(),
            },
        };
    }

    if (ctx.NumberLiteral()) {
        return {
            type: 'literal',
            literal: {
                type: 'number',
                value: ctx.NumberLiteral().getText(),
            },
        };
    }

    if (ctx.StringLiteral()) {
        return {
            type: 'literal',
            literal: {
                type: 'string',
                value: ctx.StringLiteral().getText(),
            },
        };
    }

    if (ctx.MultilineStringLiteral()) {
        return {
            type: 'literal',
            literal: {
                type: 'multilineString',
                value: ctx.MultilineStringLiteral().getText(),
            },
        };
    }

    if (ctx.BooleanLiteral()) {
        return {
            type: 'literal',
            literal: {
                type: 'boolean',
                value: ctx.BooleanLiteral().getText(),
            },
        };
    }

    if (ctx.NULL()) {
        return {
            type: 'literal',
            literal: {
                type: 'null',
                value: null,
            },
        };
    }

    throw new Error('値が異常です。LiteralContext: ' + ctx.getText());
};
