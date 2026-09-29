import { MapCreatorRestContext } from '@apexdevtools/apex-parser';

import { PairType, PairVisitor } from '../pairVisitor';

export type MapCreatorRestType = {
    type: 'mapCreatorRest';
    rest: PairType[];
};

export const makeMapCreatorRestType = (ctx: MapCreatorRestContext): MapCreatorRestType => {
    if (!ctx.mapCreatorRestPair_list() || ctx.mapCreatorRestPair_list().length === 0) {
        throw new Error('値が異常です。MapCreatorRestContext: ' + ctx.getText());
    }

    const initialValue = ctx.mapCreatorRestPair_list().map((mapCreatorRestPairCtx) => {
        const value = new PairVisitor().visit(mapCreatorRestPairCtx);
        return value;
    });

    return {
        type: 'mapCreatorRest',
        rest: initialValue,
    };
};

