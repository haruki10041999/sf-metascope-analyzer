import { SelectEntryContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { NameType, NameVisitor } from '../nameVisitor';
import { QueryType, QueryVisitor } from '../queryVisitor';

import { SoqlFunctionType, makeSoqlFunctionType } from '../soqlFunction';
import { TypeOfType, makeTypeOfType } from '../typeOf';

export type SelectEntryType = {
    type: 'selectEntry';
    entry: NameType | IdType | SoqlFunctionType | QueryType | TypeOfType;
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
        const field = makeSoqlFunctionType(ctx.soqlFunction());
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
        const field = makeTypeOfType(ctx.typeOf());
        return {
            type: 'selectEntry',
            entry: field,
        };
    }

    throw new Error('値が異常です。SelectEntryContext: ' + ctx.getText());
};
