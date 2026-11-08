import type { NormalModifierTypeClass } from '../modifierVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass } from '../commonVisitor';

export class MemberTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T | ApexErrorTypeClass;
    private modifier: (NormalModifierTypeClass | ApexErrorTypeClass)[];
    constructor(
        type: TName,
        value: T | ApexErrorTypeClass,
        modifier: (NormalModifierTypeClass | ApexErrorTypeClass)[],
    ) {
        super(type);
        this.value = value;
        this.modifier = modifier;
    }

    getValue(): T | ApexErrorTypeClass {
        return this.value;
    }

    getModifier(): (NormalModifierTypeClass | ApexErrorTypeClass)[] {
        return this.modifier;
    }
}

export const isMemberTypeAll = (
    target: ApexCommonTypeClass<string>,
): target is MemberTypeClass<string, unknown> => {
    return target instanceof MemberTypeClass;
};
