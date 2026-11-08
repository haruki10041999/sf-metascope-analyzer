import { isEnumNumberBody, type EnumNumberBody } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import { enumNumberMemberTypePair, type EnumNumberMemberTypeClass } from './enumNumberMember';

const enumNumberBodyMembersPairs = lazyPairs(() => [enumNumberMemberTypePair] as const);

export type EnumNumberBodyFields = {
    explicitType: EnumNumberBody['explicitType'];
    hasUnknownMembers: EnumNumberBody['hasUnknownMembers'];
    members: (EnumNumberMemberTypeClass | LwcErrorTypeClass)[];
};

export class EnumNumberBodyTypeClass extends LwcCommonTypeClass<'enumNumberBody'> {
    private readonly value: EnumNumberBodyFields;

    private constructor(value: EnumNumberBodyFields) {
        super('enumNumberBody');
        this.value = value;
    }

    static create(target: EnumNumberBody, originalSource: string): EnumNumberBodyTypeClass {
        return new EnumNumberBodyTypeClass({
            explicitType: target.explicitType,
            hasUnknownMembers: target.hasUnknownMembers,
            members: visitNodeList(
                target.members,
                originalSource,
                enumNumberBodyMembersPairs(),
                'EnumNumberBody.members',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): EnumNumberBodyFields {
        return this.value;
    }

    getExplicitType(): EnumNumberBodyFields['explicitType'] {
        return this.value.explicitType;
    }

    getHasUnknownMembers(): EnumNumberBodyFields['hasUnknownMembers'] {
        return this.value.hasUnknownMembers;
    }

    getMembers(): EnumNumberBodyFields['members'] {
        return this.value.members;
    }
}

export const enumNumberBodyTypePair: EvaluatePair<EnumNumberBody, EnumNumberBodyTypeClass> =
    makeEvaluatePair(isEnumNumberBody, (target, originalSource) =>
        EnumNumberBodyTypeClass.create(target, originalSource),
    );

export const isEnumNumberBodyType = (
    target: LwcCommonTypeClass<string>,
): target is EnumNumberBodyTypeClass => target instanceof EnumNumberBodyTypeClass;
