import { isBigIntLiteralTypeAnnotation, type BigIntLiteralTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export type BigIntLiteralTypeAnnotationFields = {
    value: BigIntLiteralTypeAnnotation['value'];
};

export class BigIntLiteralTypeAnnotationTypeClass extends LwcCommonTypeClass<'bigIntLiteralTypeAnnotation'> {
    private readonly value: BigIntLiteralTypeAnnotationFields;

    private constructor(value: BigIntLiteralTypeAnnotationFields) {
        super('bigIntLiteralTypeAnnotation');
        this.value = value;
    }

    static create(
        target: BigIntLiteralTypeAnnotation,
        originalSource: string,
    ): BigIntLiteralTypeAnnotationTypeClass {
        return new BigIntLiteralTypeAnnotationTypeClass({
            value: target.value,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): BigIntLiteralTypeAnnotationFields {
        return this.value;
    }

    getValue(): BigIntLiteralTypeAnnotationFields['value'] {
        return this.value.value;
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
