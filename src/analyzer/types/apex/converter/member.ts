import typia from 'typia';

import {
    AnonymousBlockMemberTypeClass,
    TriggerBlockMemberTypeClass,
    isAnonymousBlockMemberType as isAnonymousBlockMemberTypeClass,
    isTriggerBlockMemberType as isTriggerBlockMemberTypeClass,
} from '../../apex_IR';

import {
    ErrorInfo,
    SourceSlot,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeSourceNode,
    sourceField,
    sourceList,
} from './commons';
import { makeModifierRule, ModifierType } from './modifier';
import { makeStatementRule, StatementType } from './statement';
import {
    makeAnonymousMemberDeclarationRule,
    makeTriggerMemberDeclarationRule,
    AnonymousMemberDeclarationType,
    TriggerMemberDeclarationType,
} from './declaration';

export type AnonymousBlockMemberType = {
    type: string;
    value: ValueRuleValue<AnonymousMemberDeclarationType | StatementType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isAnonymousBlockMemberType = typia.createIs<AnonymousBlockMemberType>();

export const makeAnonymousBlockMemberRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<AnonymousBlockMemberTypeClass, AnonymousBlockMemberType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isAnonymousBlockMemberTypeClass),
        construct: (memberTypeClass: AnonymousBlockMemberTypeClass) => {
            const node = makeSourceNode(memberTypeClass);
            const valueSource = sourceField(node, 'value');
            const value = assignMultiClass(memberTypeClass.getValue(), [
                makeAnonymousMemberDeclarationRule(valueSource, errorInfo),
                makeStatementRule(valueSource, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const modifierSource = sourceList(node, 'modifier');
            const modifier = memberTypeClass
                .getModifier()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeModifierRule(modifierSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: memberTypeClass.getType(), value, modifier };
        },
    };
};

export type TriggerBlockMemberType = {
    type: string;
    value: ValueRuleValue<TriggerMemberDeclarationType | StatementType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isTriggerBlockMemberType = typia.createIs<TriggerBlockMemberType>();

export const makeTriggerBlockMemberRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<TriggerBlockMemberTypeClass, TriggerBlockMemberType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTriggerBlockMemberTypeClass),
        construct: (memberTypeClass: TriggerBlockMemberTypeClass) => {
            const node = makeSourceNode(memberTypeClass);
            const valueSource = sourceField(node, 'value');
            const value = assignMultiClass(memberTypeClass.getValue(), [
                makeTriggerMemberDeclarationRule(valueSource, errorInfo),
                makeStatementRule(valueSource, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const modifierSource = sourceList(node, 'modifier');
            const modifier = memberTypeClass
                .getModifier()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeModifierRule(modifierSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: memberTypeClass.getType(), value, modifier };
        },
    };
};

