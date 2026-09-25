import { RunAsStatementContext } from '@apexdevtools/apex-parser';

import { BlockType, BlockVisitor } from '../blockVisitor';
import { ListType, ListVisitor } from '../listVisitor';

export type RunAsStatementType = {
    type: 'runAsStatement';
    variant: Omit<ListType, 'type'>;
    block: Omit<BlockType, 'type'>;
};

export const makeRunAsStatementType = (ctx: RunAsStatementContext): RunAsStatementType => {
    const block = new BlockVisitor().visit(ctx.block());
    const variant = new ListVisitor().visit(ctx.expressionList());

    return {
        type: 'runAsStatement',
        variant: variant,
        block: block,
    };
};

