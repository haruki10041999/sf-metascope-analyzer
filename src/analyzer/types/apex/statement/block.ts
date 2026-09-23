import { BlockContext } from '@apexdevtools/apex-parser';

import { StatementField, makeStatementField } from '.';

export type BlockStatemtType = {
    type: 'block';
    statements: StatementField[];
};

export const makeBlockStatemtType = (ctx: BlockContext): BlockStatemtType => {
    return {
        type: 'block',
        statements: ctx.statement_list().map((statmentCtx) => {
            return makeStatementField(statmentCtx);
        }),
    };
};
