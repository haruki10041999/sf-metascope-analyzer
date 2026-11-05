import { isEnumStringBody, type EnumStringBody } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import {
    enumDefaultedMemberTypePair,
    type EnumDefaultedMemberTypeClass,
} from './enumDefaultedMember';
import { enumStringMemberTypePair, type EnumStringMemberTypeClass } from './enumStringMember';

const enumStringBodyMembersPairs = lazyPairs(
    () => [enumStringMemberTypePair, enumDefaultedMemberTypePair] as const,
);

export type EnumStringBodyFields = {
    explicitType: EnumStringBody['explicitType'];
    hasUnknownMembers: EnumStringBody['hasUnknownMembers'];
    members: (EnumStringMemberTypeClass | EnumDefaultedMemberTypeClass | LwcErrorTypeClass)[];
};

export class EnumStringBodyTypeClass extends LwcCommonTypeClass<'enumStringBody'> {
    private readonly value: EnumStringBodyFields;

    private constructor(value: EnumStringBodyFields) {
        super('enumStringBody');
        this.value = value;
    }

    static create(target: EnumStringBody, originalSource: string): EnumStringBodyTypeClass {
        return new EnumStringBodyTypeClass({
            explicitType: target.explicitType,
            hasUnknownMembers: target.hasUnknownMembers,
            members: visitNodeList(
                target.members,
                originalSource,
                enumStringBodyMembersPairs(),
                'EnumStringBody.members',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): EnumStringBodyFields {
        return this.value;
    }

    getExplicitType(): EnumStringBodyFields['explicitType'] {
        return this.value.explicitType;
    }

    getHasUnknownMembers(): EnumStringBodyFields['hasUnknownMembers'] {
        return this.value.hasUnknownMembers;
    }

    getMembers(): EnumStringBodyFields['members'] {
        return this.value.members;
    }
}

export const enumStringBodyTypePair: EvaluatePair<EnumStringBody, EnumStringBodyTypeClass> =
    makeEvaluatePair(isEnumStringBody, (target, originalSource) =>
        EnumStringBodyTypeClass.create(target, originalSource),
    );

export const isEnumStringBodyType = (
    target: LwcCommonTypeClass<string>,
): target is EnumStringBodyTypeClass => target instanceof EnumStringBodyTypeClass;
