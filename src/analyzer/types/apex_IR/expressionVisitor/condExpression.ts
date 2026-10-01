import { CondExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionTypeClass, ExpressionVisitor, isExpressionTypeAll } from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class CondExpressionTypeClass extends ExpressionTypeClass<{
    trueValue: ExpressionTypeClass<unknown> | null;
    falseValue: ExpressionTypeClass<unknown> | null;
}> {
    private condition: ExpressionTypeClass<unknown> | null = null;
    private trueValue: ExpressionTypeClass<unknown> | null = null;
    private falseValue: ExpressionTypeClass<unknown> | null = null;

    constructor(
        condition: ExpressionTypeClass<unknown> | null,
        trueValue: ExpressionTypeClass<unknown> | null,
        falseValue: ExpressionTypeClass<unknown> | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('condExpression', { trueValue: trueValue, falseValue: falseValue }, errorClasses);
        this.condition = condition;
        this.trueValue = trueValue;
        this.falseValue = falseValue;
    }

    static create(ctx: CondExpressionContext): CondExpressionTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 3) {
            throw new Error('Invalid CondExpressionContext: ' + ctx.getText());
        }

        let condition: ExpressionTypeClass<unknown> | null = null;
        let trueValue: ExpressionTypeClass<unknown> | null = null;
        let falseValue: ExpressionTypeClass<unknown> | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const expressionTypeClass_0 = new ExpressionVisitor().visit(ctx.expression(0));
        if (isExpressionTypeAll(expressionTypeClass_0)) {
            condition = expressionTypeClass_0;
        } else {
            errorClasses['condition'] = expressionTypeClass_0;
        }

        const expressionTypeClass_1 = new ExpressionVisitor().visit(ctx.expression(1));
        if (isExpressionTypeAll(expressionTypeClass_1)) {
            trueValue = expressionTypeClass_1;
        } else {
            errorClasses['trueValue'] = expressionTypeClass_1;
        }

        const expressionTypeClass_2 = new ExpressionVisitor().visit(ctx.expression(2));
        if (isExpressionTypeAll(expressionTypeClass_2)) {
            falseValue = expressionTypeClass_2;
        } else {
            errorClasses['falseValue'] = expressionTypeClass_2;
        }

        return new CondExpressionTypeClass(condition, trueValue, falseValue, errorClasses);
    }

    getCondition(): ExpressionTypeClass<unknown> | null {
        return this.condition;
    }

    isConditionNull(): boolean {
        return this.condition === null;
    }

    getTrueValue(): ExpressionTypeClass<unknown> | null {
        return this.trueValue;
    }

    isTrueValueNull(): boolean {
        return this.trueValue === null;
    }

    getFalseValue(): ExpressionTypeClass<unknown> | null {
        return this.falseValue;
    }

    isFalseValueNull(): boolean {
        return this.falseValue === null;
    }
}

export const isCondExpressionType = (
    target: CommonTypeClass,
): target is CondExpressionTypeClass => {
    return target instanceof CondExpressionTypeClass;
};

