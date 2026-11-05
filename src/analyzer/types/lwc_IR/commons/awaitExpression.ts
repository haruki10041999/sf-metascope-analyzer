import { isAwaitExpression, type AwaitExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type AwaitExpressionFields = {
    argument: ExpressionTypeClass | LwcErrorTypeClass;
};

export class AwaitExpressionTypeClass extends LwcCommonTypeClass<'awaitExpression'> {
    private readonly value: AwaitExpressionFields;

    private constructor(value: AwaitExpressionFields) {
        super('awaitExpression');
        this.value = value;
    }

    static create(target: AwaitExpression, originalSource: string): AwaitExpressionTypeClass {
        return new AwaitExpressionTypeClass({
            argument: visitNode(
                target.argument,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): AwaitExpressionFields {
        return this.value;
    }

    getArgument(): AwaitExpressionFields['argument'] {
        return this.value.argument;
    }
}

export const awaitExpressionTypePair: EvaluatePair<AwaitExpression, AwaitExpressionTypeClass> =
    makeEvaluatePair(isAwaitExpression, (target, originalSource) =>
        AwaitExpressionTypeClass.create(target, originalSource),
    );

export const isAwaitExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is AwaitExpressionTypeClass => target instanceof AwaitExpressionTypeClass;
