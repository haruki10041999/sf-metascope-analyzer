import { FieldGroupByContext } from '@apexdevtools/apex-parser';

import { QueryType, QueryVisitor } from '../queryVisitor';
import { NameType, NameVisitor } from '../nameVisitor';

export type FieldGroupByType = {
    type: 'fieldGroupBy';
    clause: NameType | QueryType;
};

export const makeFieldGroupByType = (ctx: FieldGroupByContext): FieldGroupByType => {
    if (ctx.fieldName()) {
        const value = new NameVisitor().visit(ctx.fieldName());
        return {
            type: 'fieldGroupBy',
            clause: value,
        };
    }

    if (ctx.soqlFunction()) {
        const value = new QueryVisitor().visit(ctx.soqlFunction());
        return {
            type: 'fieldGroupBy',
            clause: value,
        };
    }

    throw new Error('値が異常です。FieldGroupByContext:' + ctx.getText());
};

