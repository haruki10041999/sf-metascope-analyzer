import { SetterContext } from '@apexdevtools/apex-parser';

import { BlockType, BlockVisitor } from '.';

export type SetterType = {
    type: 'setter';
    body?: BlockType;
};

export const makeSetterType = (ctx: SetterContext): SetterType => {
    if (!ctx.SET()) {
        throw new Error('値が異常です。SetterContext: ' + ctx.getText());
    }

    const setterType: SetterType = { type: 'setter' };
    if (ctx.block()) {
        const body = new BlockVisitor().visit(ctx.block());
        setterType.body = body;
    }
    return setterType;
};
