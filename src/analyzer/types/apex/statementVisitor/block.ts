import { BlockContext } from '@apexdevtools/apex-parser';

import { StatementType, StatementVisitor } from '.';

export type BlockStatemtType = {
    type: 'block';
    statements: StatementType[];
};

export const makeBlockStatemtType = (ctx: BlockContext): BlockStatemtType => {
    return {
        type: 'block',
        statements: ctx.statement_list().map((statmentCtx) => {
            return new StatementVisitor().visit(statmentCtx);
        }),
    };
};
