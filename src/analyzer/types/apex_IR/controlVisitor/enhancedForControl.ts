import { EnhancedForControlContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';
import { TypeType, TypeVisitor } from '../typeVisitor';

export type EnhancedForControlType = {
    type: 'enhancedForControl';
    control: {
        variantType: TypeType;
        variant: IdType;
        fromVariant: ExpressionType;
    };
};

export const makeEnhancedForControlType = (
    ctx: EnhancedForControlContext,
): EnhancedForControlType => {
    if (!ctx.typeRef() || !ctx.id() || !ctx.expression()) {
        throw new Error('値が異常です。EnhancedForControlContext: ' + ctx.getText());
    }

    const variantType = new TypeVisitor().visit(ctx.typeRef());
    const variant = new IdVisitor().visit(ctx.id());
    const fromVariant = new ExpressionVisitor().visit(ctx.expression());

    return {
        type: 'enhancedForControl',
        control: {
            variantType: variantType,
            variant: variant,
            fromVariant: fromVariant,
        },
    };
};
