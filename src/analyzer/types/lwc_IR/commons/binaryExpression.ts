import { isBinaryExpression, type BinaryExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { privateNameTypePair, type PrivateNameTypeClass } from './privateName';

const binaryExpressionLeftPairs = lazyPairs(
    () => [...expressionVisitorEvaluatePairs(), privateNameTypePair] as const,
);

export type BinaryExpressionFields = {
    operator: BinaryExpression['operator'];
    left: ExpressionTypeClass | PrivateNameTypeClass | LwcErrorTypeClass;
    right: ExpressionTypeClass | LwcErrorTypeClass;
};

export class BinaryExpressionTypeClass extends LwcCommonTypeClass<'binaryExpression'> {
    private readonly value: BinaryExpressionFields;

    private constructor(value: BinaryExpressionFields) {
        super('binaryExpression');
        this.value = value;
    }

    static create(target: BinaryExpression, originalSource: string): BinaryExpressionTypeClass {
        return new BinaryExpressionTypeClass({
            operator: target.operator,
            left: visitNode(
                target.left,
                originalSource,
                binaryExpressionLeftPairs(),
                'BinaryExpression.left',
            ),
            right: visitNode(
                target.right,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): BinaryExpressionFields {
        return this.value;
    }

    getOperator(): BinaryExpressionFields['operator'] {
        return this.value.operator;
    }

    getLeft(): BinaryExpressionFields['left'] {
        return this.value.left;
    }

    getRight(): BinaryExpressionFields['right'] {
        return this.value.right;
    }
}

export const binaryExpressionTypePair: EvaluatePair<BinaryExpression, BinaryExpressionTypeClass> =
    makeEvaluatePair(isBinaryExpression, (target, originalSource) =>
        BinaryExpressionTypeClass.create(target, originalSource),
    );

export const isBinaryExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is BinaryExpressionTypeClass => target instanceof BinaryExpressionTypeClass;
