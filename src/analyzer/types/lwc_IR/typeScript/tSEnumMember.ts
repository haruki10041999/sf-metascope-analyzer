import { isTSEnumMember, type TSEnumMember } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSEnumMemberTypeClass extends LwcCommonTypeClass<'tSEnumMember'> {
    private constructor(originalSource: string) {
        super('tSEnumMember', originalSource);
    }

    static create(target: TSEnumMember, originalSource: string): TSEnumMemberTypeClass {
        throw new Error('TSEnumMemberTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSEnumMemberTypePair: EvaluatePair<TSEnumMember, TSEnumMemberTypeClass> =
    makeEvaluatePair(isTSEnumMember, (target, originalSource) =>
        TSEnumMemberTypeClass.create(target, originalSource),
    );

export const isTSEnumMemberType = (
    target: LwcCommonTypeClass<string>,
): target is TSEnumMemberTypeClass => target instanceof TSEnumMemberTypeClass;
