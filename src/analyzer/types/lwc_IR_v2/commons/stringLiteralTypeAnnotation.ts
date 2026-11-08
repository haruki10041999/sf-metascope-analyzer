import { isStringLiteralTypeAnnotation, type StringLiteralTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export type StringLiteralTypeAnnotationFields = {
    value: StringLiteralTypeAnnotation['value'];
};

export class StringLiteralTypeAnnotationTypeClass extends LwcCommonTypeClass<'stringLiteralTypeAnnotation'> {
    private readonly value: StringLiteralTypeAnnotationFields;

    private constructor(value: StringLiteralTypeAnnotationFields) {
        super('stringLiteralTypeAnnotation');
        this.value = value;
    }

    static create(
        target: StringLiteralTypeAnnotation,
        originalSource: string,
    ): StringLiteralTypeAnnotationTypeClass {
        return new StringLiteralTypeAnnotationTypeClass({
            value: target.value,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): StringLiteralTypeAnnotationFields {
        return this.value;
    }

    getValue(): StringLiteralTypeAnnotationFields['value'] {
        return this.value.value;
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
