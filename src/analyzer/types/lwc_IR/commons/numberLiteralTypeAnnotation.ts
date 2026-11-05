import { isNumberLiteralTypeAnnotation, type NumberLiteralTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export type NumberLiteralTypeAnnotationFields = {
    value: NumberLiteralTypeAnnotation['value'];
};

export class NumberLiteralTypeAnnotationTypeClass extends LwcCommonTypeClass<'numberLiteralTypeAnnotation'> {
    private readonly value: NumberLiteralTypeAnnotationFields;

    private constructor(value: NumberLiteralTypeAnnotationFields) {
        super('numberLiteralTypeAnnotation');
        this.value = value;
    }

    static create(
        target: NumberLiteralTypeAnnotation,
        originalSource: string,
    ): NumberLiteralTypeAnnotationTypeClass {
        return new NumberLiteralTypeAnnotationTypeClass({
            value: target.value,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): NumberLiteralTypeAnnotationFields {
        return this.value;
    }

    getValue(): NumberLiteralTypeAnnotationFields['value'] {
        return this.value.value;
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
