import { isNumberTypeAnnotation, type NumberTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class NumberTypeAnnotationTypeClass extends LwcCommonTypeClass<'numberTypeAnnotation'> {
    private constructor() {
        super('numberTypeAnnotation');
    }

    static create(
        _target: NumberTypeAnnotation,
        _originalSource: string,
    ): NumberTypeAnnotationTypeClass {
        return new NumberTypeAnnotationTypeClass();
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
