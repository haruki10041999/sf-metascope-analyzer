import { isTypeofTypeAnnotation, type TypeofTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const typeofTypeAnnotationArgumentPairs = lazyPairs(
    () => [...flowTypeVisitorEvaluatePairs(), identifierTypePair] as const,
);

export type TypeofTypeAnnotationFields = {
    argument: FlowTypeTypeClass | IdentifierTypeClass | LwcErrorTypeClass;
};

export class TypeofTypeAnnotationTypeClass extends LwcCommonTypeClass<'typeofTypeAnnotation'> {
    private readonly value: TypeofTypeAnnotationFields;

    private constructor(value: TypeofTypeAnnotationFields) {
        super('typeofTypeAnnotation');
        this.value = value;
    }

    static create(
        target: TypeofTypeAnnotation,
        originalSource: string,
    ): TypeofTypeAnnotationTypeClass {
        return new TypeofTypeAnnotationTypeClass({
            argument: visitNode(
                target.argument,
                originalSource,
                typeofTypeAnnotationArgumentPairs(),
                'TypeofTypeAnnotation.argument',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TypeofTypeAnnotationFields {
        return this.value;
    }

    getArgument(): TypeofTypeAnnotationFields['argument'] {
        return this.value.argument;
    }
}

export const typeofTypeAnnotationTypePair: EvaluatePair<
    TypeofTypeAnnotation,
    TypeofTypeAnnotationTypeClass
> = makeEvaluatePair(isTypeofTypeAnnotation, (target, originalSource) =>
    TypeofTypeAnnotationTypeClass.create(target, originalSource),
);

export const isTypeofTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is TypeofTypeAnnotationTypeClass => target instanceof TypeofTypeAnnotationTypeClass;
