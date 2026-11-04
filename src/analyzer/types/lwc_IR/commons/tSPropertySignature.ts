import { isTSPropertySignature, type TSPropertySignature } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSPropertySignatureTypeClass extends LwcCommonTypeClass<'tSPropertySignature'> {
    private constructor(originalSource: string) {
        super('tSPropertySignature', originalSource);
    }

    static create(
        target: TSPropertySignature,
        originalSource: string,
    ): TSPropertySignatureTypeClass {
        throw new Error('TSPropertySignatureTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSPropertySignatureTypePair: EvaluatePair<
    TSPropertySignature,
    TSPropertySignatureTypeClass
> = makeEvaluatePair(isTSPropertySignature, (target, originalSource) =>
    TSPropertySignatureTypeClass.create(target, originalSource),
);

export const isTSPropertySignatureType = (
    target: LwcCommonTypeClass<string>,
): target is TSPropertySignatureTypeClass => target instanceof TSPropertySignatureTypeClass;
