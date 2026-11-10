import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTypeofTypeAnnotation, type TypeofTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const typeofTypeAnnotationArgumentPairs = lazyPairs(
    () => [...flowTypeVisitorEvaluatePairs(), identifierTypePair] as const,
);

export type TypeofTypeAnnotationFields = TypeField<'typeofTypeAnnotation'> & {
    argument: FlowTypeTypeClass | IdentifierTypeClass;
};

export class TypeofTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'typeofTypeAnnotation',
    TypeofTypeAnnotationFields
> {
    private constructor(value: FieldsOf<TypeofTypeAnnotationFields>, sourceSpan: SourceSpan) {
        super('typeofTypeAnnotation', value, sourceSpan);
    }

    static create(
        target: TypeofTypeAnnotation,
        originalSource: string,
    ): TypeofTypeAnnotationTypeClass {
        return new TypeofTypeAnnotationTypeClass(
            {
                argument: visitNode(
                    target.argument,
                    originalSource,
                    typeofTypeAnnotationArgumentPairs(),
                    'TypeofTypeAnnotation.argument',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getArgument(): TypeofTypeAnnotationFields['argument'] {
        return this.getFields().argument;
    }
}

export const typeofTypeAnnotationTypePair: EvaluatePair<
    TypeofTypeAnnotation,
    TypeofTypeAnnotationTypeClass
> = makeEvaluatePair(isTypeofTypeAnnotation, (target, originalSource) =>
    TypeofTypeAnnotationTypeClass.create(target, originalSource),
);

export const isTypeofTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TypeofTypeAnnotationTypeClass => target instanceof TypeofTypeAnnotationTypeClass;
