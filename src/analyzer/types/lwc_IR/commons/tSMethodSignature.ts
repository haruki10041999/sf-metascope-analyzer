import { isTSMethodSignature, type TSMethodSignature } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSMethodSignatureTypeClass extends LwcCommonTypeClass<'tSMethodSignature'> {
    private constructor(originalSource: string) {
        super('tSMethodSignature', originalSource);
    }

    static create(target: TSMethodSignature, originalSource: string): TSMethodSignatureTypeClass {
        throw new Error('TSMethodSignatureTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSMethodSignatureTypePair: EvaluatePair<
    TSMethodSignature,
    TSMethodSignatureTypeClass
> = makeEvaluatePair(isTSMethodSignature, (target, originalSource) =>
    TSMethodSignatureTypeClass.create(target, originalSource),
);

export const isTSMethodSignatureType = (
    target: LwcCommonTypeClass<string>,
): target is TSMethodSignatureTypeClass => target instanceof TSMethodSignatureTypeClass;
