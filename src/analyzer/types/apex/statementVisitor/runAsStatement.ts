import { RunAsStatementContext } from '@apexdevtools/apex-parser';

import { BlockType, BlockVisitor } from '../blockVisitor';
import { ListType, ListVisitor } from '../listVisitor';

export type RunAsStatementType = {
    type: 'runAsStatement';
    statement: {
        variant: ListType;
        block: BlockType;
    };
};

export const makeRunAsStatementType = (ctx: RunAsStatementContext): RunAsStatementType => {
    const block = new BlockVisitor().visit(ctx.block());
    const name = new ListVisitor().visit(ctx.expressionList());

    return {
        type: 'runAsStatement',
        statement: {
            variant: name,
            block: block,
        },
    };
};

