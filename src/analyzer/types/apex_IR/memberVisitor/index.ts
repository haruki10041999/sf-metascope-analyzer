import {
    ApexParserBaseVisitor,
    AnonymousBlockMemberContext,
    TriggerBlockMemberContext,
} from '@apexdevtools/apex-parser';

import { AnonymousBlockMemberTypeClass } from './anonymousBlockMember';
import { TriggerBlockMemberTypeClass } from './triggerBlockMember';

import { NormalModifierTypeClass } from '../modifierVisitor';
import { ErrorTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isAnonymousBlockMemberType, AnonymousBlockMemberTypeClass } from './anonymousBlockMember';
export { isTriggerBlockMemberType, TriggerBlockMemberTypeClass } from './triggerBlockMember';

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

export class MemberVisitor extends CommonVisitor<MemberTypeClass<unknown>> {
    visitAnonymousBlockMember(ctx: AnonymousBlockMemberContext) {
        return AnonymousBlockMemberTypeClass.create(ctx);
    }

    visitTriggerBlockMember(ctx: TriggerBlockMemberContext) {
        return TriggerBlockMemberTypeClass.create(ctx);
    }
}

