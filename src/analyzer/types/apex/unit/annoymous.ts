import {
    AnonymousTriggerBlockMemberClass,
    isAnonymousTriggerMemberDeclarationClass,
    isNormalStatementClass,
} from '../converter';

import { RewriteQueries, QueryStore, extractQueries } from '../commons';
import { ModifierType, makeModifierType } from '../modifier';
import { StatementType, makeStatementType } from '../statement';
import { AnonymousTriggerMemberType, makeAnonymousTriggerMemberType } from '../declaration';

export type AnonymousUnitType = {
    fileType: 'anonymous';
    block: ({ modifier?: ModifierType } & RewriteQueries<
        AnonymousTriggerMemberType | StatementType
    >)[];
    soql?: QueryStore['soql'];
    sosl?: QueryStore['sosl'];
};

export const makeAnonymousUnitType = (
    anonymousUnit: AnonymousTriggerBlockMemberClass[],
): AnonymousUnitType | undefined => {
    const blocks: AnonymousUnitType['block'] = [];
    const queryStore: QueryStore = { soql: [], sosl: [] };

    anonymousUnit.forEach((b) => {
        const block = b.getValue();
        const modifier = makeModifierType(b.getModifier());

        if (isAnonymousTriggerMemberDeclarationClass(block)) {
            const member = makeAnonymousTriggerMemberType(block);
            if (member) {
                const field: AnonymousUnitType['block'][number] = {
                    ...extractQueries(member, queryStore),
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
                const field: AnonymousUnitType['block'][number] = {
                    ...extractQueries(member, queryStore),
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
            ...(queryStore.soql.length > 0 ? { soql: queryStore.soql } : {}),
            ...(queryStore.sosl.length > 0 ? { sosl: queryStore.sosl } : {}),
        };
    }

    return undefined;
};

