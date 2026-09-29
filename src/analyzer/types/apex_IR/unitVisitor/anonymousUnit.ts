import { AnonymousUnitContext } from '@apexdevtools/apex-parser';

import { BlockType, BlockVisitor } from '../blockVisitor';

export type AnonymousUnitType = {
    type: 'anonymousUnit';
    unit: BlockType;
};

export const makeAnonymousUnitType = (ctx: AnonymousUnitContext): AnonymousUnitType => {
    if (!ctx.anonymousBlock()) {
        throw new Error('値が異常です。AnonymousUnitContext: ' + ctx.getText());
    }

    const unit = new BlockVisitor().visit(ctx.anonymousBlock());

    return {
        type: 'anonymousUnit',
        unit: unit,
    };
};

