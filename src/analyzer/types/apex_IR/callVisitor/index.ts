import { MethodCallContext, DotMethodCallContext } from '@apexdevtools/apex-parser';

import { MethodCallTypeClass } from './methodCall';
import { DotMethodCallTypeClass } from './dotMethodCall';

import { ErrorTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isMethodCallType, MethodCallTypeClass } from './methodCall';
export { isDotMethodCallType, DotMethodCallTypeClass } from './dotMethodCall';
export class CallTypeClass<T, Tparam> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    private param: Tparam | ErrorTypeClass | null;

    constructor(type: string, value: T | ErrorTypeClass, param: Tparam | ErrorTypeClass | null) {
        super(type);
        this.value = value;
        this.param = param;
    }

    getParam(): Tparam | ErrorTypeClass | null {
        return this.param;
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

