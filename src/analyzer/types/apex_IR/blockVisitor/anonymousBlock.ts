import { AnonymousBlockContext } from '@apexdevtools/apex-parser';

import { AnonymousBlockMemberTypeClass } from '../memberVisitor';
import {
    ApexCommonTypeClass,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type AnonymousBlockType = TypeField<'anonymousBlock'> & {
    members: AnonymousBlockMemberTypeClass[];
};

export class AnonymousBlockTypeClass extends ApexCommonTypeClass<
    'anonymousBlock',
    AnonymousBlockType
> {
    private constructor(fields: FieldsOf<AnonymousBlockType>, sourceSpan: SourceSpan) {
        super('anonymousBlock', fields, sourceSpan);
    }

    static create(ctx: AnonymousBlockContext): AnonymousBlockTypeClass {
        return new AnonymousBlockTypeClass(
            {
                members: createNodeList(
                    ctx.anonymousBlockMember_list(),
                    (c) => AnonymousBlockMemberTypeClass.create(c),
                    'anonymousBlockMember',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getMembers(): AnonymousBlockType['members'] {
        return this.getFields().members;
    }
}

export const isAnonymousBlockType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is AnonymousBlockTypeClass => {
    return isSpicifyApexCommonTypeClass('anonymousBlock', target);
};
