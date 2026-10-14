import {
    TriggerUnitClass,
    TriggerCaseClass,
    isAnonymousTriggerMemberDeclarationClass,
    isNormalStatementClass,
} from '../converter';

import { ModifierType, makeModifierType } from '../modifier';
import { StatementType, makeStatementType } from '../statement';
import { AnonymousTriggerMemberType, makeAnonymousTriggerMemberType } from '../declaration';

type TriggerCaseType = {
    kind: string;
    timing: string;
};

export type TriggerUnitType = {
    fileType: 'trigger';
    triggerCase: TriggerCaseType[];
    block: ({ modifier?: ModifierType } & (AnonymousTriggerMemberType | StatementType))[];
};

const makeTriggerCaseType = (triggerCase: TriggerCaseClass): TriggerCaseType | undefined => {
    const timing = triggerCase.getValue();
    const kind = triggerCase.getTriggerCaseType();

    if (timing && kind) {
        return {
            kind: kind,
            timing: timing,
        };
    }

    return undefined;
};

export const makeTriggerUnitType = (triggerUnit: TriggerUnitClass): TriggerUnitType | undefined => {
    const value = triggerUnit.getValue();
    const triggerCaseType = triggerUnit
        .getTriggerCaseType()
        .map((t) => makeTriggerCaseType(t))
        .filter((t) => t !== undefined);
    const triggerBlock = triggerUnit.getBlock();

    if (value && triggerCaseType.length > 0 && triggerBlock.length > 0) {
        const blocks: ({ modifier?: ModifierType } & (
            AnonymousTriggerMemberType | StatementType
        ))[] = [];

        triggerBlock.forEach((b) => {
            const block = b.getValue();
            const modifier = makeModifierType(b.getModifier());

            if (isAnonymousTriggerMemberDeclarationClass(block)) {
                const member = makeAnonymousTriggerMemberType(block);
                if (member) {
                    const field: { modifier?: ModifierType } & AnonymousTriggerMemberType = {
                        ...member,
                    };

                    if (modifier) {
                        field.modifier = modifier;
                    }

                    blocks.push(field);
                }
            }

            if (isNormalStatementClass(block)) {
                const member = makeStatementType(block);
                if (member) {
                    const field: { modifier?: ModifierType } & StatementType = {
                        ...member,
                    };

                    if (modifier) {
                        field.modifier = modifier;
                    }

                    blocks.push(field);
                }
            }
        });

        return {
            fileType: 'trigger',
            triggerCase: triggerCaseType,
            block: blocks,
        };
    }

    return undefined;
};
