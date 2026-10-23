import { AnonymousBlockContext } from '@apexdevtools/apex-parser';

import { BlockListTypeClass } from '../blockVisitor';

import {
    AnonymousBlockMemberTypeClass,
    MemberVisitor,
    isAnonymousBlockMemberType,
} from '../memberVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class AnonymousBlockTypeClass extends BlockListTypeClass<
    'anonymousBlock',
    AnonymousBlockMemberTypeClass
> {
    private constructor(value: (AnonymousBlockMemberTypeClass | ErrorTypeClass)[]) {
        super('anonymousBlock', value);
    }

    static create(ctx: AnonymousBlockContext): AnonymousBlockTypeClass {
        return new AnonymousBlockTypeClass(
            isValidClassList(
                ctx.anonymousBlockMember_list(),
                (ctx) => new MemberVisitor().visit(ctx),
                isAnonymousBlockMemberType,
                'anonymousBlock',
            ),
        );
    }
}

export const isAnonymousBlockType = (
    target: CommonTypeClass<string>,
): target is AnonymousBlockTypeClass => {
    return target instanceof AnonymousBlockTypeClass;
};
