import { isGenericTypeAnnotation, type GenericTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import {
    qualifiedTypeIdentifierTypePair,
    type QualifiedTypeIdentifierTypeClass,
} from '../flowVisitor/qualifiedTypeIdentifier';
import {
    typeParameterInstantiationTypePair,
    type TypeParameterInstantiationTypeClass,
} from '../flowVisitor/typeParameterInstantiation';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const genericTypeAnnotationIdPairs = lazyPairs(
    () => [identifierTypePair, qualifiedTypeIdentifierTypePair] as const,
);
const genericTypeAnnotationTypeParametersPairs = lazyPairs(
    () => [typeParameterInstantiationTypePair] as const,
);

export type GenericTypeAnnotationFields = {
    id: IdentifierTypeClass | QualifiedTypeIdentifierTypeClass | LwcErrorTypeClass;
    typeParameters: TypeParameterInstantiationTypeClass | LwcErrorTypeClass | null;
};

export class GenericTypeAnnotationTypeClass extends LwcCommonTypeClass<'genericTypeAnnotation'> {
    private readonly value: GenericTypeAnnotationFields;

    private constructor(value: GenericTypeAnnotationFields) {
        super('genericTypeAnnotation');
        this.value = value;
    }

    static create(
        target: GenericTypeAnnotation,
        originalSource: string,
    ): GenericTypeAnnotationTypeClass {
        return new GenericTypeAnnotationTypeClass({
            id: visitNode(
                target.id,
                originalSource,
                genericTypeAnnotationIdPairs(),
                'GenericTypeAnnotation.id',
            ),
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                genericTypeAnnotationTypeParametersPairs(),
                'GenericTypeAnnotation.typeParameters',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): GenericTypeAnnotationFields {
        return this.value;
    }

    getId(): GenericTypeAnnotationFields['id'] {
        return this.value.id;
    }

    getTypeParameters(): GenericTypeAnnotationFields['typeParameters'] {
        return this.value.typeParameters;
    }
}

export const genericTypeAnnotationTypePair: EvaluatePair<
    GenericTypeAnnotation,
    GenericTypeAnnotationTypeClass
> = makeEvaluatePair(isGenericTypeAnnotation, (target, originalSource) =>
    GenericTypeAnnotationTypeClass.create(target, originalSource),
);

export const isGenericTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is GenericTypeAnnotationTypeClass => target instanceof GenericTypeAnnotationTypeClass;
