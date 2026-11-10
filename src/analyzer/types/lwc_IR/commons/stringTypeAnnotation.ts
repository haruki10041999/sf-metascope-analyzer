import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isStringTypeAnnotation, type StringTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type StringTypeAnnotationFields = TypeField<'stringTypeAnnotation'>;

export class StringTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'stringTypeAnnotation',
    StringTypeAnnotationFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('stringTypeAnnotation', {}, sourceSpan);
    }

    static create(
        target: StringTypeAnnotation,
        originalSource: string,
    ): StringTypeAnnotationTypeClass {
        return new StringTypeAnnotationTypeClass(getSourceSpan(target, originalSource));
    }
}

export const stringTypeAnnotationTypePair: EvaluatePair<
    StringTypeAnnotation,
    StringTypeAnnotationTypeClass
> = makeEvaluatePair(isStringTypeAnnotation, (target, originalSource) =>
    StringTypeAnnotationTypeClass.create(target, originalSource),
);

export const isStringTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is StringTypeAnnotationTypeClass => target instanceof StringTypeAnnotationTypeClass;
