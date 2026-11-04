import { isStringLiteralTypeAnnotation, type StringLiteralTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class StringLiteralTypeAnnotationTypeClass extends LwcCommonTypeClass<'stringLiteralTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('stringLiteralTypeAnnotation', originalSource);
    }

    static create(
        target: StringLiteralTypeAnnotation,
        originalSource: string,
    ): StringLiteralTypeAnnotationTypeClass {
        throw new Error(
            'StringLiteralTypeAnnotationTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const stringLiteralTypeAnnotationTypePair: EvaluatePair<
    StringLiteralTypeAnnotation,
    StringLiteralTypeAnnotationTypeClass
> = makeEvaluatePair(isStringLiteralTypeAnnotation, (target, originalSource) =>
    StringLiteralTypeAnnotationTypeClass.create(target, originalSource),
);

export const isStringLiteralTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is StringLiteralTypeAnnotationTypeClass =>
    target instanceof StringLiteralTypeAnnotationTypeClass;
