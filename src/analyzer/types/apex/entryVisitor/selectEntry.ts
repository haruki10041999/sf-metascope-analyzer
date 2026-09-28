import { SelectEntryContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { NameType, NameVisitor } from '../nameVisitor';
import { ClauseType, ClauseVisitor } from '../clauseVisitor';
import { QueryType, QueryVisitor } from '../queryVisitor';

export type SelectEntryType = {
    type: 'selectEntry';
    entry: NameType | IdType | QueryType | ClauseType;
};

export const makeSelectEntryType = (ctx: SelectEntryContext): SelectEntryType => {
    if (ctx.fieldName()) {
        const field = new NameVisitor().visit(ctx.fieldName());
        return {
            type: 'selectEntry',
            entry: field,
        };
    }

    if (ctx.soqlId()) {
        const field = new IdVisitor().visit(ctx.soqlId());
        return {
            type: 'selectEntry',
            entry: field,
        };
    }

    if (ctx.soqlFunction()) {
        const field = new QueryVisitor().visit(ctx.soqlFunction());
        return {
            type: 'selectEntry',
            entry: field,
        };
    }

    if (ctx.subQuery()) {
        const field = new QueryVisitor().visit(ctx.subQuery());
        return {
            type: 'selectEntry',
            entry: field,
        };
    }

    if (ctx.typeOf()) {
        const field = new ClauseVisitor().visit(ctx.typeOf());
        return {
            type: 'selectEntry',
            entry: field,
        };
    }

    throw new Error('値が異常です。SelectEntryContext: ' + ctx.getText());
};
