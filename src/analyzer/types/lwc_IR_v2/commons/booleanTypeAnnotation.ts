import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isBooleanTypeAnnotation, type BooleanTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type BooleanTypeAnnotationFields = TypeField<'booleanTypeAnnotation'>;

export class BooleanTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'booleanTypeAnnotation',
    BooleanTypeAnnotationFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('booleanTypeAnnotation', {}, sourceSpan);
    }

    static create(
        target: BooleanTypeAnnotation,
        originalSource: string,
    ): BooleanTypeAnnotationTypeClass {
        return new BooleanTypeAnnotationTypeClass(getSourceSpan(target, originalSource));
    }
}

export const booleanTypeAnnotationTypePair: EvaluatePair<
    BooleanTypeAnnotation,
    BooleanTypeAnnotationTypeClass
> = makeEvaluatePair(isBooleanTypeAnnotation, (target, originalSource) =>
    BooleanTypeAnnotationTypeClass.create(target, originalSource),
);

export const isBooleanTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is BooleanTypeAnnotationTypeClass => target instanceof BooleanTypeAnnotationTypeClass;
