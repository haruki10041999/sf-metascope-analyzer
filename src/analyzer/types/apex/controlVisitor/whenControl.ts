import { WhenControlContext } from '@apexdevtools/apex-parser';

import { ValueType, ValueVisitor } from '../valueVisitor';
import { BlockType, BlockVisitor } from '../blockVisitor';

export type WhenControlType = {
    type: 'whenControl';
    control: {
        condition: ValueType;
        block: BlockType;
    };
};

export const makeWhenControlType = (ctx: WhenControlContext): WhenControlType => {
    const condition = new ValueVisitor().visit(ctx.whenValue());
    const block = new BlockVisitor().visit(ctx.block());
    return {
        type: 'whenControl',
        control: {
            condition: condition,
            block: block,
        },
    };
};
