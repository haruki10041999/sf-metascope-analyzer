import { AnonymousBlockContext } from '@apexdevtools/apex-parser';

import { BlockListTypeClass } from '../blockVisitor';

import {
    AnonymousBlockMemberTypeClass,
    MemberVisitor,
    isAnonymousBlockMemberType,
} from '../memberVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNodeList } from '../commonVisitor';

export class AnonymousBlockTypeClass extends BlockListTypeClass<
    'anonymousBlock',
    AnonymousBlockMemberTypeClass
> {
    private constructor(value: (AnonymousBlockMemberTypeClass | ApexErrorTypeClass)[]) {
        super('anonymousBlock', value);
    }

    static create(ctx: AnonymousBlockContext): AnonymousBlockTypeClass {
        return new AnonymousBlockTypeClass(
            visitNodeList(
                new MemberVisitor(),
                ctx.anonymousBlockMember_list(),
                isAnonymousBlockMemberType,
                'anonymousBlock',
            ),
        );
    }
}

export const isAnonymousBlockType = (
    target: ApexCommonTypeClass<string>,
): target is AnonymousBlockTypeClass => {
    return target instanceof AnonymousBlockTypeClass;
};
