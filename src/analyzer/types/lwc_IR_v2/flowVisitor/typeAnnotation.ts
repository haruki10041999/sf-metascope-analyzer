import { isTypeAnnotation, type TypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from '../commons/identifier';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';

const typeAnnotationTypeAnnotationPairs = lazyPairs(
    () => [...flowTypeVisitorEvaluatePairs(), identifierTypePair] as const,
);

export type TypeAnnotationFields = {
    typeAnnotation: FlowTypeTypeClass | IdentifierTypeClass | LwcErrorTypeClass;
};

export class TypeAnnotationTypeClass extends LwcCommonTypeClass<'typeAnnotation'> {
    private readonly value: TypeAnnotationFields;

    private constructor(value: TypeAnnotationFields) {
        super('typeAnnotation');
        this.value = value;
    }

    static create(target: TypeAnnotation, originalSource: string): TypeAnnotationTypeClass {
        return new TypeAnnotationTypeClass({
            typeAnnotation: visitNode(
                target.typeAnnotation,
                originalSource,
                typeAnnotationTypeAnnotationPairs(),
                'TypeAnnotation.typeAnnotation',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TypeAnnotationFields {
        return this.value;
    }

    getTypeAnnotation(): TypeAnnotationFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }
}

export const typeAnnotationTypePair: EvaluatePair<TypeAnnotation, TypeAnnotationTypeClass> =
    makeEvaluatePair(isTypeAnnotation, (target, originalSource) =>
        TypeAnnotationTypeClass.create(target, originalSource),
    );

export const isTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is TypeAnnotationTypeClass => target instanceof TypeAnnotationTypeClass;
