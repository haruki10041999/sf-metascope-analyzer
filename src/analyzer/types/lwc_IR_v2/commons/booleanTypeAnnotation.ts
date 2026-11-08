import { isBooleanTypeAnnotation, type BooleanTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class BooleanTypeAnnotationTypeClass extends LwcCommonTypeClass<'booleanTypeAnnotation'> {
    private constructor() {
        super('booleanTypeAnnotation');
    }

    static create(
        _target: BooleanTypeAnnotation,
        _originalSource: string,
    ): BooleanTypeAnnotationTypeClass {
        return new BooleanTypeAnnotationTypeClass();
    }
}

export const booleanTypeAnnotationTypePair: EvaluatePair<
    BooleanTypeAnnotation,
    BooleanTypeAnnotationTypeClass
> = makeEvaluatePair(isBooleanTypeAnnotation, (target, originalSource) =>
    BooleanTypeAnnotationTypeClass.create(target, originalSource),
);

export const isBooleanTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is BooleanTypeAnnotationTypeClass => target instanceof BooleanTypeAnnotationTypeClass;
