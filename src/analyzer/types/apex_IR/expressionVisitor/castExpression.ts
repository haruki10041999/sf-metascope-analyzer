import { CastExpressionContext } from '@apexdevtools/apex-parser';

import {
    ExpressionTypeClass,
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class CastExpressionTypeClass extends ExpressionTypeClass<ExpressionAllTypeClass> {
    private valueType: TypeRefTypeClass | ErrorTypeClass;

    private constructor(
        value: ExpressionAllTypeClass | ErrorTypeClass,
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
                isExpressionTypeAll,
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
