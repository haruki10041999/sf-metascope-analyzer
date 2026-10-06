import { MethodCallContext } from '@apexdevtools/apex-parser';

import { CallTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { ExpressionListTypeClass, ListVisitor, isExpressionListType } from '../listVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class MethodCallTypeClass extends CallTypeClass<NormalIdTypeClass, ExpressionListTypeClass> {
    private reference: string | null = null;

    private constructor(
        value: NormalIdTypeClass | ErrorTypeClass,
        param: ExpressionListTypeClass | ErrorTypeClass | null,
        reference: string | null,
    ) {
        super('methodCall', value, param);
        this.reference = reference;
    }

    static create(ctx: MethodCallContext): MethodCallTypeClass {
        if (!ctx.id()) {
            throw new Error('値が異常です。MethodCallContext: ' + ctx.getText());
        }

        return new MethodCallTypeClass(
            isValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id'),
            ctx.expressionList()
                ? isValidClass(
                      new ListVisitor().visit(ctx.expressionList()),
                      isExpressionListType,
                      'expressionList',
                  )
                : null,
            ctx.THIS() ? 'this' : ctx.SUPER() ? 'super' : null,
        );
    }

    getReference(): string | null {
        return this.reference;
    }
}

export const isMethodCallType = (target: CommonTypeClass): target is MethodCallTypeClass => {
    return target instanceof MethodCallTypeClass;
};

