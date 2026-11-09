import { TriggerBlockContext } from '@apexdevtools/apex-parser';

import { TriggerBlockMemberTypeClass } from '../memberVisitor';
import {
    ApexCommonTypeClass,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type TriggerBlockType = TypeField<'triggerBlock'> & {
    member: TriggerBlockMemberTypeClass[];
};

export class TriggerBlockTypeClass extends ApexCommonTypeClass<'triggerBlock', TriggerBlockType> {
    private constructor(fields: FieldsOf<TriggerBlockType>, sourceSpan: SourceSpan) {
        super('triggerBlock', fields, sourceSpan);
    }

    static create(ctx: TriggerBlockContext): TriggerBlockTypeClass {
        return new TriggerBlockTypeClass(
            {
                member: createNodeList(
                    ctx.triggerBlockMember_list(),
                    (c) => TriggerBlockMemberTypeClass.create(c),
                    'triggerBlockMember',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getMember(): TriggerBlockType['member'] {
        return this.getFields().member;
    }
}

export const isTriggerBlockType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is TriggerBlockTypeClass => {
    return isSpicifyApexCommonTypeClass('triggerBlock', target);
};
