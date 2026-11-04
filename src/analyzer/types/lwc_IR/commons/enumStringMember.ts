import { isEnumStringMember, type EnumStringMember } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class EnumStringMemberTypeClass extends LwcCommonTypeClass<'enumStringMember'> {
    private constructor(originalSource: string) {
        super('enumStringMember', originalSource);
    }

    static create(target: EnumStringMember, originalSource: string): EnumStringMemberTypeClass {
        throw new Error('EnumStringMemberTypeClass.create is not implemented: ' + target.type);
    }
}

export const enumStringMemberTypePair: EvaluatePair<EnumStringMember, EnumStringMemberTypeClass> =
    makeEvaluatePair(isEnumStringMember, (target, originalSource) =>
        EnumStringMemberTypeClass.create(target, originalSource),
    );

export const isEnumStringMemberType = (
    target: LwcCommonTypeClass<string>,
): target is EnumStringMemberTypeClass => target instanceof EnumStringMemberTypeClass;
