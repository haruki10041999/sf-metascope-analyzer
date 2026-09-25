import { WhenControlContext } from '@apexdevtools/apex-parser';

import { ValueType, ValueVisitor } from '../valueVisitor';
import { BlockType, BlockVisitor } from '../blockVisitor';

export type WhenControlType = {
    type: 'whenControl';
    condition: Omit<ValueType, 'type'>;
    block: Omit<BlockType, 'type'>;
};

export const makeWhenControlType = (ctx: WhenControlContext): WhenControlType => {
    const { type: conditionType, ...condition } = new ValueVisitor().visit(ctx.whenValue());
    const { type: blockType, ...block } = new BlockVisitor().visit(ctx.block());
    return {
        type: 'whenControl',
        condition: condition,
        block: block,
    };
};
