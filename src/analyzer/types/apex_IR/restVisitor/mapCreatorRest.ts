import { MapCreatorRestContext } from '@apexdevtools/apex-parser';

import { RestTypeClass } from '.';

import { MapCreatorRestPairTypeClass, PairVisitor, isMapCreatorRestPairType } from '../pairVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';
export class MapCreatorRestTypeClass extends RestTypeClass<MapCreatorRestPairTypeClass[]> {
    private constructor(
        value: MapCreatorRestPairTypeClass[] | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('mapCreatorRest', value, errorClasses);
    }

    static create(ctx: MapCreatorRestContext): MapCreatorRestTypeClass {
        if (!ctx.mapCreatorRestPair_list() || ctx.mapCreatorRestPair_list().length === 0) {
            throw new Error('値が異常です。MapCreatorRestContext: ' + ctx.getText());
        }

        const value: MapCreatorRestPairTypeClass[] = [];
        const errorClasses: Record<string, ErrorTypeClass> = {};

        ctx.mapCreatorRestPair_list().forEach((mapCreatorRestPairCtx, index) => {
            const pairTypeClass = new PairVisitor().visit(mapCreatorRestPairCtx);
            if (isMapCreatorRestPairType(pairTypeClass)) {
                value.push(pairTypeClass);
            } else if (isErrorType(pairTypeClass)) {
                errorClasses[`value_${index}`] = pairTypeClass;
            }
        });

        return new MapCreatorRestTypeClass(value, errorClasses);
    }
}

export const isMapCreatorRestType = (
    target: CommonTypeClass,
): target is MapCreatorRestTypeClass => {
    return target instanceof MapCreatorRestTypeClass;
};

