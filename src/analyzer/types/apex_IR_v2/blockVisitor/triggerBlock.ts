import { TriggerBlockContext } from '@apexdevtools/apex-parser';

import {
    TriggerBlockMemberTypeClass,
    MemberVisitor,
    isTriggerBlockMemberType,
} from '../memberVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type TriggerBlockType = TypeField<'triggerBlock'> & {
    member: TriggerBlockMemberTypeClass[];
};

export class TriggerBlockTypeClass extends ApexCommonTypeClass<'triggerBlock', TriggerBlockType> {
    private constructor(member: TriggerBlockMemberTypeClass[], sourceSpan: SourceSpan) {
        super('triggerBlock', { member: member }, sourceSpan);
    }

    static create(ctx: TriggerBlockContext): TriggerBlockTypeClass {
        return new TriggerBlockTypeClass(
            ctx.triggerBlockMember_list().map((m) => TriggerBlockMemberTypeClass.create(m)),
            getSourceSpan(ctx),
        );
    }
}

export const isTriggerBlockType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is TriggerBlockTypeClass => {
    return isSpicifyApexCommonTypeClass('triggerBlock', target);
};
