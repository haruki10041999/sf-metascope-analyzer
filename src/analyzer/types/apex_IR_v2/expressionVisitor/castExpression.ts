import { CastExpressionContext } from '@apexdevtools/apex-parser';

import {
    ExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class CastExpressionTypeClass extends ExpressionTypeClass<
    'castExpression',
    BasedExpressionTypeClass
> {
    private valueType: TypeRefTypeClass | ApexErrorTypeClass;

    private constructor(
        value: BasedExpressionTypeClass | ApexErrorTypeClass,
        valueType: TypeRefTypeClass | ApexErrorTypeClass,
    ) {
        super('castExpression', value);
        this.valueType = valueType;
    }

    static create(ctx: CastExpressionContext): CastExpressionTypeClass {
        if (!ctx.expression() || !ctx.typeRef()) {
            throw new Error('値が異常です。CastExpressionContext: ' + ctx.getText());
        }

        return new CastExpressionTypeClass(
            visitNode(
                new ExpressionVisitor(),
                ctx.expression(),
                isBasedExpressionType,
                'expression',
            ),
            visitNode(new TypeVisitor(), ctx.typeRef(), isTypeRefType, 'typeRef'),
        );
    }

    getValueType(): TypeRefTypeClass | ApexErrorTypeClass {
        return this.valueType;
    }
}

export const isCastExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is CastExpressionTypeClass => {
    return target instanceof CastExpressionTypeClass;
};
