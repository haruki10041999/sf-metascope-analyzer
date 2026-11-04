import { isTupleTypeAnnotation, type TupleTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TupleTypeAnnotationTypeClass extends LwcCommonTypeClass<'tupleTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('tupleTypeAnnotation', originalSource);
    }

    static create(
        target: TupleTypeAnnotation,
        originalSource: string,
    ): TupleTypeAnnotationTypeClass {
        throw new Error('TupleTypeAnnotationTypeClass.create is not implemented: ' + target.type);
    }
}

export const tupleTypeAnnotationTypePair: EvaluatePair<
    TupleTypeAnnotation,
    TupleTypeAnnotationTypeClass
> = makeEvaluatePair(isTupleTypeAnnotation, (target, originalSource) =>
    TupleTypeAnnotationTypeClass.create(target, originalSource),
);

export const isTupleTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is TupleTypeAnnotationTypeClass => target instanceof TupleTypeAnnotationTypeClass;
