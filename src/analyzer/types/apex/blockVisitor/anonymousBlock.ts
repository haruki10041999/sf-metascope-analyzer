import { AnonymousBlockContext } from '@apexdevtools/apex-parser';

import { MemberType, MemberVisitor } from '../memberVisitor';

export type AnonymousBlockType = {
    type: 'anonymousBlock';
    memberBlocks: Omit<MemberType, 'type'>[];
};

export const makeAnonymousBlockType = (ctx: AnonymousBlockContext): AnonymousBlockType => {
    const memberBlocks = ctx.anonymousBlockMember_list().map((anonymousBlockMemberCtx) => {
        const { type, ...memberBlock } = new MemberVisitor().visit(anonymousBlockMemberCtx);
        return memberBlock;
    });

    return {
        type: 'anonymousBlock',
        memberBlocks: memberBlocks,
    };
};
