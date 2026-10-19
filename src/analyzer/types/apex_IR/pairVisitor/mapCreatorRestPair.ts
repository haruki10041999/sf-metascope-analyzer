import { MapCreatorRestPairContext } from '@apexdevtools/apex-parser';

import { PairTypeClass } from '.';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionTypeClass,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class MapCreatorRestPairTypeClass extends PairTypeClass<
    BasedExpressionTypeClass,
    BasedExpressionTypeClass
> {
    private constructor(
        left: BasedExpressionTypeClass | ErrorTypeClass,
        right: BasedExpressionTypeClass | ErrorTypeClass,
    ) {
        super('mapCreatorRestPair', left, right);
    }

    static create(ctx: MapCreatorRestPairContext): MapCreatorRestPairTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 2) {
            throw new Error('値が異常です。MapCreatorRestPairContext: ' + ctx.getText());
        }

        return new MapCreatorRestPairTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression(0)),
                isBasedExpressionTypeClass,
                'expression',
            ),
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression(1)),
                isBasedExpressionTypeClass,
                'expression',
            ),
        );
    }
}

export const isMapCreatorRestPairType = (
    target: CommonTypeClass,
): target is MapCreatorRestPairTypeClass => {
    return target instanceof MapCreatorRestPairTypeClass;
};
