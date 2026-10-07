import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class CallTypeClass<T, Tparam> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    private param: Tparam | ErrorTypeClass | null;

    constructor(type: string, value: T | ErrorTypeClass, param: Tparam | ErrorTypeClass | null) {
        super(type);
        this.value = value;
        this.param = param;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }

    getParam(): Tparam | ErrorTypeClass | null {
        return this.param;
    }
}

export const isCallTypeAll = (
    target: CommonTypeClass,
): target is CallTypeClass<unknown, unknown> => {
    return target instanceof CallTypeClass;
};
