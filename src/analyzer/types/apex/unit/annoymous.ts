import {
    AnonymousTriggerBlockMemberClass,
    isAnonymousTriggerMemberDeclarationClass,
    isNormalStatementClass,
} from '../converter';

import { ModifierType, makeModifierType } from '../modifier';
import { StatementType, makeStatementType } from '../statement';
import { AnonymousTriggerMemberType, makeAnonymousTriggerMemberType } from '../declaration';

export type AnonymousUnitType = {
    fileType: 'anonymous';
    block: ({ modifier?: ModifierType } & (AnonymousTriggerMemberType | StatementType))[];
};

export const makeAnonymousUnitType = (
    anonymousUnit: AnonymousTriggerBlockMemberClass[],
): AnonymousUnitType | undefined => {
    const blocks: ({ modifier?: ModifierType } & (AnonymousTriggerMemberType | StatementType))[] =
        [];

    anonymousUnit.forEach((b) => {
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

    if (blocks.length > 0) {
        return {
            fileType: 'anonymous',
            block: blocks,
        };
    }

    return undefined;
};
