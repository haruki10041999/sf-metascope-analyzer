import { isTupleTypeAnnotation, type TupleTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';

export type TupleTypeAnnotationFields = {
    types: (FlowTypeTypeClass | LwcErrorTypeClass)[];
};

export class TupleTypeAnnotationTypeClass extends LwcCommonTypeClass<'tupleTypeAnnotation'> {
    private readonly value: TupleTypeAnnotationFields;

    private constructor(value: TupleTypeAnnotationFields) {
        super('tupleTypeAnnotation');
        this.value = value;
    }

    static create(
        target: TupleTypeAnnotation,
        originalSource: string,
    ): TupleTypeAnnotationTypeClass {
        return new TupleTypeAnnotationTypeClass({
            types: visitNodeList(
                target.types,
                originalSource,
                flowTypeVisitorEvaluatePairs(),
                'FlowTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TupleTypeAnnotationFields {
        return this.value;
    }

    getTypes(): TupleTypeAnnotationFields['types'] {
        return this.value.types;
    }
}

export const tupleTypeAnnotationTypePair: EvaluatePair<
    TupleTypeAnnotation,
    TupleTypeAnnotationTypeClass
> = makeEvaluatePair(isTupleTypeAnnotation, (target, originalSource) =>
    TupleTypeAnnotationTypeClass.create(target, originalSource),
);

export const isTupleTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is TupleTypeAnnotationTypeClass => target instanceof TupleTypeAnnotationTypeClass;
