import { InstanceOfExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleStringOperatorExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class InstanceOfExpressionTypeClass extends DoubleStringOperatorExpressionTypeClass<
    'instanceOfExpression',
    BasedExpressionTypeClass,
    'instanceof',
    TypeRefTypeClass
> {
    private constructor(
        left: BasedExpressionTypeClass | ApexErrorTypeClass,
        right: TypeRefTypeClass | ApexErrorTypeClass,
    ) {
        super('instanceOfExpression', left, right, 'instanceof');
    }

    static create(ctx: InstanceOfExpressionContext): InstanceOfExpressionTypeClass {
        if (!ctx.expression() || !ctx.typeRef()) {
            throw new Error('値が異常です。InstanceOfExpressionContext: ' + ctx.getText());
        }

        return new InstanceOfExpressionTypeClass(
            visitNode(
                new ExpressionVisitor(),
                ctx.expression(),
                isBasedExpressionType,
                'expression',
            ),
            visitNode(new TypeVisitor(), ctx.typeRef(), isTypeRefType, 'typeRef'),
        );
    }
}

export const isInstanceOfExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is InstanceOfExpressionTypeClass => {
    return target instanceof InstanceOfExpressionTypeClass;
};
