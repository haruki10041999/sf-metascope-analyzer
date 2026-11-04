import { isBooleanTypeAnnotation, type BooleanTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class BooleanTypeAnnotationTypeClass extends LwcCommonTypeClass<'booleanTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('booleanTypeAnnotation', originalSource);
    }

    static create(
        target: BooleanTypeAnnotation,
        originalSource: string,
    ): BooleanTypeAnnotationTypeClass {
        throw new Error('BooleanTypeAnnotationTypeClass.create is not implemented: ' + target.type);
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
