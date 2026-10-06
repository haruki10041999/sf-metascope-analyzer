import { DotMethodCallContext } from '@apexdevtools/apex-parser';

import { CallTypeClass } from '.';

import { AnyIdTypeClass, IdVisitor, isAnyIdType } from '../idVisitor';
import { ExpressionListTypeClass, ListVisitor, isExpressionListType } from '../listVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class DotMethodCallTypeClass extends CallTypeClass<AnyIdTypeClass, ExpressionListTypeClass> {
    private constructor(
        value: AnyIdTypeClass | ErrorTypeClass,
        param: ExpressionListTypeClass | ErrorTypeClass | null,
    ) {
        super('dotMethodCall', value, param);
    }

    static create(ctx: DotMethodCallContext): DotMethodCallTypeClass {
        if (!ctx.anyId()) {
            throw new Error('値が異常です。DotMethodCallContext: ' + ctx.getText());
        }

        return new DotMethodCallTypeClass(
            isValidClass(new IdVisitor().visit(ctx.anyId()), isAnyIdType, 'anyId'),
            ctx.expressionList()
                ? isValidClass(
                      new ListVisitor().visit(ctx.expressionList()),
                      isExpressionListType,
                      'expressionList',
                  )
                : null,
        );
    }
}

export const isDotMethodCallType = (target: CommonTypeClass): target is DotMethodCallTypeClass => {
    return target instanceof DotMethodCallTypeClass;
};

