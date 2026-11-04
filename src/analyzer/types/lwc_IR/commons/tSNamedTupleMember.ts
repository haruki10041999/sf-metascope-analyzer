import { isTSNamedTupleMember, type TSNamedTupleMember } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSNamedTupleMemberTypeClass extends LwcCommonTypeClass<'tSNamedTupleMember'> {
    private constructor(originalSource: string) {
        super('tSNamedTupleMember', originalSource);
    }

    static create(target: TSNamedTupleMember, originalSource: string): TSNamedTupleMemberTypeClass {
        throw new Error('TSNamedTupleMemberTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSNamedTupleMemberTypePair: EvaluatePair<
    TSNamedTupleMember,
    TSNamedTupleMemberTypeClass
> = makeEvaluatePair(isTSNamedTupleMember, (target, originalSource) =>
    TSNamedTupleMemberTypeClass.create(target, originalSource),
);

export const isTSNamedTupleMemberType = (
    target: LwcCommonTypeClass<string>,
): target is TSNamedTupleMemberTypeClass => target instanceof TSNamedTupleMemberTypeClass;
