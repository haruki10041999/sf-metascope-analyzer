import { MapCreatorRestPairContext } from '@apexdevtools/apex-parser';

import { DoublePairTypeClass } from '.';

import { ExpressionTypeClass, ExpressionVisitor, isExpressionTypeAll } from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class MapCreatorPairTypeClass extends DoublePairTypeClass<
    ExpressionTypeClass<unknown>,
    ExpressionTypeClass<unknown>
> {
    private constructor(
        left: ExpressionTypeClass<unknown> | null,
        right: ExpressionTypeClass<unknown> | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('mapCreatorPair', left, right, errorClasses);
    }

    static create(ctx: MapCreatorRestPairContext): MapCreatorPairTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 2) {
            throw new Error('値が異常です。MapCreatorRestPairContext: ' + ctx.getText());
        }

        let left: ExpressionTypeClass<unknown> | null = null;
        let right: ExpressionTypeClass<unknown> | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const leftExpressionTypeClass = new ExpressionVisitor().visit(ctx.expression(0));
        const rightExpressionTypeClass = new ExpressionVisitor().visit(ctx.expression(1));

        if (isExpressionTypeAll(leftExpressionTypeClass)) {
            left = leftExpressionTypeClass;
        } else {
            errorClasses['left'] = leftExpressionTypeClass;
        }
        if (isExpressionTypeAll(rightExpressionTypeClass)) {
            right = rightExpressionTypeClass;
        } else {
            errorClasses['right'] = rightExpressionTypeClass;
        }

        return new MapCreatorPairTypeClass(left, right, errorClasses);
    }
}

export const isMapCreatorPairType = (
    target: CommonTypeClass,
): target is MapCreatorPairTypeClass => {
    return target instanceof MapCreatorPairTypeClass;
};
