import { NewExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionTypeClass } from '.';

import { CreatorTypeClass, RestVisitor, isCreatorType } from '../restVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class NewExpressionTypeClass extends ExpressionTypeClass<'newExpression', CreatorTypeClass> {
    private constructor(value: CreatorTypeClass | ApexErrorTypeClass) {
        super('newExpression', value);
    }

    static create(ctx: NewExpressionContext): NewExpressionTypeClass {
        if (!ctx.creator()) {
            throw new Error('値が異常です。NewExpressionContext: ' + ctx.getText());
        }

        return new NewExpressionTypeClass(
            isApexValidClass(new RestVisitor().visit(ctx.creator()), isCreatorType, 'creator'),
        );
    }
}

export const isNewExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is NewExpressionTypeClass => {
    return target instanceof NewExpressionTypeClass;
};

