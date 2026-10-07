import { TriggerBlockContext } from '@apexdevtools/apex-parser';

import { BlockListTypeClass } from '../blockVisitor';

import {
    TriggerBlockMemberTypeClass,
    MemberVisitor,
    isTriggerBlockMemberType,
} from '../memberVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class TriggerBlockTypeClass extends BlockListTypeClass<TriggerBlockMemberTypeClass> {
    private constructor(value: (TriggerBlockMemberTypeClass | ErrorTypeClass)[]) {
        super('triggerBlock', value);
    }

    static create(ctx: TriggerBlockContext): TriggerBlockTypeClass {
        return new TriggerBlockTypeClass(
            isValidClassList(
                ctx.triggerBlockMember_list(),
                (ctx) => new MemberVisitor().visit(ctx),
                isTriggerBlockMemberType,
                'triggerBlock',
            ),
        );
    }
}

export const isTriggerBlockType = (target: CommonTypeClass): target is TriggerBlockTypeClass => {
    return target instanceof TriggerBlockTypeClass;
};

