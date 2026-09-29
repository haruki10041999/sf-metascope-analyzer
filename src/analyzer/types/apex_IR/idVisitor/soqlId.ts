import { SoqlIdContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '.';

export type SoqlIdType = {
    type: 'soqlId';
    id: IdType;
};

export const makeSoqlIdType = (ctx: SoqlIdContext): SoqlIdType => {
    if (!ctx.id()) {
        throw new Error('値が異常です。SoqlIdContext: ' + ctx.getText());
    }

    const value = new IdVisitor().visit(ctx.id());
    return {
        type: 'soqlId',
        id: value,
    };
};
