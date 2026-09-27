import { WhenClauseContext } from '@apexdevtools/apex-parser';

import { NameType, NameVisitor } from '../nameVisitor';
import { ListType, ListVisitor } from '../listVisitor';

export type WhenClauseType = {
    type: 'whenClause';
    whenField: Omit<NameType, 'type'>;
    thenFields: Omit<ListType, 'type'>;
};

export const makeWhenClauseType = (ctx: WhenClauseContext): WhenClauseType => {
    const { type: _, ...whenField } = new NameVisitor().visit(ctx.fieldName());
    const { type: __, ...thenFields } = new ListVisitor().visit(ctx.fieldNameList());

    return {
        type: 'whenClause',
        whenField: whenField,
        thenFields: thenFields,
    };
};
