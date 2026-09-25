import { BlockContext } from '@apexdevtools/apex-parser';

import { StatementType, StatementVisitor } from '../statementVisitor';

export type BlockType = {
    type: 'block';
    statements: Omit<StatementType, 'type'>[];
};

export const makeBlockType = (ctx: BlockContext): BlockType => {
    return {
        type: 'block',
        statements: ctx.statement_list().map((statmentCtx) => {
            const { type, ...statement } = new StatementVisitor().visit(statmentCtx);
            return statement;
        }),
    };
};

