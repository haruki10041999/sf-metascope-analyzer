import { ForUpdateContext } from '@apexdevtools/apex-parser';

import { ControlTypeClass } from './index';

import { ExpressionListTypeClass, ListVisitor, isExpressionListType } from '../listVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class ForUpdateTypeClass extends ControlTypeClass<ExpressionListTypeClass> {
    private constructor(value: ExpressionListTypeClass | ErrorTypeClass) {
        super('forUpdate', value);
    }

    static create(ctx: ForUpdateContext): ForUpdateTypeClass {
        if (!ctx.expressionList()) {
            throw new Error('値が異常です。ForUpdateContext: ' + ctx.getText());
        }

        return new ForUpdateTypeClass(
            isValidClass(
                new ListVisitor().visit(ctx.expressionList()),
                isExpressionListType,
                'expressionList',
            ),
        );
    }
}

export const isForUpdateType = (target: CommonTypeClass): target is ForUpdateTypeClass => {
    return target instanceof ForUpdateTypeClass;
};
