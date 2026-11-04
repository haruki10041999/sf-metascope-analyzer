import { AnonymousBlockContext } from '@apexdevtools/apex-parser';

import { BlockListTypeClass } from '../blockVisitor';

import {
    AnonymousBlockMemberTypeClass,
    MemberVisitor,
    isAnonymousBlockMemberType,
} from '../memberVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClassList } from '../commonVisitor';

export class AnonymousBlockTypeClass extends BlockListTypeClass<
    'anonymousBlock',
    AnonymousBlockMemberTypeClass
> {
    private constructor(value: (AnonymousBlockMemberTypeClass | ApexErrorTypeClass)[]) {
        super('anonymousBlock', value);
    }

    static create(ctx: AnonymousBlockContext): AnonymousBlockTypeClass {
        return new AnonymousBlockTypeClass(
            isApexValidClassList(
                ctx.anonymousBlockMember_list(),
                (ctx) => new MemberVisitor().visit(ctx),
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

