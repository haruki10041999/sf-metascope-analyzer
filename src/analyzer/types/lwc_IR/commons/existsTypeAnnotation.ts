import { isExistsTypeAnnotation, type ExistsTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ExistsTypeAnnotationTypeClass extends LwcCommonTypeClass<'existsTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('existsTypeAnnotation', originalSource);
    }

    static create(
        target: ExistsTypeAnnotation,
        originalSource: string,
    ): ExistsTypeAnnotationTypeClass {
        throw new Error('ExistsTypeAnnotationTypeClass.create is not implemented: ' + target.type);
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
