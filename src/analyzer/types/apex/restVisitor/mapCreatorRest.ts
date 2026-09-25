import { MapCreatorRestContext } from '@apexdevtools/apex-parser';

import { PairType, PairVisitor } from '../pairVisitor';

export type MapCreatorRestType = {
    type: 'mapCreatorRest';
    initilValue: Omit<PairType, 'type'>;
};

export const makeMapCreatorRestType = (ctx: MapCreatorRestContext): MapCreatorRestType => {
    const initialValue = ctx.mapCreatorRestPair_list().map((mapCreatorRestPairCtx) => {
        const { type, ...value } = new PairVisitor().visit(mapCreatorRestPairCtx);
        return value;
    });

    return {
        type: 'mapCreatorRest',
        initilValue: initialValue,
    };
};
