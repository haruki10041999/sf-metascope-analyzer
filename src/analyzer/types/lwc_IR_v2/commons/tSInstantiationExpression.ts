import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSInstantiationExpression, type TSInstantiationExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { TSTypeParameterInstantiationTypeClass } from '../typeScriptVisitor/tSTypeParameterInstantiation';

export type TSInstantiationExpressionFields = TypeField<'tSInstantiationExpression'> & {
    expression: ExpressionTypeClass;
    typeArguments: TSTypeParameterInstantiationTypeClass | null;
};

export class TSInstantiationExpressionTypeClass extends LwcCommonTypeClass<
    'tSInstantiationExpression',
    TSInstantiationExpressionFields
> {
    private constructor(value: FieldsOf<TSInstantiationExpressionFields>, sourceSpan: SourceSpan) {
        super('tSInstantiationExpression', value, sourceSpan);
    }

    static create(
        target: TSInstantiationExpression,
        originalSource: string,
    ): TSInstantiationExpressionTypeClass {
        return new TSInstantiationExpressionTypeClass(
            {
                expression: visitNode(
                    target.expression,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'ExpressionVisitor',
                ),
                typeArguments:
                    target.typeArguments == null
                        ? null
                        : TSTypeParameterInstantiationTypeClass.create(
                              target.typeArguments,
                              originalSource,
                          ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getExpression(): TSInstantiationExpressionFields['expression'] {
        return this.getFields().expression;
    }

    getTypeArguments(): TSInstantiationExpressionFields['typeArguments'] {
        return this.getFields().typeArguments;
    }
}

export const tSInstantiationExpressionTypePair: EvaluatePair<
    TSInstantiationExpression,
    TSInstantiationExpressionTypeClass
> = makeEvaluatePair(isTSInstantiationExpression, (target, originalSource) =>
    TSInstantiationExpressionTypeClass.create(target, originalSource),
);

export const isTSInstantiationExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSInstantiationExpressionTypeClass =>
    target instanceof TSInstantiationExpressionTypeClass;
