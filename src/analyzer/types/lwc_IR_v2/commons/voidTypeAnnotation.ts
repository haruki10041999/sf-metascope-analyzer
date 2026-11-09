import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isVoidTypeAnnotation, type VoidTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type VoidTypeAnnotationFields = TypeField<'voidTypeAnnotation'>;

export class VoidTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'voidTypeAnnotation',
    VoidTypeAnnotationFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('voidTypeAnnotation', {}, sourceSpan);
    }

    static create(target: VoidTypeAnnotation, originalSource: string): VoidTypeAnnotationTypeClass {
        return new VoidTypeAnnotationTypeClass(getSourceSpan(target, originalSource));
    }
}

export const voidTypeAnnotationTypePair: EvaluatePair<
    VoidTypeAnnotation,
    VoidTypeAnnotationTypeClass
> = makeEvaluatePair(isVoidTypeAnnotation, (target, originalSource) =>
    VoidTypeAnnotationTypeClass.create(target, originalSource),
);

export const isVoidTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is VoidTypeAnnotationTypeClass => target instanceof VoidTypeAnnotationTypeClass;
