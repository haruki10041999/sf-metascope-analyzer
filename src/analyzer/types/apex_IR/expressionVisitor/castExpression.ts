import { CastExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionTypeClass, ExpressionVisitor, isExpressionTypeAll } from '.';

import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class CastExpressionTypeClass extends ExpressionTypeClass<ExpressionTypeClass<unknown>> {
    private valueType: TypeRefTypeClass | null = null;

    private constructor(
        value: ExpressionTypeClass<unknown> | null,
        valueType: TypeRefTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('castExpression', value, errorClasses);
        this.valueType = valueType;
    }

    static create(ctx: CastExpressionContext): CastExpressionTypeClass {
        if (!ctx.expression() || !ctx.typeRef()) {
            throw new Error('値が異常です。CastExpressionContext: ' + ctx.getText());
        }

        let value: ExpressionTypeClass<unknown> | null = null;
        let valueType: TypeRefTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const expressionTypeClass = new ExpressionVisitor().visit(ctx.expression());
        if (isExpressionTypeAll(expressionTypeClass)) {
            value = expressionTypeClass;
        } else {
            errorClasses['value'] = expressionTypeClass;
        }

        const typeTypeClasss = new TypeVisitor().visit(ctx.typeRef());
        if (isTypeRefType(typeTypeClasss)) {
            valueType = typeTypeClasss;
        } else if (isErrorType(typeTypeClasss)) {
            errorClasses['valueType'] = typeTypeClasss;
        }

        return new CastExpressionTypeClass(value, valueType, errorClasses);
    }

    getValueType(): TypeRefTypeClass | null {
        return this.valueType;
    }

    isValueTypeNull(): boolean {
        return this.valueType === null;
    }
}

export const isCastExpressionType = (
    target: CommonTypeClass,
): target is CastExpressionTypeClass => {
    return target instanceof CastExpressionTypeClass;
};

