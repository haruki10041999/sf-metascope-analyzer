import type { NormalModifierTypeClass } from '../modifierVisitor';
import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class MemberTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T | ErrorTypeClass;
    private modifier: (NormalModifierTypeClass | ErrorTypeClass)[];
    constructor(
        type: TName,
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

export const isMemberTypeAll = (
    target: CommonTypeClass<string>,
): target is MemberTypeClass<string, unknown> => {
    return target instanceof MemberTypeClass;
};
