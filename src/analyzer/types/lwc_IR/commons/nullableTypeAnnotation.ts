import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isNullableTypeAnnotation, type NullableTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';

export type NullableTypeAnnotationFields = TypeField<'nullableTypeAnnotation'> & {
    typeAnnotation: FlowTypeTypeClass;
};

export class NullableTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'nullableTypeAnnotation',
    NullableTypeAnnotationFields
> {
    private constructor(value: FieldsOf<NullableTypeAnnotationFields>, sourceSpan: SourceSpan) {
        super('nullableTypeAnnotation', value, sourceSpan);
    }

    static create(
        target: NullableTypeAnnotation,
        originalSource: string,
    ): NullableTypeAnnotationTypeClass {
        return new NullableTypeAnnotationTypeClass(
            {
                typeAnnotation: visitNode(
                    target.typeAnnotation,
                    originalSource,
                    flowTypeVisitorEvaluatePairs(),
                    'FlowTypeVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTypeAnnotation(): NullableTypeAnnotationFields['typeAnnotation'] {
        return this.getFields().typeAnnotation;
    }
}

export const nullableTypeAnnotationTypePair: EvaluatePair<
    NullableTypeAnnotation,
    NullableTypeAnnotationTypeClass
> = makeEvaluatePair(isNullableTypeAnnotation, (target, originalSource) =>
    NullableTypeAnnotationTypeClass.create(target, originalSource),
);

export const isNullableTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is NullableTypeAnnotationTypeClass => target instanceof NullableTypeAnnotationTypeClass;
