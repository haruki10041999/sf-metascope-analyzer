import { isVoidTypeAnnotation, type VoidTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class VoidTypeAnnotationTypeClass extends LwcCommonTypeClass<'voidTypeAnnotation'> {
    private constructor() {
        super('voidTypeAnnotation');
    }

    static create(
        _target: VoidTypeAnnotation,
        _originalSource: string,
    ): VoidTypeAnnotationTypeClass {
        return new VoidTypeAnnotationTypeClass();
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
