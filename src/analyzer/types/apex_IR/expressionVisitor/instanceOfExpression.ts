import { InstanceOfExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleOperatorExpressionTypeClass,
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class InstanceOfExpressionTypeClass extends DoubleOperatorExpressionTypeClass<
    ExpressionAllTypeClass,
    string,
    TypeRefTypeClass
> {
    private constructor(
        left: ExpressionAllTypeClass | ErrorTypeClass,
        right: TypeRefTypeClass | ErrorTypeClass,
    ) {
        super('instanceOfExpression', left, right, 'instanceof');
    }

    static create(ctx: InstanceOfExpressionContext): InstanceOfExpressionTypeClass {
        if (!ctx.expression() || !ctx.typeRef()) {
            throw new Error('値が異常です。InstanceOfExpressionContext: ' + ctx.getText());
        }

        return new InstanceOfExpressionTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isExpressionTypeAll,
                'expression',
            ),
            isValidClass(new TypeVisitor().visit(ctx.typeRef()), isTypeRefType, 'typeRef'),
        );
    }
}

export const isInstanceOfExpressionType = (
    target: CommonTypeClass,
): target is InstanceOfExpressionTypeClass => {
    return target instanceof InstanceOfExpressionTypeClass;
};

