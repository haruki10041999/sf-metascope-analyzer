import { NewExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionTypeClass } from '.';

import { CreatorTypeClass, RestVisitor, isCreatorType } from '../restVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class NewExpressionTypeClass extends ExpressionTypeClass<CreatorTypeClass> {
    private constructor(value: CreatorTypeClass | ErrorTypeClass) {
        super('newExpression', value);
    }

    static create(ctx: NewExpressionContext): NewExpressionTypeClass {
        if (!ctx.creator()) {
            throw new Error('値が異常です。NewExpressionContext: ' + ctx.getText());
        }

        return new NewExpressionTypeClass(
            isValidClass(new RestVisitor().visit(ctx.creator()), isCreatorType, 'creator'),
        );
    }
}

export const isNewExpressionType = (target: CommonTypeClass): target is NewExpressionTypeClass => {
    return target instanceof NewExpressionTypeClass;
};

