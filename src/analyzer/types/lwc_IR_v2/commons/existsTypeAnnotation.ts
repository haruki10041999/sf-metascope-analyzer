import { isExistsTypeAnnotation, type ExistsTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ExistsTypeAnnotationTypeClass extends LwcCommonTypeClass<'existsTypeAnnotation'> {
    private constructor() {
        super('existsTypeAnnotation');
    }

    static create(
        _target: ExistsTypeAnnotation,
        _originalSource: string,
    ): ExistsTypeAnnotationTypeClass {
        return new ExistsTypeAnnotationTypeClass();
    }
}

export const existsTypeAnnotationTypePair: EvaluatePair<
    ExistsTypeAnnotation,
    ExistsTypeAnnotationTypeClass
> = makeEvaluatePair(isExistsTypeAnnotation, (target, originalSource) =>
    ExistsTypeAnnotationTypeClass.create(target, originalSource),
);

export const isExistsTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is ExistsTypeAnnotationTypeClass => target instanceof ExistsTypeAnnotationTypeClass;
