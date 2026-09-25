import { FieldNameContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';

export type FieldNameType = {
    type: 'fieldName';
    name: Omit<IdType, 'type'>[];
};

export const makeFieldNameType = (ctx: FieldNameContext): FieldNameType => {
    return {
        type: 'fieldName',
        name: ctx.soqlId_list().map((idCtx) => {
            const { type, ...name } = new IdVisitor().visit(idCtx);
            return name;
        }),
    };
};
