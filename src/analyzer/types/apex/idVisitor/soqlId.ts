import { SoqlIdContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '.';

export type SoqlIdType = {
    type: 'soqlId';
    value: string;
};

export const makeSoqlIdType = (ctx: SoqlIdContext): SoqlIdType => {
    const { type, value } = new IdVisitor().visit(ctx.id());

    if (type === 'id') {
        return {
            type: 'soqlId',
            value: value,
        };
    }

    throw new Error('値が異常です。SoqlIdContext: ' + ctx.getText());
};
