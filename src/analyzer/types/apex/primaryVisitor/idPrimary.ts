import { IdPrimaryContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';

export type IdPrimaryType = {
    type: 'idPrimary';
    primary: IdType;
};

export const makeIdPrimaryType = (ctx: IdPrimaryContext): IdPrimaryType => {
    const primary = new IdVisitor().visit(ctx.id());

    return {
        type: 'idPrimary',
        primary: primary,
    };
};

