import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isGenericTypeAnnotation, type GenericTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import {
    qualifiedTypeIdentifierTypePair,
    type QualifiedTypeIdentifierTypeClass,
} from '../flowVisitor/qualifiedTypeIdentifier';
import { TypeParameterInstantiationTypeClass } from '../flowVisitor/typeParameterInstantiation';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const genericTypeAnnotationIdPairs = lazyPairs(
    () => [identifierTypePair, qualifiedTypeIdentifierTypePair] as const,
);

export type GenericTypeAnnotationFields = TypeField<'genericTypeAnnotation'> & {
    id: IdentifierTypeClass | QualifiedTypeIdentifierTypeClass;
    typeParameters: TypeParameterInstantiationTypeClass | null;
};

export class GenericTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'genericTypeAnnotation',
    GenericTypeAnnotationFields
> {
    private constructor(value: FieldsOf<GenericTypeAnnotationFields>, sourceSpan: SourceSpan) {
        super('genericTypeAnnotation', value, sourceSpan);
    }

    static create(
        target: GenericTypeAnnotation,
        originalSource: string,
    ): GenericTypeAnnotationTypeClass {
        return new GenericTypeAnnotationTypeClass(
            {
                id: visitNode(
                    target.id,
                    originalSource,
                    genericTypeAnnotationIdPairs(),
                    'GenericTypeAnnotation.id',
                ),
                typeParameters:
                    target.typeParameters == null
                        ? null
                        : TypeParameterInstantiationTypeClass.create(
                              target.typeParameters,
                              originalSource,
                          ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): GenericTypeAnnotationFields['id'] {
        return this.getFields().id;
    }

    getTypeParameters(): GenericTypeAnnotationFields['typeParameters'] {
        return this.getFields().typeParameters;
    }
}

export const genericTypeAnnotationTypePair: EvaluatePair<
    GenericTypeAnnotation,
    GenericTypeAnnotationTypeClass
> = makeEvaluatePair(isGenericTypeAnnotation, (target, originalSource) =>
    GenericTypeAnnotationTypeClass.create(target, originalSource),
);

export const isGenericTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is GenericTypeAnnotationTypeClass => target instanceof GenericTypeAnnotationTypeClass;
