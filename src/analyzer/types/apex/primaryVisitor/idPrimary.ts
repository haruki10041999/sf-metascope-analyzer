import { IdPrimaryContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';

export type IdPrimaryType = {
    type: 'idPrimary';
    value: Omit<IdType, 'type'>;
};

export const makeIdPrimaryType = (ctx: IdPrimaryContext): IdPrimaryType => {
    const { type, ...value } = new IdVisitor().visit(ctx.id());

    return {
        type: 'idPrimary',
        value: value,
    };
};

