import { isConditionalExpression, type ConditionalExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type ConditionalExpressionFields = {
    test: ExpressionTypeClass | LwcErrorTypeClass;
    consequent: ExpressionTypeClass | LwcErrorTypeClass;
    alternate: ExpressionTypeClass | LwcErrorTypeClass;
};

export class ConditionalExpressionTypeClass extends LwcCommonTypeClass<'conditionalExpression'> {
    private readonly value: ConditionalExpressionFields;

    private constructor(value: ConditionalExpressionFields) {
        super('conditionalExpression');
        this.value = value;
    }

    static create(
        target: ConditionalExpression,
        originalSource: string,
    ): ConditionalExpressionTypeClass {
        return new ConditionalExpressionTypeClass({
            test: visitNode(
                target.test,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
            consequent: visitNode(
                target.consequent,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
            alternate: visitNode(
                target.alternate,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ConditionalExpressionFields {
        return this.value;
    }

    getTest(): ConditionalExpressionFields['test'] {
        return this.value.test;
    }

    getConsequent(): ConditionalExpressionFields['consequent'] {
        return this.value.consequent;
    }

    getAlternate(): ConditionalExpressionFields['alternate'] {
        return this.value.alternate;
    }
}

export const conditionalExpressionTypePair: EvaluatePair<
    ConditionalExpression,
    ConditionalExpressionTypeClass
> = makeEvaluatePair(isConditionalExpression, (target, originalSource) =>
    ConditionalExpressionTypeClass.create(target, originalSource),
);

export const isConditionalExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is ConditionalExpressionTypeClass => target instanceof ConditionalExpressionTypeClass;
