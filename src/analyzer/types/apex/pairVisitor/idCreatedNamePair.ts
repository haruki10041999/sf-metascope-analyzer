import { IdCreatedNamePairContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { ListType, ListVisitor } from '../listVisitor';

export type IdCreatedNamePairType = {
    type: 'idCreatedNamePair';
    name: Omit<IdType, 'type'>;
    generics?: Omit<ListType, 'type'>;
};

export const makeIdCreatedNamePairType = (ctx: IdCreatedNamePairContext): IdCreatedNamePairType => {
    const { type, ...name } = new IdVisitor().visit(ctx.anyId());

    const idCreatedNamePairType: IdCreatedNamePairType = {
        type: 'idCreatedNamePair',
        name: name,
    };

    if (ctx.typeList()) {
        const { type, ...generics } = new ListVisitor().visit(ctx.typeList());
        idCreatedNamePairType.generics = generics;
    }

    return idCreatedNamePairType;
};
