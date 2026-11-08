import { isParenthesizedExpression, type ParenthesizedExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type ParenthesizedExpressionFields = {
    expression: ExpressionTypeClass | LwcErrorTypeClass;
};

export class ParenthesizedExpressionTypeClass extends LwcCommonTypeClass<'parenthesizedExpression'> {
    private readonly value: ParenthesizedExpressionFields;

    private constructor(value: ParenthesizedExpressionFields) {
        super('parenthesizedExpression');
        this.value = value;
    }

    static create(
        target: ParenthesizedExpression,
        originalSource: string,
    ): ParenthesizedExpressionTypeClass {
        return new ParenthesizedExpressionTypeClass({
            expression: visitNode(
                target.expression,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ParenthesizedExpressionFields {
        return this.value;
    }

    getExpression(): ParenthesizedExpressionFields['expression'] {
        return this.value.expression;
    }
}

export const parenthesizedExpressionTypePair: EvaluatePair<
    ParenthesizedExpression,
    ParenthesizedExpressionTypeClass
> = makeEvaluatePair(isParenthesizedExpression, (target, originalSource) =>
    ParenthesizedExpressionTypeClass.create(target, originalSource),
);

export const isParenthesizedExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is ParenthesizedExpressionTypeClass => target instanceof ParenthesizedExpressionTypeClass;
