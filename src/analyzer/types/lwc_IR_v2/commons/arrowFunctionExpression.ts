import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import {
    isArrowFunctionExpression,
    isBlockStatement,
    type ArrowFunctionExpression,
} from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitNodeList,
    visitOptionalNode,
    getSourceSpan,
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
import { BlockStatementTypeClass } from './blockStatement';

const arrowFunctionExpressionReturnTypePairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);
const arrowFunctionExpressionTypeParametersPairs = lazyPairs(
    () => [typeParameterDeclarationTypePair, tSTypeParameterDeclarationTypePair] as const,
);

/** アロー関数の本体。式 (`x => x + 1`) かブロック (`x => { ... }`) */
export type ArrowFunctionBody =
    | { kind: 'expression'; expression: ExpressionTypeClass }
    | { kind: 'block'; block: BlockStatementTypeClass };

export type ArrowFunctionExpressionFields = TypeField<'arrowFunctionExpression'> & {
    params: FunctionParameterTypeClass[];
    async: ArrowFunctionExpression['async'];
    returnType: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | null;
    typeParameters: TypeParameterDeclarationTypeClass | TSTypeParameterDeclarationTypeClass | null;
    body: ArrowFunctionBody;
    predicate: FlowPredicateTypeClass | null;
};

export class ArrowFunctionExpressionTypeClass extends LwcCommonTypeClass<
    'arrowFunctionExpression',
    ArrowFunctionExpressionFields
> {
    private constructor(value: FieldsOf<ArrowFunctionExpressionFields>, sourceSpan: SourceSpan) {
        super('arrowFunctionExpression', value, sourceSpan);
    }

    static create(
        target: ArrowFunctionExpression,
        originalSource: string,
    ): ArrowFunctionExpressionTypeClass {
        return new ArrowFunctionExpressionTypeClass(
            {
                params: visitNodeList(
                    target.params,
                    originalSource,
                    functionParameterVisitorEvaluatePairs(),
                    'FunctionParameterVisitor',
                ),
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
                body: isBlockStatement(target.body)
                    ? {
                          kind: 'block',
                          block: BlockStatementTypeClass.create(target.body, originalSource),
                      }
                    : {
                          kind: 'expression',
                          expression: visitNode(
                              target.body,
                              originalSource,
                              expressionVisitorEvaluatePairs(),
                              'ExpressionVisitor',
                          ),
                      },
                predicate: visitOptionalNode(
                    target.predicate,
                    originalSource,
                    flowPredicateVisitorEvaluatePairs(),
                    'FlowPredicateVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getParams(): ArrowFunctionExpressionFields['params'] {
        return this.getFields().params;
    }

    getAsync(): ArrowFunctionExpressionFields['async'] {
        return this.getFields().async;
    }

    getReturnType(): ArrowFunctionExpressionFields['returnType'] {
        return this.getFields().returnType;
    }

    getTypeParameters(): ArrowFunctionExpressionFields['typeParameters'] {
        return this.getFields().typeParameters;
    }

    getBody(): ArrowFunctionExpressionFields['body'] {
        return this.getFields().body;
    }

    getPredicate(): ArrowFunctionExpressionFields['predicate'] {
        return this.getFields().predicate;
    }
}

export const arrowFunctionExpressionTypePair: EvaluatePair<
    ArrowFunctionExpression,
    ArrowFunctionExpressionTypeClass
> = makeEvaluatePair(isArrowFunctionExpression, (target, originalSource) =>
    ArrowFunctionExpressionTypeClass.create(target, originalSource),
);

export const isArrowFunctionExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ArrowFunctionExpressionTypeClass => target instanceof ArrowFunctionExpressionTypeClass;
