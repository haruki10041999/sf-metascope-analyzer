import { isFunctionTypeAnnotation, type FunctionTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitNodeList,
    visitOptionalNode,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';
import {
    functionTypeParamTypePair,
    type FunctionTypeParamTypeClass,
} from '../flowVisitor/functionTypeParam';
import {
    typeParameterDeclarationTypePair,
    type TypeParameterDeclarationTypeClass,
} from '../flowVisitor/typeParameterDeclaration';

const functionTypeAnnotationTypeParametersPairs = lazyPairs(
    () => [typeParameterDeclarationTypePair] as const,
);
const functionTypeAnnotationParamsPairs = lazyPairs(() => [functionTypeParamTypePair] as const);
const functionTypeAnnotationRestPairs = lazyPairs(() => [functionTypeParamTypePair] as const);
const functionTypeAnnotationThisPairs = lazyPairs(() => [functionTypeParamTypePair] as const);

export type FunctionTypeAnnotationFields = {
    typeParameters: TypeParameterDeclarationTypeClass | LwcErrorTypeClass | null;
    params: (FunctionTypeParamTypeClass | LwcErrorTypeClass)[];
    rest: FunctionTypeParamTypeClass | LwcErrorTypeClass | null;
    this: FunctionTypeParamTypeClass | LwcErrorTypeClass | null;
    returnType: FlowTypeTypeClass | LwcErrorTypeClass;
};

export class FunctionTypeAnnotationTypeClass extends LwcCommonTypeClass<'functionTypeAnnotation'> {
    private readonly value: FunctionTypeAnnotationFields;

    private constructor(value: FunctionTypeAnnotationFields) {
        super('functionTypeAnnotation');
        this.value = value;
    }

    static create(
        target: FunctionTypeAnnotation,
        originalSource: string,
    ): FunctionTypeAnnotationTypeClass {
        return new FunctionTypeAnnotationTypeClass({
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                functionTypeAnnotationTypeParametersPairs(),
                'FunctionTypeAnnotation.typeParameters',
            ),
            params: visitNodeList(
                target.params,
                originalSource,
                functionTypeAnnotationParamsPairs(),
                'FunctionTypeAnnotation.params',
            ),
            rest: visitOptionalNode(
                target.rest,
                originalSource,
                functionTypeAnnotationRestPairs(),
                'FunctionTypeAnnotation.rest',
            ),
            this: visitOptionalNode(
                target.this,
                originalSource,
                functionTypeAnnotationThisPairs(),
                'FunctionTypeAnnotation.this',
            ),
            returnType: visitNode(
                target.returnType,
                originalSource,
                flowTypeVisitorEvaluatePairs(),
                'FlowTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): FunctionTypeAnnotationFields {
        return this.value;
    }

    getTypeParameters(): FunctionTypeAnnotationFields['typeParameters'] {
        return this.value.typeParameters;
    }

    getParams(): FunctionTypeAnnotationFields['params'] {
        return this.value.params;
    }

    getRest(): FunctionTypeAnnotationFields['rest'] {
        return this.value.rest;
    }

    getThis(): FunctionTypeAnnotationFields['this'] {
        return this.value.this;
    }

    getReturnType(): FunctionTypeAnnotationFields['returnType'] {
        return this.value.returnType;
    }
}

export const functionTypeAnnotationTypePair: EvaluatePair<
    FunctionTypeAnnotation,
    FunctionTypeAnnotationTypeClass
> = makeEvaluatePair(isFunctionTypeAnnotation, (target, originalSource) =>
    FunctionTypeAnnotationTypeClass.create(target, originalSource),
);

export const isFunctionTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is FunctionTypeAnnotationTypeClass => target instanceof FunctionTypeAnnotationTypeClass;
