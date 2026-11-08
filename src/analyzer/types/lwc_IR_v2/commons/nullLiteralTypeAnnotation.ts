import { isNullLiteralTypeAnnotation, type NullLiteralTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class NullLiteralTypeAnnotationTypeClass extends LwcCommonTypeClass<'nullLiteralTypeAnnotation'> {
    private constructor() {
        super('nullLiteralTypeAnnotation');
    }

    static create(
        _target: NullLiteralTypeAnnotation,
        _originalSource: string,
    ): NullLiteralTypeAnnotationTypeClass {
        return new NullLiteralTypeAnnotationTypeClass();
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
