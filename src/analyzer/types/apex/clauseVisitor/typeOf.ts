import { TypeOfContext } from '@apexdevtools/apex-parser';

import { ClauseType, ClauseVisitor } from '.';

import { NameType, NameVisitor } from '../nameVisitor';

export type TypeOfType = {
    type: 'typeOf';
    clause: {
        name: NameType;
        whenClause: ClauseType[];
        elseClause?: ClauseType;
    };
};

export const makeTypeOfType = (ctx: TypeOfContext): TypeOfType => {
    const name = new NameVisitor().visit(ctx.fieldName());
    const whenClause = ctx.whenClause_list().map((whenClauseCtx) => {
        const whenClause = new ClauseVisitor().visit(whenClauseCtx);
        return whenClause;
    });

    const typeOfType: TypeOfType = {
        type: 'typeOf',
        clause: {
            name: name,
            whenClause: whenClause,
        },
    };

    if (ctx.elseClause()) {
        const elseClause = new ClauseVisitor().visit(ctx.elseClause());
        typeOfType.clause.elseClause = elseClause;
    }

    return typeOfType;
};

