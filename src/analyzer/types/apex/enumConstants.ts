import { EnumConstantsContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from './idVisitor';

export type EnumConstantsType = {
    type: 'enumConstants';
    constants: Omit<IdType, 'type'>[];
};

export function makeEnumConstantsType(ctx: EnumConstantsContext): EnumConstantsType {
    return {
        type: 'enumConstants',
        constants: ctx.id_list().map((idCtx) => {
            const { type, ...constant } = new IdVisitor().visit(idCtx);
            return constant;
        }),
    };
}
