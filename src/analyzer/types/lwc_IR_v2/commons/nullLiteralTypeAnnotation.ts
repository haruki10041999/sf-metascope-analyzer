import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isNullLiteralTypeAnnotation, type NullLiteralTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type NullLiteralTypeAnnotationFields = TypeField<'nullLiteralTypeAnnotation'>;

export class NullLiteralTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'nullLiteralTypeAnnotation',
    NullLiteralTypeAnnotationFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('nullLiteralTypeAnnotation', {}, sourceSpan);
    }

    static create(
        target: NullLiteralTypeAnnotation,
        originalSource: string,
    ): NullLiteralTypeAnnotationTypeClass {
        return new NullLiteralTypeAnnotationTypeClass(getSourceSpan(target, originalSource));
    }
}

export const nullLiteralTypeAnnotationTypePair: EvaluatePair<
    NullLiteralTypeAnnotation,
    NullLiteralTypeAnnotationTypeClass
> = makeEvaluatePair(isNullLiteralTypeAnnotation, (target, originalSource) =>
    NullLiteralTypeAnnotationTypeClass.create(target, originalSource),
);

export const isNullLiteralTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is NullLiteralTypeAnnotationTypeClass =>
    target instanceof NullLiteralTypeAnnotationTypeClass;
