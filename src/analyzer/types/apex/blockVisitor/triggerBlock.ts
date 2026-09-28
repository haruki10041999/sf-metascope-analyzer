import { TriggerBlockContext } from '@apexdevtools/apex-parser';

import { MemberType, MemberVisitor } from '../memberVisitor';

export type TriggerBlockType = {
    type: 'triggerBlock';
    block: MemberType[];
};

export const makeTriggerBlockType = (ctx: TriggerBlockContext): TriggerBlockType => {
    const memberBlocks = ctx.triggerBlockMember_list().map((triggerBlockMemberCtx) => {
        const memberBlock = new MemberVisitor().visit(triggerBlockMemberCtx);
        return memberBlock;
    });

    return {
        type: 'triggerBlock',
        block: memberBlocks,
    };
};

