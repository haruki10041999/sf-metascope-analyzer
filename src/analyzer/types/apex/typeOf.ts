import { ElseClauseContext, TypeOfContext } from '@apexdevtools/apex-parser';

import { NameType, NameVisitor } from './nameVisitor';
import { ClauseType, ClauseVisitor } from './clauseVisitor';

export type TypeOfType = {
    type: 'typeOf';
    whenField: Omit<NameType, 'type'>;
    whenClauses: Omit<ClauseType, 'type'>;
    elseClause?: Omit<ClauseType, 'type'>;
};

export const makeTypeOfType = (ctx: TypeOfContext): TypeOfType => {
    const { type: _, ...whenField } = new NameVisitor().visit(ctx.fieldName());
    const whenClauses = ctx.whenClause_list().map((whenClauseCtx) => {
        const { type, ...whenClause } = new ClauseVisitor().visit(whenClauseCtx);
        return whenClause;
    });

    const typeOfType: TypeOfType = {
        type: 'typeOf',
        whenField: whenField,
        whenClauses: whenClauses,
    };

    if (ctx.elseClause()) {
        const { type, ...elseClause } = new ClauseVisitor().visit(ctx.elseClause());
        typeOfType.elseClause = elseClause;
    }

    return typeOfType;
};
