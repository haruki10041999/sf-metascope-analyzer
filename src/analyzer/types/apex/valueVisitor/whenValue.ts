import { WhenValueContext } from '@apexdevtools/apex-parser';

import { LiteralType, LiteralVisitor } from '../literalVisitor';

import { IdType, IdVisitor } from '../idVisitor';

import { TypeRefType, makeTypeRefType } from '../typeRef';

export type WhenValueType = {
    type: 'whenValue';
} & (
    | {
          values: Omit<LiteralType, 'type'>[];
      }
    | {
          variantType?: Omit<TypeRefType, 'type'>;
          variant: Omit<IdType, 'type'>;
      }
    | {
          condition: 'else';
      }
);

export const makeWhenValueType = (ctx: WhenValueContext): WhenValueType => {
    if (ctx.ELSE()) {
        return {
            type: 'whenValue',
            condition: 'else',
        };
    }

    if (ctx.whenLiteral_list() && ctx.whenLiteral_list().length > 0) {
        const values = ctx.whenLiteral_list().map((literalCtx) => {
            const { type, ...value } = new LiteralVisitor().visit(literalCtx);
            return value;
        });
        return {
            type: 'whenValue',
            values: values,
        };
    }

    if (ctx.id()) {
        const { type, ...variant } = new IdVisitor().visit(ctx.id());

        const whenValueType: WhenValueType = {
            type: 'whenValue',
            variant: variant,
        };
        if (ctx.typeRef()) {
            const { type, ...variantType } = makeTypeRefType(ctx.typeRef());
            whenValueType.variantType = variantType;
        }

        return whenValueType;
    }

    throw new Error('値が異常です。WhenValueContext: ' + ctx.getText());
};
