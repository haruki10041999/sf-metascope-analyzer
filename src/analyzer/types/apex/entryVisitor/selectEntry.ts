import { SelectEntryContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { NameType, NameVisitor } from '../nameVisitor';
import { QueryType, QueryVisitor } from '../queryVisitor';

import { SoqlFunctionType, makeSoqlFunctionType } from '../soqlFunction';
import { TypeOfType, makeTypeOfType } from '../typeOf';

export type SelectEntryType = {
    type: 'selectEntry';
    field:
        | Omit<NameType, 'type'>
        | Omit<IdType, 'type'>
        | Omit<SoqlFunctionType, 'type'>
        | Omit<QueryType, 'type'>
        | Omit<TypeOfType, 'type'>;
};

export const makeSelectEntryType = (ctx: SelectEntryContext): SelectEntryType => {
    if (ctx.fieldName()) {
        const { type, ...field } = new NameVisitor().visit(ctx.fieldName());
        return {
            type: 'selectEntry',
            field: field,
        };
    }

    if (ctx.soqlId()) {
        const { type, ...field } = new IdVisitor().visit(ctx.soqlId());
        return {
            type: 'selectEntry',
            field: field,
        };
    }

    if (ctx.soqlFunction()) {
        const { type, ...field } = makeSoqlFunctionType(ctx.soqlFunction());
        return {
            type: 'selectEntry',
            field: field,
        };
    }

    if (ctx.subQuery()) {
        const { type, ...field } = new QueryVisitor().visit(ctx.subQuery());
        return {
            type: 'selectEntry',
            field: field,
        };
    }

    if (ctx.typeOf()) {
        const { type, ...field } = makeTypeOfType(ctx.typeOf());
        return {
            type: 'selectEntry',
            field: field,
        };
    }

    throw new Error('値が異常です。SelectEntryContext: ' + ctx.getText());
};
