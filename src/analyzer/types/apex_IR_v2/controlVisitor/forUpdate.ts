import { ForUpdateContext } from '@apexdevtools/apex-parser';

import { ControlTypeClass } from './index';

import { ExpressionListTypeClass, ListVisitor, isExpressionListType } from '../listVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class ForUpdateTypeClass extends ControlTypeClass<'forUpdate', ExpressionListTypeClass> {
    private constructor(value: ExpressionListTypeClass | ApexErrorTypeClass) {
        super('forUpdate', value);
    }

    static create(ctx: ForUpdateContext): ForUpdateTypeClass {
        if (!ctx.expressionList()) {
            throw new Error('値が異常です。ForUpdateContext: ' + ctx.getText());
        }

        return new ForUpdateTypeClass(
            visitNode(
                new ListVisitor(),
                ctx.expressionList(),
                isExpressionListType,
                'expressionList',
            ),
        );
    }
}

export const isForUpdateType = (
    target: ApexCommonTypeClass<string>,
): target is ForUpdateTypeClass => {
    return target instanceof ForUpdateTypeClass;
};
