import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isExistsTypeAnnotation, type ExistsTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type ExistsTypeAnnotationFields = TypeField<'existsTypeAnnotation'>;

export class ExistsTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'existsTypeAnnotation',
    ExistsTypeAnnotationFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('existsTypeAnnotation', {}, sourceSpan);
    }

    static create(
        target: ExistsTypeAnnotation,
        originalSource: string,
    ): ExistsTypeAnnotationTypeClass {
        return new ExistsTypeAnnotationTypeClass(getSourceSpan(target, originalSource));
    }
}

export const existsTypeAnnotationTypePair: EvaluatePair<
    ExistsTypeAnnotation,
    ExistsTypeAnnotationTypeClass
> = makeEvaluatePair(isExistsTypeAnnotation, (target, originalSource) =>
    ExistsTypeAnnotationTypeClass.create(target, originalSource),
);

export const isExistsTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ExistsTypeAnnotationTypeClass => target instanceof ExistsTypeAnnotationTypeClass;
