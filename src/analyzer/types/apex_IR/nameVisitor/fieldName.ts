import { FieldNameContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';

export type FieldNameType = {
    type: 'fieldName';
    name: IdType[];
};

export const makeFieldNameType = (ctx: FieldNameContext): FieldNameType => {
    if (!ctx.soqlId_list() || ctx.soqlId_list().length === 0) {
        throw new Error('値が異常です。FieldNameContext: ' + ctx.getText());
    }

    return {
        type: 'fieldName',
        name: ctx.soqlId_list().map((idCtx) => {
            const name = new IdVisitor().visit(idCtx);
            return name;
        }),
    };
};
