import { isVoidTypeAnnotation, type VoidTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class VoidTypeAnnotationTypeClass extends LwcCommonTypeClass<'voidTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('voidTypeAnnotation', originalSource);
    }

    static create(target: VoidTypeAnnotation, originalSource: string): VoidTypeAnnotationTypeClass {
        throw new Error('VoidTypeAnnotationTypeClass.create is not implemented: ' + target.type);
    }
}

export const voidTypeAnnotationTypePair: EvaluatePair<
    VoidTypeAnnotation,
    VoidTypeAnnotationTypeClass
> = makeEvaluatePair(isVoidTypeAnnotation, (target, originalSource) =>
    VoidTypeAnnotationTypeClass.create(target, originalSource),
);

export const isVoidTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is VoidTypeAnnotationTypeClass => target instanceof VoidTypeAnnotationTypeClass;
