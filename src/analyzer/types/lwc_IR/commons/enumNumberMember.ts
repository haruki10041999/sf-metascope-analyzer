import { isEnumNumberMember, type EnumNumberMember } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class EnumNumberMemberTypeClass extends LwcCommonTypeClass<'enumNumberMember'> {
    private constructor(originalSource: string) {
        super('enumNumberMember', originalSource);
    }

    static create(target: EnumNumberMember, originalSource: string): EnumNumberMemberTypeClass {
        throw new Error('EnumNumberMemberTypeClass.create is not implemented: ' + target.type);
    }
}

export const enumNumberMemberTypePair: EvaluatePair<EnumNumberMember, EnumNumberMemberTypeClass> =
    makeEvaluatePair(isEnumNumberMember, (target, originalSource) =>
        EnumNumberMemberTypeClass.create(target, originalSource),
    );

export const isEnumNumberMemberType = (
    target: LwcCommonTypeClass<string>,
): target is EnumNumberMemberTypeClass => target instanceof EnumNumberMemberTypeClass;
