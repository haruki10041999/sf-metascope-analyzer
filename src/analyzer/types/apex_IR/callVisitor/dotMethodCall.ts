import { DotMethodCallContext } from '@apexdevtools/apex-parser';

import { CallTypeClass } from '.';

import { AnyIdTypeClass, IdVisitor, isAnyIdType } from '../idVisitor';
import { ExpressionListTypeClass, ListVisitor, isExpressionListType } from '../listVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';

export class DotMethodCallTypeClass extends CallTypeClass<
    'dotMethodCall',
    AnyIdTypeClass,
    ExpressionListTypeClass
> {
    private constructor(
        value: AnyIdTypeClass | ApexErrorTypeClass,
        param: ExpressionListTypeClass | ApexErrorTypeClass | null,
    ) {
        super('dotMethodCall', value, param);
    }

    static create(ctx: DotMethodCallContext): DotMethodCallTypeClass {
        if (!ctx.anyId()) {
            throw new Error('値が異常です。DotMethodCallContext: ' + ctx.getText());
        }

        return new DotMethodCallTypeClass(
            visitNode(new IdVisitor(), ctx.anyId(), isAnyIdType, 'anyId'),
            visitOptionalNode(
                new ListVisitor(),
                ctx.expressionList(),
                isExpressionListType,
                'expressionList',
            ),
        );
    }
}

export const isDotMethodCallType = (
    target: ApexCommonTypeClass<string>,
): target is DotMethodCallTypeClass => {
    return target instanceof DotMethodCallTypeClass;
};
