import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isAnyTypeAnnotation, type AnyTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type AnyTypeAnnotationFields = TypeField<'anyTypeAnnotation'>;

export class AnyTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'anyTypeAnnotation',
    AnyTypeAnnotationFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('anyTypeAnnotation', {}, sourceSpan);
    }

    static create(target: AnyTypeAnnotation, originalSource: string): AnyTypeAnnotationTypeClass {
        return new AnyTypeAnnotationTypeClass(getSourceSpan(target, originalSource));
    }
}

export const anyTypeAnnotationTypePair: EvaluatePair<
    AnyTypeAnnotation,
    AnyTypeAnnotationTypeClass
> = makeEvaluatePair(isAnyTypeAnnotation, (target, originalSource) =>
    AnyTypeAnnotationTypeClass.create(target, originalSource),
);

export const isAnyTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is AnyTypeAnnotationTypeClass => target instanceof AnyTypeAnnotationTypeClass;
