import { isNullableTypeAnnotation, type NullableTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class NullableTypeAnnotationTypeClass extends LwcCommonTypeClass<'nullableTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('nullableTypeAnnotation', originalSource);
    }

    static create(
        target: NullableTypeAnnotation,
        originalSource: string,
    ): NullableTypeAnnotationTypeClass {
        throw new Error(
            'NullableTypeAnnotationTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const nullableTypeAnnotationTypePair: EvaluatePair<
    NullableTypeAnnotation,
    NullableTypeAnnotationTypeClass
> = makeEvaluatePair(isNullableTypeAnnotation, (target, originalSource) =>
    NullableTypeAnnotationTypeClass.create(target, originalSource),
);

export const isNullableTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is NullableTypeAnnotationTypeClass => target instanceof NullableTypeAnnotationTypeClass;
