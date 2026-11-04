import { isEnumDefaultedMember, type EnumDefaultedMember } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class EnumDefaultedMemberTypeClass extends LwcCommonTypeClass<'enumDefaultedMember'> {
    private constructor(originalSource: string) {
        super('enumDefaultedMember', originalSource);
    }

    static create(
        target: EnumDefaultedMember,
        originalSource: string,
    ): EnumDefaultedMemberTypeClass {
        throw new Error('EnumDefaultedMemberTypeClass.create is not implemented: ' + target.type);
    }
}

export const enumDefaultedMemberTypePair: EvaluatePair<
    EnumDefaultedMember,
    EnumDefaultedMemberTypeClass
> = makeEvaluatePair(isEnumDefaultedMember, (target, originalSource) =>
    EnumDefaultedMemberTypeClass.create(target, originalSource),
);

export const isEnumDefaultedMemberType = (
    target: LwcCommonTypeClass<string>,
): target is EnumDefaultedMemberTypeClass => target instanceof EnumDefaultedMemberTypeClass;
