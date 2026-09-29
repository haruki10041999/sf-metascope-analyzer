import { IdCreatedNamePairContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { ListType, ListVisitor } from '../listVisitor';

export type IdCreatedNamePairType = {
    type: 'idCreatedNamePair';
    pair: {
        name: IdType;
        generics?: ListType;
    };
};

export const makeIdCreatedNamePairType = (ctx: IdCreatedNamePairContext): IdCreatedNamePairType => {
    if (!ctx.anyId()) {
        throw new Error('値が異常です。IdCreatedNamePairContext: ' + ctx.getText());
    }

    const name = new IdVisitor().visit(ctx.anyId());

    const idCreatedNamePairType: IdCreatedNamePairType = {
        type: 'idCreatedNamePair',
        pair: {
            name: name,
        },
    };

    if (ctx.typeList()) {
        const generics = new ListVisitor().visit(ctx.typeList());
        idCreatedNamePairType.pair.generics = generics;
    }

    return idCreatedNamePairType;
};
