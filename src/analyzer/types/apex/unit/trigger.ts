import typia from 'typia';

import {
    TriggerUnitClass,
    TriggerCaseClass,
    isAnonymousTriggerMemberDeclarationClass,
    isNormalStatementClass,
} from '../converter';

import { RewriteQueries, QueryStore, extractQueries } from '../../../parser/Apex/extractor/commons';
import { ModifierType, makeModifierType } from '../modifier';
import { StatementType, makeStatementType } from '../statement';
import { AnonymousTriggerMemberType, makeAnonymousTriggerMemberType } from '../declaration';

type TriggerCaseType = {
    kind: string;
    timing: string;
};

export type TriggerUnitType = {
    fileType: 'trigger';
    name: string;
    object: string;
    triggerCase: TriggerCaseType[];
    block: ({ modifier?: ModifierType } & RewriteQueries<
        AnonymousTriggerMemberType | StatementType
    >)[];
    soql?: QueryStore['soql'];
    sosl?: QueryStore['sosl'];
};

export const isTriggerUnitType = typia.createIs<TriggerUnitType>();

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
    const queryStore: QueryStore = { soql: [], sosl: [] };

    if (value && value.length === 2 && triggerCaseType.length > 0 && triggerBlock.length > 0) {
        const blocks: TriggerUnitType['block'] = [];

        triggerBlock.forEach((b) => {
            const block = b.getValue();
            const modifier = makeModifierType(b.getModifier());

            if (isAnonymousTriggerMemberDeclarationClass(block)) {
                const member = makeAnonymousTriggerMemberType(block);
                if (member) {
                    const field: {
                        modifier?: ModifierType;
                    } & RewriteQueries<AnonymousTriggerMemberType> = {
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
                    const field: { modifier?: ModifierType } & RewriteQueries<StatementType> = {
                        ...extractQueries(member, queryStore),
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
            name: value.at(0)!,
            object: value.at(1)!,
            triggerCase: triggerCaseType,
            block: blocks,
            ...(queryStore.soql.length > 0 ? { soql: queryStore.soql } : {}),
            ...(queryStore.sosl.length > 0 ? { sosl: queryStore.sosl } : {}),
        };
    }

    return undefined;
};
