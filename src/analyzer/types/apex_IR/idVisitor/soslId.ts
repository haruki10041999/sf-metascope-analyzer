import { SoslIdContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '.';

export type SoslIdType = {
    type: 'soslId';
    id: IdType[];
};

export const makeSoslIdType = (ctx: SoslIdContext): SoslIdType => {
    if (!ctx.id()) {
        throw new Error('値が異常です。SoslIdContext: ' + ctx.getText());
    }

    const id = new IdVisitor().visit(ctx.id());
    const values: IdType[] = [];
    values.push(id);

    if (ctx.soslId_list() && ctx.soslId_list().length > 0) {
        ctx.soslId_list().forEach((soslIdCtx) => {
            const id = makeSoslIdType(soslIdCtx);
            if (id.type === 'soslId') {
                values.push(...id.id);
            }
        });
    }

    return {
        type: 'soslId',
        id: values,
    };
};
