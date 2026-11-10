import { UsingScopeContext } from '@apexdevtools/apex-parser';

import { SoqlIdTypeClass } from '../idVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

/** USING SCOPE で使える値 (小文字にそろえる) */
export const USING_SCOPE_VALUES = [
    'delegated',
    'everything',
    'mine',
    'mine_and_my_groups',
    'my_territory',
    'my_team_territory',
    'team',
] as const;

export type UsingScopeValue = (typeof USING_SCOPE_VALUES)[number];

const toUsingScopeValue = (text: string): UsingScopeValue | null => {
    const lower = text.toLowerCase();
    return (USING_SCOPE_VALUES as readonly string[]).includes(lower)
        ? (lower as UsingScopeValue)
        : null;
};

/** 決まった値 (scope) と、知らない値 (unknown。soqlId のまま残す) */
export type UsingScopeType = TypeField<'usingScope'> &
    ({ kind: 'scope'; scope: UsingScopeValue } | { kind: 'unknown'; value: SoqlIdTypeClass });

export class UsingScopeTypeClass extends ApexCommonTypeClass<'usingScope', UsingScopeType> {
    private constructor(fields: FieldsOf<UsingScopeType>, sourceSpan: SourceSpan) {
        super('usingScope', fields, sourceSpan);
    }

    static create(ctx: UsingScopeContext): UsingScopeTypeClass {
        const scope = ctx.soqlId() ? toUsingScopeValue(ctx.soqlId().getText()) : null;
        return new UsingScopeTypeClass(
            scope
                ? { kind: 'scope', scope }
                : {
                      kind: 'unknown',
                      value: createNode(ctx.soqlId(), (c) => SoqlIdTypeClass.create(c), 'soqlId'),
                  },
            getSourceSpan(ctx),
        );
    }

    getKind(): UsingScopeType['kind'] {
        return this.getFields().kind;
    }
}

export const isUsingScopeType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is UsingScopeTypeClass => {
    return isSpicifyApexCommonTypeClass('usingScope', target);
};
