import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isBooleanLiteralTypeAnnotation, type BooleanLiteralTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type BooleanLiteralTypeAnnotationFields = TypeField<'booleanLiteralTypeAnnotation'> & {
    value: BooleanLiteralTypeAnnotation['value'];
};

export class BooleanLiteralTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'booleanLiteralTypeAnnotation',
    BooleanLiteralTypeAnnotationFields
> {
    private constructor(
        value: FieldsOf<BooleanLiteralTypeAnnotationFields>,
        sourceSpan: SourceSpan,
    ) {
        super('booleanLiteralTypeAnnotation', value, sourceSpan);
    }

    static create(
        target: BooleanLiteralTypeAnnotation,
        originalSource: string,
    ): BooleanLiteralTypeAnnotationTypeClass {
        return new BooleanLiteralTypeAnnotationTypeClass(
            {
                value: target.value,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getValue(): BooleanLiteralTypeAnnotationFields['value'] {
        return this.getFields().value;
    }
}

export const booleanLiteralTypeAnnotationTypePair: EvaluatePair<
    BooleanLiteralTypeAnnotation,
    BooleanLiteralTypeAnnotationTypeClass
> = makeEvaluatePair(isBooleanLiteralTypeAnnotation, (target, originalSource) =>
    BooleanLiteralTypeAnnotationTypeClass.create(target, originalSource),
);

export const isBooleanLiteralTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is BooleanLiteralTypeAnnotationTypeClass =>
    target instanceof BooleanLiteralTypeAnnotationTypeClass;
