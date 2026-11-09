import { MapCreatorRestContext } from '@apexdevtools/apex-parser';

import { MapCreatorRestPairTypeClass } from '../pairVisitor';
import {
    ApexCommonTypeClass,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type MapCreatorRestType = TypeField<'mapCreatorRest'> & {
    value: MapCreatorRestPairTypeClass[];
};

export class MapCreatorRestTypeClass extends ApexCommonTypeClass<
    'mapCreatorRest',
    MapCreatorRestType
> {
    private constructor(fields: FieldsOf<MapCreatorRestType>, sourceSpan: SourceSpan) {
        super('mapCreatorRest', fields, sourceSpan);
    }

    static create(ctx: MapCreatorRestContext): MapCreatorRestTypeClass {
        return new MapCreatorRestTypeClass(
            {
                value: createNodeList(
                    ctx.mapCreatorRestPair_list(),
                    (c) => MapCreatorRestPairTypeClass.create(c),
                    'mapCreatorRestPair',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): MapCreatorRestType['value'] {
        return this.getFields().value;
    }
}

export const isMapCreatorRestType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is MapCreatorRestTypeClass => isSpicifyApexCommonTypeClass('mapCreatorRest', target);
