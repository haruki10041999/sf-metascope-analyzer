import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isEmptyTypeAnnotation, type EmptyTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type EmptyTypeAnnotationFields = TypeField<'emptyTypeAnnotation'>;

export class EmptyTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'emptyTypeAnnotation',
    EmptyTypeAnnotationFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('emptyTypeAnnotation', {}, sourceSpan);
    }

    static create(
        target: EmptyTypeAnnotation,
        originalSource: string,
    ): EmptyTypeAnnotationTypeClass {
        return new EmptyTypeAnnotationTypeClass(getSourceSpan(target, originalSource));
    }
}

export const emptyTypeAnnotationTypePair: EvaluatePair<
    EmptyTypeAnnotation,
    EmptyTypeAnnotationTypeClass
> = makeEvaluatePair(isEmptyTypeAnnotation, (target, originalSource) =>
    EmptyTypeAnnotationTypeClass.create(target, originalSource),
);

export const isEmptyTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is EmptyTypeAnnotationTypeClass => target instanceof EmptyTypeAnnotationTypeClass;
