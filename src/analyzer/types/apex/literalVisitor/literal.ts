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
    value: LiteralField;
};

export const makeLiteralType = (ctx: LiteralContext): LiteralType => {
    if (ctx.IntegerLiteral()) {
        return {
            type: 'literal',
            value: {
                type: 'integer',
                value: ctx.getText(),
            },
        };
    }

    if (ctx.LongLiteral()) {
        return {
            type: 'literal',
            value: {
                type: 'long',
                value: ctx.getText(),
            },
        };
    }

    if (ctx.NumberLiteral()) {
        return {
            type: 'literal',
            value: {
                type: 'number',
                value: ctx.getText(),
            },
        };
    }

    if (ctx.StringLiteral()) {
        return {
            type: 'literal',
            value: {
                type: 'string',
                value: ctx.getText(),
            },
        };
    }

    if (ctx.MultilineStringLiteral()) {
        return {
            type: 'literal',
            value: {
                type: 'multilineString',
                value: ctx.getText(),
            },
        };
    }

    if (ctx.BooleanLiteral()) {
        return {
            type: 'literal',
            value: {
                type: 'boolean',
                value: ctx.getText(),
            },
        };
    }

    if (ctx.NULL()) {
        return {
            type: 'literal',
            value: {
                type: 'null',
                value: null,
            },
        };
    }

    throw new Error('値が異常です: ' + ctx.getText());
};
