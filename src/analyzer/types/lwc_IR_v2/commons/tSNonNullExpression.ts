import { isTSNonNullExpression, type TSNonNullExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type TSNonNullExpressionFields = {
    expression: ExpressionTypeClass | LwcErrorTypeClass;
};

export class TSNonNullExpressionTypeClass extends LwcCommonTypeClass<'tSNonNullExpression'> {
    private readonly value: TSNonNullExpressionFields;

    private constructor(value: TSNonNullExpressionFields) {
        super('tSNonNullExpression');
        this.value = value;
    }

    static create(
        target: TSNonNullExpression,
        originalSource: string,
    ): TSNonNullExpressionTypeClass {
        return new TSNonNullExpressionTypeClass({
            expression: visitNode(
                target.expression,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSNonNullExpressionFields {
        return this.value;
    }

    getExpression(): TSNonNullExpressionFields['expression'] {
        return this.value.expression;
    }
}

export const tSNonNullExpressionTypePair: EvaluatePair<
    TSNonNullExpression,
    TSNonNullExpressionTypeClass
> = makeEvaluatePair(isTSNonNullExpression, (target, originalSource) =>
    TSNonNullExpressionTypeClass.create(target, originalSource),
);

export const isTSNonNullExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is TSNonNullExpressionTypeClass => target instanceof TSNonNullExpressionTypeClass;
