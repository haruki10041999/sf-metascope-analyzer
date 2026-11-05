import { isUnaryExpression, type UnaryExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type UnaryExpressionFields = {
    prefix: UnaryExpression['prefix'];
    argument: ExpressionTypeClass | LwcErrorTypeClass;
    operator: UnaryExpression['operator'];
};

export class UnaryExpressionTypeClass extends LwcCommonTypeClass<'unaryExpression'> {
    private readonly value: UnaryExpressionFields;

    private constructor(value: UnaryExpressionFields) {
        super('unaryExpression');
        this.value = value;
    }

    static create(target: UnaryExpression, originalSource: string): UnaryExpressionTypeClass {
        return new UnaryExpressionTypeClass({
            prefix: target.prefix,
            argument: visitNode(
                target.argument,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
            operator: target.operator,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): UnaryExpressionFields {
        return this.value;
    }

    getPrefix(): UnaryExpressionFields['prefix'] {
        return this.value.prefix;
    }

    getArgument(): UnaryExpressionFields['argument'] {
        return this.value.argument;
    }

    getOperator(): UnaryExpressionFields['operator'] {
        return this.value.operator;
    }
}

export const unaryExpressionTypePair: EvaluatePair<UnaryExpression, UnaryExpressionTypeClass> =
    makeEvaluatePair(isUnaryExpression, (target, originalSource) =>
        UnaryExpressionTypeClass.create(target, originalSource),
    );

export const isUnaryExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is UnaryExpressionTypeClass => target instanceof UnaryExpressionTypeClass;
