import { IdPrimaryContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';

export type IdPrimaryType = {
    type: 'idPrimary';
    primary: IdType;
};

export const makeIdPrimaryType = (ctx: IdPrimaryContext): IdPrimaryType => {
    if (!ctx.id()) {
        throw new Error('値が異常です。IdPrimaryContext: ' + ctx.getText());
    }

    const primary = new IdVisitor().visit(ctx.id());

    return {
        type: 'idPrimary',
        primary: primary,
    };
};

