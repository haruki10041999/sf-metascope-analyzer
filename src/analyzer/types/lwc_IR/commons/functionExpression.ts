import { isFunctionExpression, type FunctionExpression } from '@babel/types';
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
import {
    flowPredicateVisitorEvaluatePairs,
    type FlowPredicateTypeClass,
} from '../flowPredicateVisitor';
import {
    typeAnnotationTypePair,
    type TypeAnnotationTypeClass,
} from '../flowVisitor/typeAnnotation';
import {
    typeParameterDeclarationTypePair,
    type TypeParameterDeclarationTypeClass,
} from '../flowVisitor/typeParameterDeclaration';
import {
    functionParameterVisitorEvaluatePairs,
    type FunctionParameterTypeClass,
} from '../functionParameterVisitor';
import {
    tSTypeAnnotationTypePair,
    type TSTypeAnnotationTypeClass,
} from '../typeScriptVisitor/tSTypeAnnotation';
import {
    tSTypeParameterDeclarationTypePair,
    type TSTypeParameterDeclarationTypeClass,
} from '../typeScriptVisitor/tSTypeParameterDeclaration';
import { blockStatementTypePair, type BlockStatementTypeClass } from './blockStatement';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const functionExpressionReturnTypePairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);
const functionExpressionTypeParametersPairs = lazyPairs(
    () => [typeParameterDeclarationTypePair, tSTypeParameterDeclarationTypePair] as const,
);
const functionExpressionIdPairs = lazyPairs(() => [identifierTypePair] as const);
const functionExpressionBodyPairs = lazyPairs(() => [blockStatementTypePair] as const);

export type FunctionExpressionFields = {
    params: (FunctionParameterTypeClass | LwcErrorTypeClass)[];
    generator: FunctionExpression['generator'];
    async: FunctionExpression['async'];
    returnType: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | LwcErrorTypeClass | null;
    typeParameters:
        | TypeParameterDeclarationTypeClass
        | TSTypeParameterDeclarationTypeClass
        | LwcErrorTypeClass
        | null;
    id: IdentifierTypeClass | LwcErrorTypeClass | null;
    body: BlockStatementTypeClass | LwcErrorTypeClass;
    predicate: FlowPredicateTypeClass | LwcErrorTypeClass | null;
};

export class FunctionExpressionTypeClass extends LwcCommonTypeClass<'functionExpression'> {
    private readonly value: FunctionExpressionFields;

    private constructor(value: FunctionExpressionFields) {
        super('functionExpression');
        this.value = value;
    }

    static create(target: FunctionExpression, originalSource: string): FunctionExpressionTypeClass {
        return new FunctionExpressionTypeClass({
            params: visitNodeList(
                target.params,
                originalSource,
                functionParameterVisitorEvaluatePairs(),
                'FunctionParameterVisitor',
            ),
            generator: target.generator,
            async: target.async,
            returnType: visitOptionalNode(
                target.returnType,
                originalSource,
                functionExpressionReturnTypePairs(),
                'FunctionExpression.returnType',
            ),
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                functionExpressionTypeParametersPairs(),
                'FunctionExpression.typeParameters',
            ),
            id: visitOptionalNode(
                target.id,
                originalSource,
                functionExpressionIdPairs(),
                'FunctionExpression.id',
            ),
            body: visitNode(
                target.body,
                originalSource,
                functionExpressionBodyPairs(),
                'FunctionExpression.body',
            ),
            predicate: visitOptionalNode(
                target.predicate,
                originalSource,
                flowPredicateVisitorEvaluatePairs(),
                'FlowPredicateVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): FunctionExpressionFields {
        return this.value;
    }

    getParams(): FunctionExpressionFields['params'] {
        return this.value.params;
    }

    getGenerator(): FunctionExpressionFields['generator'] {
        return this.value.generator;
    }

    getAsync(): FunctionExpressionFields['async'] {
        return this.value.async;
    }

    getReturnType(): FunctionExpressionFields['returnType'] {
        return this.value.returnType;
    }

    getTypeParameters(): FunctionExpressionFields['typeParameters'] {
        return this.value.typeParameters;
    }

    getId(): FunctionExpressionFields['id'] {
        return this.value.id;
    }

    getBody(): FunctionExpressionFields['body'] {
        return this.value.body;
    }

    getPredicate(): FunctionExpressionFields['predicate'] {
        return this.value.predicate;
    }
}

export const functionExpressionTypePair: EvaluatePair<
    FunctionExpression,
    FunctionExpressionTypeClass
> = makeEvaluatePair(isFunctionExpression, (target, originalSource) =>
    FunctionExpressionTypeClass.create(target, originalSource),
);

export const isFunctionExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is FunctionExpressionTypeClass => target instanceof FunctionExpressionTypeClass;
