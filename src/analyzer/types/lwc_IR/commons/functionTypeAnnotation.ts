import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isFunctionTypeAnnotation, type FunctionTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';
import { FunctionTypeParamTypeClass } from '../flowVisitor/functionTypeParam';
import { TypeParameterDeclarationTypeClass } from '../flowVisitor/typeParameterDeclaration';

export type FunctionTypeAnnotationFields = TypeField<'functionTypeAnnotation'> & {
    typeParameters: TypeParameterDeclarationTypeClass | null;
    params: FunctionTypeParamTypeClass[];
    rest: FunctionTypeParamTypeClass | null;
    this: FunctionTypeParamTypeClass | null;
    returnType: FlowTypeTypeClass;
};

export class FunctionTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'functionTypeAnnotation',
    FunctionTypeAnnotationFields
> {
    private constructor(value: FieldsOf<FunctionTypeAnnotationFields>, sourceSpan: SourceSpan) {
        super('functionTypeAnnotation', value, sourceSpan);
    }

    static create(
        target: FunctionTypeAnnotation,
        originalSource: string,
    ): FunctionTypeAnnotationTypeClass {
        return new FunctionTypeAnnotationTypeClass(
            {
                typeParameters:
                    target.typeParameters == null
                        ? null
                        : TypeParameterDeclarationTypeClass.create(
                              target.typeParameters,
                              originalSource,
                          ),
                params: target.params.map((child) =>
                    FunctionTypeParamTypeClass.create(child, originalSource),
                ),
                rest:
                    target.rest == null
                        ? null
                        : FunctionTypeParamTypeClass.create(target.rest, originalSource),
                this:
                    target.this == null
                        ? null
                        : FunctionTypeParamTypeClass.create(target.this, originalSource),
                returnType: visitNode(
                    target.returnType,
                    originalSource,
                    flowTypeVisitorEvaluatePairs(),
                    'FlowTypeVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTypeParameters(): FunctionTypeAnnotationFields['typeParameters'] {
        return this.getFields().typeParameters;
    }

    getParams(): FunctionTypeAnnotationFields['params'] {
        return this.getFields().params;
    }

    getRest(): FunctionTypeAnnotationFields['rest'] {
        return this.getFields().rest;
    }

    getThis(): FunctionTypeAnnotationFields['this'] {
        return this.getFields().this;
    }

    getReturnType(): FunctionTypeAnnotationFields['returnType'] {
        return this.getFields().returnType;
    }
}

export const functionTypeAnnotationTypePair: EvaluatePair<
    FunctionTypeAnnotation,
    FunctionTypeAnnotationTypeClass
> = makeEvaluatePair(isFunctionTypeAnnotation, (target, originalSource) =>
    FunctionTypeAnnotationTypeClass.create(target, originalSource),
);

export const isFunctionTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is FunctionTypeAnnotationTypeClass => target instanceof FunctionTypeAnnotationTypeClass;
