import { AnonymousBlockContext } from '@apexdevtools/apex-parser';

import { MemberType, MemberVisitor } from '../memberVisitor';

export type AnonymousBlockType = {
    type: 'anonymousBlock';
    block: MemberType[];
};

export const makeAnonymousBlockType = (ctx: AnonymousBlockContext): AnonymousBlockType => {
    if (!ctx.anonymousBlockMember_list()) {
        throw new Error('値が異常です。AnonymousBlockContext: ' + ctx.getText());
    }

    const memberBlocks = ctx.anonymousBlockMember_list().map((anonymousBlockMemberCtx) => {
        const memberBlock = new MemberVisitor().visit(anonymousBlockMemberCtx);
        return memberBlock;
    });

    return {
        type: 'anonymousBlock',
        block: memberBlocks,
    };
};

