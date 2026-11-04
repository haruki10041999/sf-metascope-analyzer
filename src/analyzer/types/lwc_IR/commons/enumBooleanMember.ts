import { isEnumBooleanMember, type EnumBooleanMember } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class EnumBooleanMemberTypeClass extends LwcCommonTypeClass<'enumBooleanMember'> {
    private constructor(originalSource: string) {
        super('enumBooleanMember', originalSource);
    }

    static create(target: EnumBooleanMember, originalSource: string): EnumBooleanMemberTypeClass {
        throw new Error('EnumBooleanMemberTypeClass.create is not implemented: ' + target.type);
    }
}

export const enumBooleanMemberTypePair: EvaluatePair<
    EnumBooleanMember,
    EnumBooleanMemberTypeClass
> = makeEvaluatePair(isEnumBooleanMember, (target, originalSource) =>
    EnumBooleanMemberTypeClass.create(target, originalSource),
);

export const isEnumBooleanMemberType = (
    target: LwcCommonTypeClass<string>,
): target is EnumBooleanMemberTypeClass => target instanceof EnumBooleanMemberTypeClass;
