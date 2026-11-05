import { isArrayTypeAnnotation, type ArrayTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';

export type ArrayTypeAnnotationFields = {
    elementType: FlowTypeTypeClass | LwcErrorTypeClass;
};

export class ArrayTypeAnnotationTypeClass extends LwcCommonTypeClass<'arrayTypeAnnotation'> {
    private readonly value: ArrayTypeAnnotationFields;

    private constructor(value: ArrayTypeAnnotationFields) {
        super('arrayTypeAnnotation');
        this.value = value;
    }

    static create(
        target: ArrayTypeAnnotation,
        originalSource: string,
    ): ArrayTypeAnnotationTypeClass {
        return new ArrayTypeAnnotationTypeClass({
            elementType: visitNode(
                target.elementType,
                originalSource,
                flowTypeVisitorEvaluatePairs(),
                'FlowTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ArrayTypeAnnotationFields {
        return this.value;
    }

    getElementType(): ArrayTypeAnnotationFields['elementType'] {
        return this.value.elementType;
    }
}

export const arrayTypeAnnotationTypePair: EvaluatePair<
    ArrayTypeAnnotation,
    ArrayTypeAnnotationTypeClass
> = makeEvaluatePair(isArrayTypeAnnotation, (target, originalSource) =>
    ArrayTypeAnnotationTypeClass.create(target, originalSource),
);

export const isArrayTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is ArrayTypeAnnotationTypeClass => target instanceof ArrayTypeAnnotationTypeClass;
