import { isNullLiteralTypeAnnotation, type NullLiteralTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class NullLiteralTypeAnnotationTypeClass extends LwcCommonTypeClass<'nullLiteralTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('nullLiteralTypeAnnotation', originalSource);
    }

    static create(
        target: NullLiteralTypeAnnotation,
        originalSource: string,
    ): NullLiteralTypeAnnotationTypeClass {
        throw new Error(
            'NullLiteralTypeAnnotationTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const nullLiteralTypeAnnotationTypePair: EvaluatePair<
    NullLiteralTypeAnnotation,
    NullLiteralTypeAnnotationTypeClass
> = makeEvaluatePair(isNullLiteralTypeAnnotation, (target, originalSource) =>
    NullLiteralTypeAnnotationTypeClass.create(target, originalSource),
);

export const isNullLiteralTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is NullLiteralTypeAnnotationTypeClass =>
    target instanceof NullLiteralTypeAnnotationTypeClass;
