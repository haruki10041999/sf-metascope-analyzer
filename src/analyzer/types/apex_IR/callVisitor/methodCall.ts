import { MethodCallContext } from '@apexdevtools/apex-parser';

import { CallTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { ExpressionListTypeClass, ListVisitor, isExpressionListType } from '../listVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class MethodCallTypeClass extends CallTypeClass<NormalIdTypeClass, ExpressionListTypeClass> {
    private reference: string | null = null;

    private constructor(
        value: NormalIdTypeClass | null,
        param: ExpressionListTypeClass | null,
        reference: string | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('methodCall', value, param, errorClasses);
        this.reference = reference;
    }

    static create(ctx: MethodCallContext): MethodCallTypeClass {
        if (!ctx.id()) {
            throw new Error('値が異常です。MethodCallContext: ' + ctx.getText());
        }

        let value: NormalIdTypeClass | null = null;
        let param: ExpressionListTypeClass | null = null;
        let reference: string | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const idTypeClass = new IdVisitor().visit(ctx.id());
        if (isNormalIdType(idTypeClass)) {
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

        if (ctx.THIS()) {
            reference = 'this';
        }

        if (ctx.SUPER()) {
            reference = 'super';
        }

        return new MethodCallTypeClass(value, param, reference, errorClasses);
    }

    getReference(): string | null {
        return this.reference;
    }

    isReferenceNull(): boolean {
        return this.reference === null;
    }
}

export const isMethodCallType = (target: CommonTypeClass): target is MethodCallTypeClass => {
    return target instanceof MethodCallTypeClass;
};

