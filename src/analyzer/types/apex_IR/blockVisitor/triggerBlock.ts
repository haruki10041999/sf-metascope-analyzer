import { TriggerBlockContext } from '@apexdevtools/apex-parser';

import { BlockListTypeClass } from '../blockVisitor';

import {
    TriggerBlockMemberTypeClass,
    MemberVisitor,
    isTriggerBlockMemberType,
} from '../memberVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClassList } from '../commonVisitor';

export class TriggerBlockTypeClass extends BlockListTypeClass<
    'triggerBlock',
    TriggerBlockMemberTypeClass
> {
    private constructor(value: (TriggerBlockMemberTypeClass | ApexErrorTypeClass)[]) {
        super('triggerBlock', value);
    }

    static create(ctx: TriggerBlockContext): TriggerBlockTypeClass {
        return new TriggerBlockTypeClass(
            isApexValidClassList(
                ctx.triggerBlockMember_list(),
                (ctx) => new MemberVisitor().visit(ctx),
                isTriggerBlockMemberType,
                'triggerBlock',
            ),
        );
    }
}

export const isTriggerBlockType = (
    target: ApexCommonTypeClass<string>,
): target is TriggerBlockTypeClass => {
    return target instanceof TriggerBlockTypeClass;
};

