import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTypeAnnotation, type TypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from '../commons/identifier';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';

const typeAnnotationTypeAnnotationPairs = lazyPairs(
    () => [...flowTypeVisitorEvaluatePairs(), identifierTypePair] as const,
);

export type TypeAnnotationFields = TypeField<'typeAnnotation'> & {
    typeAnnotation: FlowTypeTypeClass | IdentifierTypeClass;
};

export class TypeAnnotationTypeClass extends LwcCommonTypeClass<
    'typeAnnotation',
    TypeAnnotationFields
> {
    private constructor(value: FieldsOf<TypeAnnotationFields>, sourceSpan: SourceSpan) {
        super('typeAnnotation', value, sourceSpan);
    }

    static create(target: TypeAnnotation, originalSource: string): TypeAnnotationTypeClass {
        return new TypeAnnotationTypeClass(
            {
                typeAnnotation: visitNode(
                    target.typeAnnotation,
                    originalSource,
                    typeAnnotationTypeAnnotationPairs(),
                    'TypeAnnotation.typeAnnotation',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTypeAnnotation(): TypeAnnotationFields['typeAnnotation'] {
        return this.getFields().typeAnnotation;
    }
}

export const typeAnnotationTypePair: EvaluatePair<TypeAnnotation, TypeAnnotationTypeClass> =
    makeEvaluatePair(isTypeAnnotation, (target, originalSource) =>
        TypeAnnotationTypeClass.create(target, originalSource),
    );

export const isTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TypeAnnotationTypeClass => target instanceof TypeAnnotationTypeClass;
