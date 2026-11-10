import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isIntersectionTypeAnnotation, type IntersectionTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';

export type IntersectionTypeAnnotationFields = TypeField<'intersectionTypeAnnotation'> & {
    types: FlowTypeTypeClass[];
};

export class IntersectionTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'intersectionTypeAnnotation',
    IntersectionTypeAnnotationFields
> {
    private constructor(value: FieldsOf<IntersectionTypeAnnotationFields>, sourceSpan: SourceSpan) {
        super('intersectionTypeAnnotation', value, sourceSpan);
    }

    static create(
        target: IntersectionTypeAnnotation,
        originalSource: string,
    ): IntersectionTypeAnnotationTypeClass {
        return new IntersectionTypeAnnotationTypeClass(
            {
                types: visitNodeList(
                    target.types,
                    originalSource,
                    flowTypeVisitorEvaluatePairs(),
                    'FlowTypeVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTypes(): IntersectionTypeAnnotationFields['types'] {
        return this.getFields().types;
    }
}

export const intersectionTypeAnnotationTypePair: EvaluatePair<
    IntersectionTypeAnnotation,
    IntersectionTypeAnnotationTypeClass
> = makeEvaluatePair(isIntersectionTypeAnnotation, (target, originalSource) =>
    IntersectionTypeAnnotationTypeClass.create(target, originalSource),
);

export const isIntersectionTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is IntersectionTypeAnnotationTypeClass =>
    target instanceof IntersectionTypeAnnotationTypeClass;
