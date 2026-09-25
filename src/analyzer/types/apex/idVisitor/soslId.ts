import { SoslIdContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';

export type SoslIdType = {
    type: 'soslId';
    value: string[];
};

export const makeSoslIdType = (ctx: SoslIdContext): SoslIdType => {
    const { type, value } = new IdVisitor().visit(ctx.id());
    const values: string[] = [];
    if (type === 'id') {
        values.push(value);
    }

    if (ctx.soslId_list() && ctx.soslId_list().length > 0) {
        ctx.soslId_list().forEach((soslIdCtx) => {
            const { type, value } = new IdVisitor().visit(soslIdCtx.id());

            if (type === 'soslId') {
                values.push(...value);
            }
        });
    }

    return {
        type: 'soslId',
        value: values,
    };
};
