import { ApexErrorTypeClass, ApexCommonTypeClass } from '../commonVisitor';

export class ParameterValueTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T;
    constructor(type: TName, value: T) {
        super(type);
        this.value = value;
    }

    getValue(): T {
        return this.value;
    }
}

export class ParameterTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T | ApexErrorTypeClass;
    constructor(type: TName, value: T | ApexErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ApexErrorTypeClass {
        return this.value;
    }
}

export type ParameterAllTypeClass =
    ParameterValueTypeClass<string, unknown> | ParameterTypeClass<string, unknown>;

export const isParameterTypeAll = (
    target: ApexCommonTypeClass<string>,
): target is ParameterTypeClass<string, unknown> => {
    return target instanceof ParameterValueTypeClass || target instanceof ParameterTypeClass;
};
