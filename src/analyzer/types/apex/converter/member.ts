import typia from 'typia';

import {
    AnonymousBlockMemberTypeClass,
    TriggerBlockMemberTypeClass,
    isAnonymousBlockMemberType as isAnonymousBlockMemberTypeClass,
    isTriggerBlockMemberType as isTriggerBlockMemberTypeClass,
} from '../../apex_IR';

import {
    ErrorInfo,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeSourceInfo,
} from './commons';
import { makeModifierRule, ModifierType } from './modifier';
import { makeStatementRule, StatementType } from './statement';
import {
    makeAnonymousMemberDeclarationRule,
    makeTriggerMemberDeclarationRule,
    AnonymousMemberDeclarationType,
    TriggerMemberDeclarationType,
} from './declaration';

export type AnonymousBlockMemberType = CommonType & {
    value: ValueRuleValue<AnonymousMemberDeclarationType | StatementType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isAnonymousBlockMemberType = typia.createIs<AnonymousBlockMemberType>();

export const makeAnonymousBlockMemberRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<AnonymousBlockMemberTypeClass, AnonymousBlockMemberType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isAnonymousBlockMemberTypeClass),
        construct: (memberTypeClass: AnonymousBlockMemberTypeClass) => {
            const value = assignMultiClass(memberTypeClass.getValue(), [
                makeAnonymousMemberDeclarationRule(errorInfo),
                makeStatementRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const modifier = memberTypeClass
                .getModifier()
                .map((v) =>
                    assignMultiClass(v, [
                        makeModifierRule(errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            return {
                type: memberTypeClass.getType(),
                sourceInfo: makeSourceInfo(memberTypeClass),
                value,
                modifier,
            };
        },
    };
};

export type TriggerBlockMemberType = CommonType & {
    value: ValueRuleValue<TriggerMemberDeclarationType | StatementType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isTriggerBlockMemberType = typia.createIs<TriggerBlockMemberType>();

export const makeTriggerBlockMemberRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<TriggerBlockMemberTypeClass, TriggerBlockMemberType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTriggerBlockMemberTypeClass),
        construct: (memberTypeClass: TriggerBlockMemberTypeClass) => {
            const value = assignMultiClass(memberTypeClass.getValue(), [
                makeTriggerMemberDeclarationRule(errorInfo),
                makeStatementRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const modifier = memberTypeClass
                .getModifier()
                .map((v) =>
                    assignMultiClass(v, [
                        makeModifierRule(errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            return {
                type: memberTypeClass.getType(),
                sourceInfo: makeSourceInfo(memberTypeClass),
                value,
                modifier,
            };
        },
    };
};

