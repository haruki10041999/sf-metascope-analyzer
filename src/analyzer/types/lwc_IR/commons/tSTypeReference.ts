import { isTSTypeReference, type TSTypeReference } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSTypeReferenceTypeClass extends LwcCommonTypeClass<'tSTypeReference'> {
    private constructor(originalSource: string) {
        super('tSTypeReference', originalSource);
    }

    static create(target: TSTypeReference, originalSource: string): TSTypeReferenceTypeClass {
        throw new Error('TSTypeReferenceTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSTypeReferenceTypePair: EvaluatePair<TSTypeReference, TSTypeReferenceTypeClass> =
    makeEvaluatePair(isTSTypeReference, (target, originalSource) =>
        TSTypeReferenceTypeClass.create(target, originalSource),
    );

export const isTSTypeReferenceType = (
    target: LwcCommonTypeClass<string>,
): target is TSTypeReferenceTypeClass => target instanceof TSTypeReferenceTypeClass;
