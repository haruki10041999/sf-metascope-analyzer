import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isNumberLiteralTypeAnnotation, type NumberLiteralTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type NumberLiteralTypeAnnotationFields = TypeField<'numberLiteralTypeAnnotation'> & {
    value: NumberLiteralTypeAnnotation['value'];
};

export class NumberLiteralTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'numberLiteralTypeAnnotation',
    NumberLiteralTypeAnnotationFields
> {
    private constructor(
        value: FieldsOf<NumberLiteralTypeAnnotationFields>,
        sourceSpan: SourceSpan,
    ) {
        super('numberLiteralTypeAnnotation', value, sourceSpan);
    }

    static create(
        target: NumberLiteralTypeAnnotation,
        originalSource: string,
    ): NumberLiteralTypeAnnotationTypeClass {
        return new NumberLiteralTypeAnnotationTypeClass(
            {
                value: target.value,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getValue(): NumberLiteralTypeAnnotationFields['value'] {
        return this.getFields().value;
    }
}

export const numberLiteralTypeAnnotationTypePair: EvaluatePair<
    NumberLiteralTypeAnnotation,
    NumberLiteralTypeAnnotationTypeClass
> = makeEvaluatePair(isNumberLiteralTypeAnnotation, (target, originalSource) =>
    NumberLiteralTypeAnnotationTypeClass.create(target, originalSource),
);

export const isNumberLiteralTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is NumberLiteralTypeAnnotationTypeClass =>
    target instanceof NumberLiteralTypeAnnotationTypeClass;
