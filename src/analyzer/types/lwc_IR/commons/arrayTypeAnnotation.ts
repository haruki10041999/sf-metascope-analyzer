import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isArrayTypeAnnotation, type ArrayTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';

export type ArrayTypeAnnotationFields = TypeField<'arrayTypeAnnotation'> & {
    elementType: FlowTypeTypeClass;
};

export class ArrayTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'arrayTypeAnnotation',
    ArrayTypeAnnotationFields
> {
    private constructor(value: FieldsOf<ArrayTypeAnnotationFields>, sourceSpan: SourceSpan) {
        super('arrayTypeAnnotation', value, sourceSpan);
    }

    static create(
        target: ArrayTypeAnnotation,
        originalSource: string,
    ): ArrayTypeAnnotationTypeClass {
        return new ArrayTypeAnnotationTypeClass(
            {
                elementType: visitNode(
                    target.elementType,
                    originalSource,
                    flowTypeVisitorEvaluatePairs(),
                    'FlowTypeVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getElementType(): ArrayTypeAnnotationFields['elementType'] {
        return this.getFields().elementType;
    }
}

export const arrayTypeAnnotationTypePair: EvaluatePair<
    ArrayTypeAnnotation,
    ArrayTypeAnnotationTypeClass
> = makeEvaluatePair(isArrayTypeAnnotation, (target, originalSource) =>
    ArrayTypeAnnotationTypeClass.create(target, originalSource),
);

export const isArrayTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ArrayTypeAnnotationTypeClass => target instanceof ArrayTypeAnnotationTypeClass;
