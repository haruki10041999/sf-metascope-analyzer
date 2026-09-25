import { ElseClauseContext } from '@apexdevtools/apex-parser';

import { NameType, NameVisitor } from '../nameVisitor';

export type ElseClauseType = {
    type: 'elseClause';
    fieldNames: Omit<NameType, 'type'>;
};

export const makeElseClauseType = (ctx: ElseClauseContext): ElseClauseType => {
    const { type, ...fieldNames } = new NameVisitor().visit(ctx.fieldNameList());

    return {
        type: 'elseClause',
        fieldNames: fieldNames,
    };
};
