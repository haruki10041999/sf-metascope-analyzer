import { EnhancedForControlContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

import { TypeRefType, makeTypeRefType } from '../typeRef';

export type EnhancedForControlType = {
    type: 'enhancedForControl';
    variantType: Omit<TypeRefType, 'type'>;
    variant: Omit<IdType, 'type'>;
    fromVariant: Omit<ExpressionType, 'type'>;
};

export const makeEnhancedForControlType = (
    ctx: EnhancedForControlContext,
): EnhancedForControlType => {
    const { type: variantTypeType, ...variantType } = makeTypeRefType(ctx.typeRef());
    const { type: variantTypeId, ...variant } = new IdVisitor().visit(ctx.id());
    const { type: fromVariantType, ...fromVariant } = new ExpressionVisitor().visit(
        ctx.expression(),
    );

    return {
        type: 'enhancedForControl',
        variantType: variantType,
        variant: variant,
        fromVariant: fromVariant,
    };
};
