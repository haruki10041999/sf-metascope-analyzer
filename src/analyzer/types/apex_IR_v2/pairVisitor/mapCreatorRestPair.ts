import { MapCreatorRestPairContext } from '@apexdevtools/apex-parser';

import { PairTypeClass } from '.';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class MapCreatorRestPairTypeClass extends PairTypeClass<
    'mapCreatorRestPair',
    BasedExpressionTypeClass,
    BasedExpressionTypeClass
> {
    private constructor(
        left: BasedExpressionTypeClass | ApexErrorTypeClass,
        right: BasedExpressionTypeClass | ApexErrorTypeClass,
    ) {
        super('mapCreatorRestPair', left, right);
    }

    static create(ctx: MapCreatorRestPairContext): MapCreatorRestPairTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 2) {
            throw new Error('値が異常です。MapCreatorRestPairContext: ' + ctx.getText());
        }

        return new MapCreatorRestPairTypeClass(
            visitNode(
                new ExpressionVisitor(),
                ctx.expression(0),
                isBasedExpressionType,
                'expression',
            ),
            visitNode(
                new ExpressionVisitor(),
                ctx.expression(1),
                isBasedExpressionType,
                'expression',
            ),
        );
    }
}

export const isMapCreatorRestPairType = (
    target: ApexCommonTypeClass<string>,
): target is MapCreatorRestPairTypeClass => {
    return target instanceof MapCreatorRestPairTypeClass;
};
