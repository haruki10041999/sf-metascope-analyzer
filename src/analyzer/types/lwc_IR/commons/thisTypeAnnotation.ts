import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isThisTypeAnnotation, type ThisTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type ThisTypeAnnotationFields = TypeField<'thisTypeAnnotation'>;

export class ThisTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'thisTypeAnnotation',
    ThisTypeAnnotationFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('thisTypeAnnotation', {}, sourceSpan);
    }

    static create(target: ThisTypeAnnotation, originalSource: string): ThisTypeAnnotationTypeClass {
        return new ThisTypeAnnotationTypeClass(getSourceSpan(target, originalSource));
    }
}

export const thisTypeAnnotationTypePair: EvaluatePair<
    ThisTypeAnnotation,
    ThisTypeAnnotationTypeClass
> = makeEvaluatePair(isThisTypeAnnotation, (target, originalSource) =>
    ThisTypeAnnotationTypeClass.create(target, originalSource),
);

export const isThisTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ThisTypeAnnotationTypeClass => target instanceof ThisTypeAnnotationTypeClass;
