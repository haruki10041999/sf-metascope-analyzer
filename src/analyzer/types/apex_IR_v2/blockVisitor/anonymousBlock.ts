import { AnonymousBlockContext } from '@apexdevtools/apex-parser';

import { AnonymousBlockMemberTypeClass } from '../memberVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    isSpicifyApexCommonTypeClass,
    getSourceSpan,
} from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type AnonymousBlockType = TypeField<'anonymousBlock'> & {
    members: AnonymousBlockMemberTypeClass[];
};

export class AnonymousBlockTypeClass extends ApexCommonTypeClass<
    'anonymousBlock',
    AnonymousBlockType
> {
    private constructor(members: AnonymousBlockMemberTypeClass[], sourceSpan: SourceSpan) {
        super('anonymousBlock', { members: members }, sourceSpan);
    }

    static create(ctx: AnonymousBlockContext): AnonymousBlockTypeClass {
        return new AnonymousBlockTypeClass(
            ctx.anonymousBlockMember_list().map((m) => {
                return AnonymousBlockMemberTypeClass.create(m);
            }),
            getSourceSpan(ctx),
        );
    }
}

export const isAnonymousBlockType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is AnonymousBlockTypeClass => {
    return isSpicifyApexCommonTypeClass('anonymousBlock', target);
};
