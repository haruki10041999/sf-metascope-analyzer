import { NewExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionTypeClass } from '.';

import { CreatorTypeClass, RestVisitor, isCreatorType } from '../restVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class NewExpressionTypeClass extends ExpressionTypeClass<CreatorTypeClass> {
    private constructor(
        value: CreatorTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('newExpression', value, errorClasses);
    }

    static create(ctx: NewExpressionContext): NewExpressionTypeClass {
        if (!ctx.creator()) {
            throw new Error('値が異常です。NewExpressionContext: ' + ctx.getText());
        }

        let value: CreatorTypeClass | null = null;
        const errorTypeClasses: Record<string, ErrorTypeClass> = {};
        const expression = new RestVisitor().visit(ctx.creator());
        if (isCreatorType(expression)) {
            value = expression;
        } else if (isErrorType(expression)) {
            errorTypeClasses['value'] = expression;
        }

        return new NewExpressionTypeClass(value, errorTypeClasses);
    }
}

export const isNewExpressionType = (target: CommonTypeClass): target is NewExpressionTypeClass => {
    return target instanceof NewExpressionTypeClass;
};

