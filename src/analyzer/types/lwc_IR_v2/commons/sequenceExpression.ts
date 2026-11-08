import { isSequenceExpression, type SequenceExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type SequenceExpressionFields = {
    expressions: (ExpressionTypeClass | LwcErrorTypeClass)[];
};

export class SequenceExpressionTypeClass extends LwcCommonTypeClass<'sequenceExpression'> {
    private readonly value: SequenceExpressionFields;

    private constructor(value: SequenceExpressionFields) {
        super('sequenceExpression');
        this.value = value;
    }

    static create(target: SequenceExpression, originalSource: string): SequenceExpressionTypeClass {
        return new SequenceExpressionTypeClass({
            expressions: visitNodeList(
                target.expressions,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): SequenceExpressionFields {
        return this.value;
    }

    getExpressions(): SequenceExpressionFields['expressions'] {
        return this.value.expressions;
    }
}

export const sequenceExpressionTypePair: EvaluatePair<
    SequenceExpression,
    SequenceExpressionTypeClass
> = makeEvaluatePair(isSequenceExpression, (target, originalSource) =>
    SequenceExpressionTypeClass.create(target, originalSource),
);

export const isSequenceExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is SequenceExpressionTypeClass => target instanceof SequenceExpressionTypeClass;
