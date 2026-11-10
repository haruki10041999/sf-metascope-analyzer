import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isStringLiteralTypeAnnotation, type StringLiteralTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type StringLiteralTypeAnnotationFields = TypeField<'stringLiteralTypeAnnotation'> & {
    value: StringLiteralTypeAnnotation['value'];
};

export class StringLiteralTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'stringLiteralTypeAnnotation',
    StringLiteralTypeAnnotationFields
> {
    private constructor(
        value: FieldsOf<StringLiteralTypeAnnotationFields>,
        sourceSpan: SourceSpan,
    ) {
        super('stringLiteralTypeAnnotation', value, sourceSpan);
    }

    static create(
        target: StringLiteralTypeAnnotation,
        originalSource: string,
    ): StringLiteralTypeAnnotationTypeClass {
        return new StringLiteralTypeAnnotationTypeClass(
            {
                value: target.value,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getValue(): StringLiteralTypeAnnotationFields['value'] {
        return this.getFields().value;
    }
}

export const stringLiteralTypeAnnotationTypePair: EvaluatePair<
    StringLiteralTypeAnnotation,
    StringLiteralTypeAnnotationTypeClass
> = makeEvaluatePair(isStringLiteralTypeAnnotation, (target, originalSource) =>
    StringLiteralTypeAnnotationTypeClass.create(target, originalSource),
);

export const isStringLiteralTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is StringLiteralTypeAnnotationTypeClass =>
    target instanceof StringLiteralTypeAnnotationTypeClass;
