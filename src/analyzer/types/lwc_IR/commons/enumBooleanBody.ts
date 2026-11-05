import { isEnumBooleanBody, type EnumBooleanBody } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import { enumBooleanMemberTypePair, type EnumBooleanMemberTypeClass } from './enumBooleanMember';

const enumBooleanBodyMembersPairs = lazyPairs(() => [enumBooleanMemberTypePair] as const);

export type EnumBooleanBodyFields = {
    explicitType: EnumBooleanBody['explicitType'];
    hasUnknownMembers: EnumBooleanBody['hasUnknownMembers'];
    members: (EnumBooleanMemberTypeClass | LwcErrorTypeClass)[];
};

export class EnumBooleanBodyTypeClass extends LwcCommonTypeClass<'enumBooleanBody'> {
    private readonly value: EnumBooleanBodyFields;

    private constructor(value: EnumBooleanBodyFields) {
        super('enumBooleanBody');
        this.value = value;
    }

    static create(target: EnumBooleanBody, originalSource: string): EnumBooleanBodyTypeClass {
        return new EnumBooleanBodyTypeClass({
            explicitType: target.explicitType,
            hasUnknownMembers: target.hasUnknownMembers,
            members: visitNodeList(
                target.members,
                originalSource,
                enumBooleanBodyMembersPairs(),
                'EnumBooleanBody.members',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): EnumBooleanBodyFields {
        return this.value;
    }

    getExplicitType(): EnumBooleanBodyFields['explicitType'] {
        return this.value.explicitType;
    }

    getHasUnknownMembers(): EnumBooleanBodyFields['hasUnknownMembers'] {
        return this.value.hasUnknownMembers;
    }

    getMembers(): EnumBooleanBodyFields['members'] {
        return this.value.members;
    }
}

export const enumBooleanBodyTypePair: EvaluatePair<EnumBooleanBody, EnumBooleanBodyTypeClass> =
    makeEvaluatePair(isEnumBooleanBody, (target, originalSource) =>
        EnumBooleanBodyTypeClass.create(target, originalSource),
    );

export const isEnumBooleanBodyType = (
    target: LwcCommonTypeClass<string>,
): target is EnumBooleanBodyTypeClass => target instanceof EnumBooleanBodyTypeClass;
