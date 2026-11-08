import { isArrowFunctionExpression, type ArrowFunctionExpression } from '@babel/types';
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
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
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

const arrowFunctionExpressionReturnTypePairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);
const arrowFunctionExpressionTypeParametersPairs = lazyPairs(
    () => [typeParameterDeclarationTypePair, tSTypeParameterDeclarationTypePair] as const,
);
const arrowFunctionExpressionBodyPairs = lazyPairs(
    () => [blockStatementTypePair, ...expressionVisitorEvaluatePairs()] as const,
);

export type ArrowFunctionExpressionFields = {
    params: (FunctionParameterTypeClass | LwcErrorTypeClass)[];
    generator: NonNullable<ArrowFunctionExpression['generator']> | null;
    async: ArrowFunctionExpression['async'];
    returnType: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | LwcErrorTypeClass | null;
    typeParameters:
        | TypeParameterDeclarationTypeClass
        | TSTypeParameterDeclarationTypeClass
        | LwcErrorTypeClass
        | null;
    expression: NonNullable<ArrowFunctionExpression['expression']> | null;
    body: BlockStatementTypeClass | ExpressionTypeClass | LwcErrorTypeClass;
    predicate: FlowPredicateTypeClass | LwcErrorTypeClass | null;
};

export class ArrowFunctionExpressionTypeClass extends LwcCommonTypeClass<'arrowFunctionExpression'> {
    private readonly value: ArrowFunctionExpressionFields;

    private constructor(value: ArrowFunctionExpressionFields) {
        super('arrowFunctionExpression');
        this.value = value;
    }

    static create(
        target: ArrowFunctionExpression,
        originalSource: string,
    ): ArrowFunctionExpressionTypeClass {
        return new ArrowFunctionExpressionTypeClass({
            params: visitNodeList(
                target.params,
                originalSource,
                functionParameterVisitorEvaluatePairs(),
                'FunctionParameterVisitor',
            ),
            generator: target.generator ?? null,
            async: target.async,
            returnType: visitOptionalNode(
                target.returnType,
                originalSource,
                arrowFunctionExpressionReturnTypePairs(),
                'ArrowFunctionExpression.returnType',
            ),
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                arrowFunctionExpressionTypeParametersPairs(),
                'ArrowFunctionExpression.typeParameters',
            ),
            expression: target.expression ?? null,
            body: visitNode(
                target.body,
                originalSource,
                arrowFunctionExpressionBodyPairs(),
                'ArrowFunctionExpression.body',
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
    override getFields(): ArrowFunctionExpressionFields {
        return this.value;
    }

    getParams(): ArrowFunctionExpressionFields['params'] {
        return this.value.params;
    }

    getGenerator(): ArrowFunctionExpressionFields['generator'] {
        return this.value.generator;
    }

    getAsync(): ArrowFunctionExpressionFields['async'] {
        return this.value.async;
    }

    getReturnType(): ArrowFunctionExpressionFields['returnType'] {
        return this.value.returnType;
    }

    getTypeParameters(): ArrowFunctionExpressionFields['typeParameters'] {
        return this.value.typeParameters;
    }

    getExpression(): ArrowFunctionExpressionFields['expression'] {
        return this.value.expression;
    }

    getBody(): ArrowFunctionExpressionFields['body'] {
        return this.value.body;
    }

    getPredicate(): ArrowFunctionExpressionFields['predicate'] {
        return this.value.predicate;
    }
}

export const arrowFunctionExpressionTypePair: EvaluatePair<
    ArrowFunctionExpression,
    ArrowFunctionExpressionTypeClass
> = makeEvaluatePair(isArrowFunctionExpression, (target, originalSource) =>
    ArrowFunctionExpressionTypeClass.create(target, originalSource),
);

export const isArrowFunctionExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is ArrowFunctionExpressionTypeClass => target instanceof ArrowFunctionExpressionTypeClass;
