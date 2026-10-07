import type { NormalModifierTypeClass } from '../modifierVisitor';
import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class MemberTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    private modifier: (NormalModifierTypeClass | ErrorTypeClass)[];
    constructor(
        type: string,
        value: T | ErrorTypeClass,
        modifier: (NormalModifierTypeClass | ErrorTypeClass)[],
    ) {
        super(type);
        this.value = value;
        this.modifier = modifier;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }

    getModifier(): (NormalModifierTypeClass | ErrorTypeClass)[] {
        return this.modifier;
    }
}

export const isMemberTypeAll = (target: CommonTypeClass): target is MemberTypeClass<unknown> => {
    return target instanceof MemberTypeClass;
};
