import { isTSIndexSignature, type TSIndexSignature } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSIndexSignatureTypeClass extends LwcCommonTypeClass<'tSIndexSignature'> {
    private constructor(originalSource: string) {
        super('tSIndexSignature', originalSource);
    }

    static create(target: TSIndexSignature, originalSource: string): TSIndexSignatureTypeClass {
        throw new Error('TSIndexSignatureTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSIndexSignatureTypePair: EvaluatePair<TSIndexSignature, TSIndexSignatureTypeClass> =
    makeEvaluatePair(isTSIndexSignature, (target, originalSource) =>
        TSIndexSignatureTypeClass.create(target, originalSource),
    );

export const isTSIndexSignatureType = (
    target: LwcCommonTypeClass<string>,
): target is TSIndexSignatureTypeClass => target instanceof TSIndexSignatureTypeClass;
