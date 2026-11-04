import { isBooleanLiteralTypeAnnotation, type BooleanLiteralTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class BooleanLiteralTypeAnnotationTypeClass extends LwcCommonTypeClass<'booleanLiteralTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('booleanLiteralTypeAnnotation', originalSource);
    }

    static create(
        target: BooleanLiteralTypeAnnotation,
        originalSource: string,
    ): BooleanLiteralTypeAnnotationTypeClass {
        throw new Error(
            'BooleanLiteralTypeAnnotationTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const booleanLiteralTypeAnnotationTypePair: EvaluatePair<
    BooleanLiteralTypeAnnotation,
    BooleanLiteralTypeAnnotationTypeClass
> = makeEvaluatePair(isBooleanLiteralTypeAnnotation, (target, originalSource) =>
    BooleanLiteralTypeAnnotationTypeClass.create(target, originalSource),
);

export const isBooleanLiteralTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is BooleanLiteralTypeAnnotationTypeClass =>
    target instanceof BooleanLiteralTypeAnnotationTypeClass;
