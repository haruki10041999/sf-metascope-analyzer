import { SoqlIdContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '.';

export type SoqlIdType = {
    type: 'soqlId';
    id: IdType;
};

export const makeSoqlIdType = (ctx: SoqlIdContext): SoqlIdType => {
    const value = new IdVisitor().visit(ctx.id());
    return {
        type: 'soqlId',
        id: value,
    };
};
