import { isTSTypeAnnotation, type TSTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSTypeAnnotationTypeClass extends LwcCommonTypeClass<'tSTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('tSTypeAnnotation', originalSource);
    }

    static create(target: TSTypeAnnotation, originalSource: string): TSTypeAnnotationTypeClass {
        throw new Error('TSTypeAnnotationTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSTypeAnnotationTypePair: EvaluatePair<TSTypeAnnotation, TSTypeAnnotationTypeClass> =
    makeEvaluatePair(isTSTypeAnnotation, (target, originalSource) =>
        TSTypeAnnotationTypeClass.create(target, originalSource),
    );

export const isTSTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is TSTypeAnnotationTypeClass => target instanceof TSTypeAnnotationTypeClass;
