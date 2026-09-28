import { FieldNameContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';

export type FieldNameType = {
    type: 'fieldName';
    name: IdType[];
};

export const makeFieldNameType = (ctx: FieldNameContext): FieldNameType => {
    return {
        type: 'fieldName',
        name: ctx.soqlId_list().map((idCtx) => {
            const name = new IdVisitor().visit(idCtx);
            return name;
        }),
    };
};
