import { SubFieldEntryContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { NameType, NameVisitor } from '../nameVisitor';
import { QueryType, QueryVisitor } from '../queryVisitor';
import { ClauseType, ClauseVisitor } from '../clauseVisitor';

export type SubFieldEntryType = {
    type: 'subFieldEntry';
    entry: NameType | IdType | QueryType | ClauseType;
};

export const makeSubFieldEntryType = (ctx: SubFieldEntryContext): SubFieldEntryType => {
    if (ctx.fieldName()) {
        const field = new NameVisitor().visit(ctx.fieldName());
        return {
            type: 'subFieldEntry',
            entry: field,
        };
    }

    if (ctx.soqlId()) {
        const field = new IdVisitor().visit(ctx.soqlId());
        return {
            type: 'subFieldEntry',
            entry: field,
        };
    }

    if (ctx.soqlFunction()) {
        const field = new QueryVisitor().visit(ctx.soqlFunction());
        return {
            type: 'subFieldEntry',
            entry: field,
        };
    }

    if (ctx.subQuery()) {
        const field = new QueryVisitor().visit(ctx.subQuery());
        return {
            type: 'subFieldEntry',
            entry: field,
        };
    }

    if (ctx.typeOf()) {
        const field = new ClauseVisitor().visit(ctx.typeOf());
        return {
            type: 'subFieldEntry',
            entry: field,
        };
    }

    throw new Error('値が異常です。SubFieldEntryContext: ' + ctx.getText());
};

