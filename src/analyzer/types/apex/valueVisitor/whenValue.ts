import { WhenValueContext } from '@apexdevtools/apex-parser';

import { LiteralType, LiteralVisitor } from '../literalVisitor';
import { IdType, IdVisitor } from '../idVisitor';
import { TypeType, TypeVisitor } from '../typeVisitor';

export type WhenValueType = {
    type: 'whenValue';
    value:
        | {
              literal: LiteralType[];
          }
        | {
              type?: TypeType;
              name: IdType;
          }
        | {
              condition: 'else';
          };
};

export const makeWhenValueType = (ctx: WhenValueContext): WhenValueType => {
    if (ctx.ELSE()) {
        return {
            type: 'whenValue',
            value: {
                condition: 'else',
            },
        };
    }

    if (ctx.whenLiteral_list() && ctx.whenLiteral_list().length > 0) {
        const values = ctx.whenLiteral_list().map((literalCtx) => {
            const value = new LiteralVisitor().visit(literalCtx);
            return value;
        });
        return {
            type: 'whenValue',
            value: {
                literal: values,
            },
        };
    }

    if (ctx.id()) {
        const variant = new IdVisitor().visit(ctx.id());

        const value: {
            type?: TypeType;
            name: IdType;
        } = {
            name: variant,
        };

        if (ctx.typeRef()) {
            const type = new TypeVisitor().visit(ctx.typeRef());
            value.type = type;
        }

        return {
            type: 'whenValue',
            value: value,
        };
    }

    throw new Error('値が異常です。WhenValueContext: ' + ctx.getText());
};
