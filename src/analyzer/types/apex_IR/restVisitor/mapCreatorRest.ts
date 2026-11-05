import { MapCreatorRestContext } from '@apexdevtools/apex-parser';

import { RestListTypeClass } from '.';

import { MapCreatorRestPairTypeClass, PairVisitor, isMapCreatorRestPairType } from '../pairVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNodeList } from '../commonVisitor';
export class MapCreatorRestTypeClass extends RestListTypeClass<
    'mapCreatorRest',
    MapCreatorRestPairTypeClass
> {
    private constructor(value: (MapCreatorRestPairTypeClass | ApexErrorTypeClass)[]) {
        super('mapCreatorRest', value);
    }

    static create(ctx: MapCreatorRestContext): MapCreatorRestTypeClass {
        if (!ctx.mapCreatorRestPair_list() || ctx.mapCreatorRestPair_list().length === 0) {
            throw new Error('値が異常です。MapCreatorRestContext: ' + ctx.getText());
        }

        return new MapCreatorRestTypeClass(
            visitNodeList(
                new PairVisitor(),
                ctx.mapCreatorRestPair_list(),
                isMapCreatorRestPairType,
                'mapCreatorRestPair',
            ),
        );
    }
}

export const isMapCreatorRestType = (
    target: ApexCommonTypeClass<string>,
): target is MapCreatorRestTypeClass => {
    return target instanceof MapCreatorRestTypeClass;
};
