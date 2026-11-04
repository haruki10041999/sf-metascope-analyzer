import { isNumberLiteralTypeAnnotation, type NumberLiteralTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class NumberLiteralTypeAnnotationTypeClass extends LwcCommonTypeClass<'numberLiteralTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('numberLiteralTypeAnnotation', originalSource);
    }

    static create(
        target: NumberLiteralTypeAnnotation,
        originalSource: string,
    ): NumberLiteralTypeAnnotationTypeClass {
        throw new Error(
            'NumberLiteralTypeAnnotationTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const numberLiteralTypeAnnotationTypePair: EvaluatePair<
    NumberLiteralTypeAnnotation,
    NumberLiteralTypeAnnotationTypeClass
> = makeEvaluatePair(isNumberLiteralTypeAnnotation, (target, originalSource) =>
    NumberLiteralTypeAnnotationTypeClass.create(target, originalSource),
);

export const isNumberLiteralTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is NumberLiteralTypeAnnotationTypeClass =>
    target instanceof NumberLiteralTypeAnnotationTypeClass;
