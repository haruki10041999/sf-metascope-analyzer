import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTupleTypeAnnotation, type TupleTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';

export type TupleTypeAnnotationFields = TypeField<'tupleTypeAnnotation'> & {
    types: FlowTypeTypeClass[];
};

export class TupleTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'tupleTypeAnnotation',
    TupleTypeAnnotationFields
> {
    private constructor(value: FieldsOf<TupleTypeAnnotationFields>, sourceSpan: SourceSpan) {
        super('tupleTypeAnnotation', value, sourceSpan);
    }

    static create(
        target: TupleTypeAnnotation,
        originalSource: string,
    ): TupleTypeAnnotationTypeClass {
        return new TupleTypeAnnotationTypeClass(
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

    getTypes(): TupleTypeAnnotationFields['types'] {
        return this.getFields().types;
    }
}

export const tupleTypeAnnotationTypePair: EvaluatePair<
    TupleTypeAnnotation,
    TupleTypeAnnotationTypeClass
> = makeEvaluatePair(isTupleTypeAnnotation, (target, originalSource) =>
    TupleTypeAnnotationTypeClass.create(target, originalSource),
);

export const isTupleTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TupleTypeAnnotationTypeClass => target instanceof TupleTypeAnnotationTypeClass;
