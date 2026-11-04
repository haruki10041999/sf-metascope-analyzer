import { isNumberTypeAnnotation, type NumberTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class NumberTypeAnnotationTypeClass extends LwcCommonTypeClass<'numberTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('numberTypeAnnotation', originalSource);
    }

    static create(
        target: NumberTypeAnnotation,
        originalSource: string,
    ): NumberTypeAnnotationTypeClass {
        throw new Error('NumberTypeAnnotationTypeClass.create is not implemented: ' + target.type);
    }
}

export const numberTypeAnnotationTypePair: EvaluatePair<
    NumberTypeAnnotation,
    NumberTypeAnnotationTypeClass
> = makeEvaluatePair(isNumberTypeAnnotation, (target, originalSource) =>
    NumberTypeAnnotationTypeClass.create(target, originalSource),
);

export const isNumberTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is NumberTypeAnnotationTypeClass => target instanceof NumberTypeAnnotationTypeClass;
