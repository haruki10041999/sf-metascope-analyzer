import { WhenLiteralContext } from '@apexdevtools/apex-parser';

import { LiteralType, LiteralVisitor } from '.';

import { NameType, NameVisitor } from '../nameVisitor';

type WhenLiteralField =
    | {
          type: 'integer' | 'long';
          value: string;
          operator?: string;
      }
    | {
          type: 'string' | 'multilineString';
          value: string;
      }
    | {
          type: 'null';
          value: null;
      }
    | {
          type: 'object';
          value: NameType;
      }
    | {
          value: LiteralType;
      };

export type WhenLiteralType = {
    type: 'whenLiteral';
    literal: WhenLiteralField;
};

export const makeWhenLiteralType = (ctx: WhenLiteralContext): WhenLiteralType => {
    if (ctx.IntegerLiteral() || ctx.LongLiteral()) {
        const whelLiteralField: WhenLiteralField = {
            type: ctx.IntegerLiteral() ? 'integer' : 'long',
            value: ctx.IntegerLiteral()
                ? ctx.IntegerLiteral().getText()
                : ctx.LongLiteral().getText(),
        };
        let operator = '';
        if (ctx.ADD_list() && ctx.ADD_list().length > 0) {
            operator = ctx
                .ADD_list()
                .map((node) => node.getText())
                .join('');
        }

        if (ctx.SUB_list() && ctx.SUB_list().length > 0) {
            operator = ctx
                .SUB_list()
                .map((node) => node.getText())
                .join('');
        }

        if (operator !== undefined && operator !== '') {
            whelLiteralField.operator = operator;
        }
        return {
            type: 'whenLiteral',
            literal: whelLiteralField,
        };
    }

    if (ctx.StringLiteral() || ctx.MultilineStringLiteral()) {
        return {
            type: 'whenLiteral',
            literal: {
                type: ctx.StringLiteral() ? 'string' : 'multilineString',
                value: ctx.StringLiteral()
                    ? ctx.StringLiteral().getText()
                    : ctx.MultilineStringLiteral().getText(),
            },
        };
    }

    if (ctx.NULL()) {
        return {
            type: 'whenLiteral',
            literal: {
                type: 'null',
                value: null,
            },
        };
    }

    if (ctx.qualifiedName()) {
        const value = new NameVisitor().visit(ctx.qualifiedName());
        return {
            type: 'whenLiteral',
            literal: {
                type: 'object',
                value: value,
            },
        };
    }

    if (ctx.whenLiteral()) {
        const value = new LiteralVisitor().visit(ctx.whenLiteral());
        return {
            type: 'whenLiteral',
            literal: { value: value },
        };
    }

    throw new Error('値が異常です。WhenLiteralContext: ' + ctx.getText());
};
