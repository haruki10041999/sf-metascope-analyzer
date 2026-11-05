import { isBindExpression, type BindExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from './index';

export type BindExpressionFields = {
    object: ExpressionTypeClass | LwcErrorTypeClass | null;
    callee: ExpressionTypeClass | LwcErrorTypeClass;
};

export class BindExpressionTypeClass extends LwcCommonTypeClass<'bindExpression'> {
    private readonly value: BindExpressionFields;

    private constructor(value: BindExpressionFields) {
        super('bindExpression');
        this.value = value;
    }

    static create(target: BindExpression, originalSource: string): BindExpressionTypeClass {
        return new BindExpressionTypeClass({
            object: visitOptionalNode(
                target.object,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
            callee: visitNode(
                target.callee,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): BindExpressionFields {
        return this.value;
    }

    getObject(): BindExpressionFields['object'] {
        return this.value.object;
    }

    getCallee(): BindExpressionFields['callee'] {
        return this.value.callee;
    }
}

export const bindExpressionTypePair: EvaluatePair<BindExpression, BindExpressionTypeClass> =
    makeEvaluatePair(isBindExpression, (target, originalSource) =>
        BindExpressionTypeClass.create(target, originalSource),
    );

export const isBindExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is BindExpressionTypeClass => target instanceof BindExpressionTypeClass;
