import { WhenClauseContext } from '@apexdevtools/apex-parser';

import { NameType, NameVisitor } from '../nameVisitor';
import { ListType, ListVisitor } from '../listVisitor';

export type WhenClauseType = {
    type: 'whenClause';
    clause: {
        whenField: NameType;
        thenFields: ListType;
    };
};

export const makeWhenClauseType = (ctx: WhenClauseContext): WhenClauseType => {
    if (!ctx.fieldName() || !ctx.fieldNameList()) {
        throw new Error('値が異常です。WhenClauseContext: ' + ctx.getText());
    }

    const whenField = new NameVisitor().visit(ctx.fieldName());
    const thenFields = new ListVisitor().visit(ctx.fieldNameList());

    return {
        type: 'whenClause',
        clause: {
            whenField: whenField,
            thenFields: thenFields,
        },
    };
};

