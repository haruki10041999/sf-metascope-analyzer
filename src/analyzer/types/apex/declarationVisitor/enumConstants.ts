import { EnumConstantsContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';

export type EnumConstantsType = {
    type: 'enumConstants';
    declaration: IdType[];
};

export function makeEnumConstantsType(ctx: EnumConstantsContext): EnumConstantsType {
    return {
        type: 'enumConstants',
        declaration: ctx.id_list().map((idCtx) => {
            const constant = new IdVisitor().visit(idCtx);
            return constant;
        }),
    };
}
