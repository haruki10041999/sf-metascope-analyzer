import { MapCreatorRestPairContext } from '@apexdevtools/apex-parser';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type MapCreatorRestPairType = TypeField<'mapCreatorRestPair'> & {
    left: BasedExpressionTypeClass;
    right: BasedExpressionTypeClass;
};

export class MapCreatorRestPairTypeClass extends ApexCommonTypeClass<
    'mapCreatorRestPair',
    MapCreatorRestPairType
> {
    private constructor(fields: FieldsOf<MapCreatorRestPairType>, sourceSpan: SourceSpan) {
        super('mapCreatorRestPair', fields, sourceSpan);
    }

    static create(ctx: MapCreatorRestPairContext): MapCreatorRestPairTypeClass {
        return new MapCreatorRestPairTypeClass(
            {
                left: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(0),
                    isBasedExpressionType,
                    'expression',
                ),
                right: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(1),
                    isBasedExpressionType,
                    'expression',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getLeft(): MapCreatorRestPairType['left'] {
        return this.getFields().left;
    }

    getRight(): MapCreatorRestPairType['right'] {
        return this.getFields().right;
    }
}

export const isMapCreatorRestPairType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is MapCreatorRestPairTypeClass =>
    isSpicifyApexCommonTypeClass('mapCreatorRestPair', target);
