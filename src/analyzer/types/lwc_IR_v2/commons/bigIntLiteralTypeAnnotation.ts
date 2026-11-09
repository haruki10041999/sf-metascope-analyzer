import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isBigIntLiteralTypeAnnotation, type BigIntLiteralTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type BigIntLiteralTypeAnnotationFields = TypeField<'bigIntLiteralTypeAnnotation'> & {
    value: BigIntLiteralTypeAnnotation['value'];
};

export class BigIntLiteralTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'bigIntLiteralTypeAnnotation',
    BigIntLiteralTypeAnnotationFields
> {
    private constructor(
        value: FieldsOf<BigIntLiteralTypeAnnotationFields>,
        sourceSpan: SourceSpan,
    ) {
        super('bigIntLiteralTypeAnnotation', value, sourceSpan);
    }

    static create(
        target: BigIntLiteralTypeAnnotation,
        originalSource: string,
    ): BigIntLiteralTypeAnnotationTypeClass {
        return new BigIntLiteralTypeAnnotationTypeClass(
            {
                value: target.value,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getValue(): BigIntLiteralTypeAnnotationFields['value'] {
        return this.getFields().value;
    }
}

export const bigIntLiteralTypeAnnotationTypePair: EvaluatePair<
    BigIntLiteralTypeAnnotation,
    BigIntLiteralTypeAnnotationTypeClass
> = makeEvaluatePair(isBigIntLiteralTypeAnnotation, (target, originalSource) =>
    BigIntLiteralTypeAnnotationTypeClass.create(target, originalSource),
);

export const isBigIntLiteralTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is BigIntLiteralTypeAnnotationTypeClass =>
    target instanceof BigIntLiteralTypeAnnotationTypeClass;
