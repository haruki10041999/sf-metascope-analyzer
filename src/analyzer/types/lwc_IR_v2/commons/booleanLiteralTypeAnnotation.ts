import { isBooleanLiteralTypeAnnotation, type BooleanLiteralTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export type BooleanLiteralTypeAnnotationFields = {
    value: BooleanLiteralTypeAnnotation['value'];
};

export class BooleanLiteralTypeAnnotationTypeClass extends LwcCommonTypeClass<'booleanLiteralTypeAnnotation'> {
    private readonly value: BooleanLiteralTypeAnnotationFields;

    private constructor(value: BooleanLiteralTypeAnnotationFields) {
        super('booleanLiteralTypeAnnotation');
        this.value = value;
    }

    static create(
        target: BooleanLiteralTypeAnnotation,
        originalSource: string,
    ): BooleanLiteralTypeAnnotationTypeClass {
        return new BooleanLiteralTypeAnnotationTypeClass({
            value: target.value,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): BooleanLiteralTypeAnnotationFields {
        return this.value;
    }

    getValue(): BooleanLiteralTypeAnnotationFields['value'] {
        return this.value.value;
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
