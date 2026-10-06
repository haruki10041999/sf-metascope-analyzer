import { MapCreatorRestContext } from '@apexdevtools/apex-parser';

import { RestListTypeClass } from '.';

import { MapCreatorRestPairTypeClass, PairVisitor, isMapCreatorRestPairType } from '../pairVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';
export class MapCreatorRestTypeClass extends RestListTypeClass<MapCreatorRestPairTypeClass> {
    private constructor(value: (MapCreatorRestPairTypeClass | ErrorTypeClass)[]) {
        super('mapCreatorRest', value);
    }

    static create(ctx: MapCreatorRestContext): MapCreatorRestTypeClass {
        if (!ctx.mapCreatorRestPair_list() || ctx.mapCreatorRestPair_list().length === 0) {
            throw new Error('値が異常です。MapCreatorRestContext: ' + ctx.getText());
        }

        return new MapCreatorRestTypeClass(
            isValidClassList(
                ctx.mapCreatorRestPair_list(),
                (ctx) => new PairVisitor().visit(ctx),
                isMapCreatorRestPairType,
                'mapCreatorRestPair',
            ),
        );
    }
}

export const isMapCreatorRestType = (
    target: CommonTypeClass,
): target is MapCreatorRestTypeClass => {
    return target instanceof MapCreatorRestTypeClass;
};

