import { isTSInstantiationExpression, type TSInstantiationExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import {
    tSTypeParameterInstantiationTypePair,
    type TSTypeParameterInstantiationTypeClass,
} from '../typeScriptVisitor/tSTypeParameterInstantiation';

const tSInstantiationExpressionTypeArgumentsPairs = lazyPairs(
    () => [tSTypeParameterInstantiationTypePair] as const,
);

export type TSInstantiationExpressionFields = {
    expression: ExpressionTypeClass | LwcErrorTypeClass;
    typeArguments: TSTypeParameterInstantiationTypeClass | LwcErrorTypeClass | null;
};

export class TSInstantiationExpressionTypeClass extends LwcCommonTypeClass<'tSInstantiationExpression'> {
    private readonly value: TSInstantiationExpressionFields;

    private constructor(value: TSInstantiationExpressionFields) {
        super('tSInstantiationExpression');
        this.value = value;
    }

    static create(
        target: TSInstantiationExpression,
        originalSource: string,
    ): TSInstantiationExpressionTypeClass {
        return new TSInstantiationExpressionTypeClass({
            expression: visitNode(
                target.expression,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
            typeArguments: visitOptionalNode(
                target.typeArguments,
                originalSource,
                tSInstantiationExpressionTypeArgumentsPairs(),
                'TSInstantiationExpression.typeArguments',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSInstantiationExpressionFields {
        return this.value;
    }

    getExpression(): TSInstantiationExpressionFields['expression'] {
        return this.value.expression;
    }

    getTypeArguments(): TSInstantiationExpressionFields['typeArguments'] {
        return this.value.typeArguments;
    }
}

export const tSInstantiationExpressionTypePair: EvaluatePair<
    TSInstantiationExpression,
    TSInstantiationExpressionTypeClass
> = makeEvaluatePair(isTSInstantiationExpression, (target, originalSource) =>
    TSInstantiationExpressionTypeClass.create(target, originalSource),
);

export const isTSInstantiationExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is TSInstantiationExpressionTypeClass =>
    target instanceof TSInstantiationExpressionTypeClass;
