import {
    AnonymousBlockMemberTypeClass,
    TriggerBlockMemberTypeClass,
    isAnonymousBlockMemberType as isAnonymousBlockMemberTypeClass,
    isTriggerBlockMemberType as isTriggerBlockMemberTypeClass,
} from '../../apex_IR';

import {
    isCommonType,
    ErrorType,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeSourceInfo,
} from './commons';
import { makeModifierAssignRule, ModifierType } from './modifier';
import { makeStatementAssignRule, StatementType } from './statement';
import {
    makeAnonymousMemberDeclarationAssignRule,
    makeTriggerMemberDeclarationAssignRule,
    AnonymousMemberDeclarationType,
    TriggerMemberDeclarationType,
} from './declaration';

export type AnonymousBlockMemberType = CommonType<'anonymousBlockMember'> & {
    value: ValueRuleValue<AnonymousMemberDeclarationType | StatementType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isAnonymousBlockMemberType = (value: unknown): value is AnonymousBlockMemberType => {
    return isCommonType(value) && value.type === 'anonymousBlockMember';
};

export const makeAnonymousBlockMemberAssignRule: AssignForValueRule<
    AnonymousBlockMemberTypeClass,
    AnonymousBlockMemberType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isAnonymousBlockMemberTypeClass),
    construct: (memberTypeClass: AnonymousBlockMemberTypeClass) => {
        const value = assignMultiClass(memberTypeClass.getValue(), [
            makeAnonymousMemberDeclarationAssignRule,
            makeStatementAssignRule,
            makeErrorAssignRule,
        ]);
        const modifier = memberTypeClass
            .getModifier()
            .map((v) => assignMultiClass(v, [makeModifierAssignRule, makeErrorAssignRule]));
        return {
            type: memberTypeClass.getType(),
            sourceInfo: makeSourceInfo(memberTypeClass),
            value,
            modifier,
        };
    },
};

export type TriggerBlockMemberType = CommonType<'triggerBlockMember'> & {
    value: ValueRuleValue<TriggerMemberDeclarationType | StatementType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isTriggerBlockMemberType = (value: unknown): value is TriggerBlockMemberType => {
    return isCommonType(value) && value.type === 'triggerBlockMember';
};

export const makeTriggerBlockMemberAssignRule: AssignForValueRule<
    TriggerBlockMemberTypeClass,
    TriggerBlockMemberType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isTriggerBlockMemberTypeClass),
    construct: (memberTypeClass: TriggerBlockMemberTypeClass) => {
        const value = assignMultiClass(memberTypeClass.getValue(), [
            makeTriggerMemberDeclarationAssignRule,
            makeStatementAssignRule,
            makeErrorAssignRule,
        ]);
        const modifier = memberTypeClass
            .getModifier()
            .map((v) => assignMultiClass(v, [makeModifierAssignRule, makeErrorAssignRule]));
        return {
            type: memberTypeClass.getType(),
            sourceInfo: makeSourceInfo(memberTypeClass),
            value,
            modifier,
        };
    },
};
