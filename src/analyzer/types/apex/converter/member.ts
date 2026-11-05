import { isCommonType, CommonType, ValueRuleValue } from './commons';
import { ModifierType } from './modifier';
import { StatementType } from './statement';
import { AnonymousMemberDeclarationType, TriggerMemberDeclarationType } from './declaration';

export type AnonymousBlockMemberType = CommonType<'anonymousBlockMember'> & {
    value: ValueRuleValue<AnonymousMemberDeclarationType | StatementType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isAnonymousBlockMemberType = (value: unknown): value is AnonymousBlockMemberType => {
    return isCommonType(value) && value.type === 'anonymousBlockMember';
};

export type TriggerBlockMemberType = CommonType<'triggerBlockMember'> & {
    value: ValueRuleValue<TriggerMemberDeclarationType | StatementType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isTriggerBlockMemberType = (value: unknown): value is TriggerBlockMemberType => {
    return isCommonType(value) && value.type === 'triggerBlockMember';
};
