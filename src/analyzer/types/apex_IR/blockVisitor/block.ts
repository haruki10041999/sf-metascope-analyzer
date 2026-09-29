import { BlockContext } from '@apexdevtools/apex-parser';

import { StatementType, StatementVisitor } from '../statementVisitor';

export type BlockType = {
    type: 'block';
    block: StatementType[];
};

export const makeBlockType = (ctx: BlockContext): BlockType => {
    if (!ctx.statement_list()) {
        throw new Error('値が異常です。BlockContext: ' + ctx.getText());
    }

    return {
        type: 'block',
        block: ctx.statement_list().map((statmentCtx) => {
            const statement = new StatementVisitor().visit(statmentCtx);
            return statement;
        }),
    };
};

