import { isBigIntLiteralTypeAnnotation, type BigIntLiteralTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class BigIntLiteralTypeAnnotationTypeClass extends LwcCommonTypeClass<'bigIntLiteralTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('bigIntLiteralTypeAnnotation', originalSource);
    }

    static create(
        target: BigIntLiteralTypeAnnotation,
        originalSource: string,
    ): BigIntLiteralTypeAnnotationTypeClass {
        throw new Error(
            'BigIntLiteralTypeAnnotationTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const bigIntLiteralTypeAnnotationTypePair: EvaluatePair<
    BigIntLiteralTypeAnnotation,
    BigIntLiteralTypeAnnotationTypeClass
> = makeEvaluatePair(isBigIntLiteralTypeAnnotation, (target, originalSource) =>
    BigIntLiteralTypeAnnotationTypeClass.create(target, originalSource),
);

export const isBigIntLiteralTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is BigIntLiteralTypeAnnotationTypeClass =>
    target instanceof BigIntLiteralTypeAnnotationTypeClass;
