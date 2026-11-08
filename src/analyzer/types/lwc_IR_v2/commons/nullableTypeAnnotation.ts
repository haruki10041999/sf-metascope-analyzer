import { isNullableTypeAnnotation, type NullableTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';

export type NullableTypeAnnotationFields = {
    typeAnnotation: FlowTypeTypeClass | LwcErrorTypeClass;
};

export class NullableTypeAnnotationTypeClass extends LwcCommonTypeClass<'nullableTypeAnnotation'> {
    private readonly value: NullableTypeAnnotationFields;

    private constructor(value: NullableTypeAnnotationFields) {
        super('nullableTypeAnnotation');
        this.value = value;
    }

    static create(
        target: NullableTypeAnnotation,
        originalSource: string,
    ): NullableTypeAnnotationTypeClass {
        return new NullableTypeAnnotationTypeClass({
            typeAnnotation: visitNode(
                target.typeAnnotation,
                originalSource,
                flowTypeVisitorEvaluatePairs(),
                'FlowTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): NullableTypeAnnotationFields {
        return this.value;
    }

    getTypeAnnotation(): NullableTypeAnnotationFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }
}

export const nullableTypeAnnotationTypePair: EvaluatePair<
    NullableTypeAnnotation,
    NullableTypeAnnotationTypeClass
> = makeEvaluatePair(isNullableTypeAnnotation, (target, originalSource) =>
    NullableTypeAnnotationTypeClass.create(target, originalSource),
);

export const isNullableTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is NullableTypeAnnotationTypeClass => target instanceof NullableTypeAnnotationTypeClass;
