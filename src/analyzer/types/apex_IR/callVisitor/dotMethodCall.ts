import { DotMethodCallContext } from '@apexdevtools/apex-parser';

import { CallTypeClass } from '.';

import { AnyIdTypeClass, IdVisitor, isAnyIdType } from '../idVisitor';
import { ExpressionListTypeClass, ListVisitor, isExpressionListType } from '../listVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class DotMethodCallTypeClass extends CallTypeClass<AnyIdTypeClass, ExpressionListTypeClass> {
    private constructor(
        value: AnyIdTypeClass | null,
        param: ExpressionListTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('dotMethodCall', value, param, errorClasses);
    }

    static create(ctx: DotMethodCallContext): DotMethodCallTypeClass {
        if (!ctx.anyId()) {
            throw new Error('値が異常です。DotMethodCallContext: ' + ctx.getText());
        }

        let value: AnyIdTypeClass | null = null;
        let param: ExpressionListTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const idTypeClass = new IdVisitor().visit(ctx.anyId());
        if (isAnyIdType(idTypeClass)) {
            value = idTypeClass;
        } else if (isErrorType(idTypeClass)) {
            errorClasses['value'] = idTypeClass;
        }

        if (ctx.expressionList()) {
            const listTypeClass = new ListVisitor().visit(ctx.expressionList());
            if (isExpressionListType(listTypeClass)) {
                param = listTypeClass;
            } else if (isErrorType(listTypeClass)) {
                errorClasses['param'] = listTypeClass;
            }
        }

        return new DotMethodCallTypeClass(value, param, errorClasses);
    }
}

export const isDotMethodCallType = (target: CommonTypeClass): target is DotMethodCallTypeClass => {
    return target instanceof DotMethodCallTypeClass;
};

