import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class CallTypeClass<TName extends string, T, Tparam> extends CommonTypeClass<TName> {
    private value: T | ErrorTypeClass;
    private param: Tparam | ErrorTypeClass | null;

    constructor(type: TName, value: T | ErrorTypeClass, param: Tparam | ErrorTypeClass | null) {
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
    target: CommonTypeClass<string>,
): target is CallTypeClass<string, unknown, unknown> => {
    return target instanceof CallTypeClass;
};
