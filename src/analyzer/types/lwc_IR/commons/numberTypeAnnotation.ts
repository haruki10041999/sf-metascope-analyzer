import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isNumberTypeAnnotation, type NumberTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type NumberTypeAnnotationFields = TypeField<'numberTypeAnnotation'>;

export class NumberTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'numberTypeAnnotation',
    NumberTypeAnnotationFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('numberTypeAnnotation', {}, sourceSpan);
    }

    static create(
        target: NumberTypeAnnotation,
        originalSource: string,
    ): NumberTypeAnnotationTypeClass {
        return new NumberTypeAnnotationTypeClass(getSourceSpan(target, originalSource));
    }
}

export const numberTypeAnnotationTypePair: EvaluatePair<
    NumberTypeAnnotation,
    NumberTypeAnnotationTypeClass
> = makeEvaluatePair(isNumberTypeAnnotation, (target, originalSource) =>
    NumberTypeAnnotationTypeClass.create(target, originalSource),
);

export const isNumberTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is NumberTypeAnnotationTypeClass => target instanceof NumberTypeAnnotationTypeClass;
