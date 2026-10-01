import { MethodCallContext, DotMethodCallContext } from '@apexdevtools/apex-parser';

import { MethodCallTypeClass } from './methodCall';
import { DotMethodCallTypeClass } from './dotMethodCall';

import { ErrorTypeClass, ContextTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isMethodCallType, MethodCallTypeClass } from './methodCall';
export { isDotMethodCallType, DotMethodCallTypeClass } from './dotMethodCall';
export class CallTypeClass<T, Tparam> extends ContextTypeClass<T> {
    private param: Tparam | null;

    constructor(
        type: string,
        value: T | null,
        param: Tparam | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super(type, value, errorClasses);
        this.param = param;
    }

    getParam(): Tparam | null {
        return this.param;
    }

    isParamNull(): boolean {
        return this.param === null;
    }
}

export const isCallType = (target: CommonTypeClass): target is CallTypeClass<unknown, unknown> => {
    return target instanceof CallTypeClass;
};

export class CallVisitor extends CommonVisitor<CallTypeClass<unknown, unknown>> {
    visitMethodCall(ctx: MethodCallContext) {
        return MethodCallTypeClass.create(ctx);
    }

    visitDotMethodCall(ctx: DotMethodCallContext) {
        return DotMethodCallTypeClass.create(ctx);
    }
}

