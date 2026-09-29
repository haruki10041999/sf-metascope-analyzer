import { EnumConstantsContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';

export type EnumConstantsType = {
    type: 'enumConstants';
    declaration: IdType[];
};

export function makeEnumConstantsType(ctx: EnumConstantsContext): EnumConstantsType {
    if (!ctx.id_list() || ctx.id_list().length === 0) {
        throw new Error('値が異常です。EnumConstantsContext: ' + ctx.getText());
    }

    return {
        type: 'enumConstants',
        declaration: ctx.id_list().map((idCtx) => {
            const constant = new IdVisitor().visit(idCtx);
            return constant;
        }),
    };
}
