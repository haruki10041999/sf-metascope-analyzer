import { ElseClauseContext } from '@apexdevtools/apex-parser';

import { NameType, NameVisitor } from '../nameVisitor';

export type ElseClauseType = {
    type: 'elseClause';
    clause: NameType;
};

export const makeElseClauseType = (ctx: ElseClauseContext): ElseClauseType => {
    const clause = new NameVisitor().visit(ctx.fieldNameList());

    return {
        type: 'elseClause',
        clause: clause,
    };
};

