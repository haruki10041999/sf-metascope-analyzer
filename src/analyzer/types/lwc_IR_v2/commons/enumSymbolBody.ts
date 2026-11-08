import { isEnumSymbolBody, type EnumSymbolBody } from '@babel/types';
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

const enumSymbolBodyMembersPairs = lazyPairs(() => [enumDefaultedMemberTypePair] as const);

export type EnumSymbolBodyFields = {
    members: (EnumDefaultedMemberTypeClass | LwcErrorTypeClass)[];
    hasUnknownMembers: EnumSymbolBody['hasUnknownMembers'];
};

export class EnumSymbolBodyTypeClass extends LwcCommonTypeClass<'enumSymbolBody'> {
    private readonly value: EnumSymbolBodyFields;

    private constructor(value: EnumSymbolBodyFields) {
        super('enumSymbolBody');
        this.value = value;
    }

    static create(target: EnumSymbolBody, originalSource: string): EnumSymbolBodyTypeClass {
        return new EnumSymbolBodyTypeClass({
            members: visitNodeList(
                target.members,
                originalSource,
                enumSymbolBodyMembersPairs(),
                'EnumSymbolBody.members',
            ),
            hasUnknownMembers: target.hasUnknownMembers,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): EnumSymbolBodyFields {
        return this.value;
    }

    getMembers(): EnumSymbolBodyFields['members'] {
        return this.value.members;
    }

    getHasUnknownMembers(): EnumSymbolBodyFields['hasUnknownMembers'] {
        return this.value.hasUnknownMembers;
    }
}

export const enumSymbolBodyTypePair: EvaluatePair<EnumSymbolBody, EnumSymbolBodyTypeClass> =
    makeEvaluatePair(isEnumSymbolBody, (target, originalSource) =>
        EnumSymbolBodyTypeClass.create(target, originalSource),
    );

export const isEnumSymbolBodyType = (
    target: LwcCommonTypeClass<string>,
): target is EnumSymbolBodyTypeClass => target instanceof EnumSymbolBodyTypeClass;
