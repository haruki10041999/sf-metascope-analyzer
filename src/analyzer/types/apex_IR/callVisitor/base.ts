import { ApexErrorTypeClass, ApexCommonTypeClass } from '../commonVisitor';

export class CallTypeClass<TName extends string, T, Tparam> extends ApexCommonTypeClass<TName> {
    private value: T | ApexErrorTypeClass;
    private param: Tparam | ApexErrorTypeClass | null;

    constructor(type: TName, value: T | ApexErrorTypeClass, param: Tparam | ApexErrorTypeClass | null) {
        super(type);
        this.value = value;
        this.param = param;
    }

    getValue(): T | ApexErrorTypeClass {
        return this.value;
    }

    getParam(): Tparam | ApexErrorTypeClass | null {
        return this.param;
    }
}

export const isCallTypeAll = (
    target: ApexCommonTypeClass<string>,
): target is CallTypeClass<string, unknown, unknown> => {
    return target instanceof CallTypeClass;
};
