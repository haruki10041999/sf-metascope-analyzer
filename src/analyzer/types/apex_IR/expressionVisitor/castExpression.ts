import { CastExpressionContext } from '@apexdevtools/apex-parser';

import {
    ExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class CastExpressionTypeClass extends ExpressionTypeClass<BasedExpressionTypeClass> {
    private valueType: TypeRefTypeClass | ErrorTypeClass;

    private constructor(
        value: BasedExpressionTypeClass | ErrorTypeClass,
        valueType: TypeRefTypeClass | ErrorTypeClass,
    ) {
        super('castExpression', value);
        this.valueType = valueType;
    }

    static create(ctx: CastExpressionContext): CastExpressionTypeClass {
        if (!ctx.expression() || !ctx.typeRef()) {
            throw new Error('値が異常です。CastExpressionContext: ' + ctx.getText());
        }

        return new CastExpressionTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isBasedExpressionType,
                'expression',
            ),
            isValidClass(new TypeVisitor().visit(ctx.typeRef()), isTypeRefType, 'typeRef'),
        );
    }

    getValueType(): TypeRefTypeClass | ErrorTypeClass {
        return this.valueType;
    }
}

export const isCastExpressionType = (
    target: CommonTypeClass,
): target is CastExpressionTypeClass => {
    return target instanceof CastExpressionTypeClass;
};
