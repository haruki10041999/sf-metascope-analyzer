import { isYieldExpression, type YieldExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitOptionalNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type YieldExpressionFields = {
    delegate: YieldExpression['delegate'];
    argument: ExpressionTypeClass | LwcErrorTypeClass | null;
};

export class YieldExpressionTypeClass extends LwcCommonTypeClass<'yieldExpression'> {
    private readonly value: YieldExpressionFields;

    private constructor(value: YieldExpressionFields) {
        super('yieldExpression');
        this.value = value;
    }

    static create(target: YieldExpression, originalSource: string): YieldExpressionTypeClass {
        return new YieldExpressionTypeClass({
            delegate: target.delegate,
            argument: visitOptionalNode(
                target.argument,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): YieldExpressionFields {
        return this.value;
    }

    getDelegate(): YieldExpressionFields['delegate'] {
        return this.value.delegate;
    }

    getArgument(): YieldExpressionFields['argument'] {
        return this.value.argument;
    }
}

export const yieldExpressionTypePair: EvaluatePair<YieldExpression, YieldExpressionTypeClass> =
    makeEvaluatePair(isYieldExpression, (target, originalSource) =>
        YieldExpressionTypeClass.create(target, originalSource),
    );

export const isYieldExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is YieldExpressionTypeClass => target instanceof YieldExpressionTypeClass;
