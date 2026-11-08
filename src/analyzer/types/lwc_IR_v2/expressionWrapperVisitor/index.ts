import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import {
    ExpressionStatementTypeClass,
    expressionStatementTypePair,
} from '../commons/expressionStatement';
import {
    ParenthesizedExpressionTypeClass,
    parenthesizedExpressionTypePair,
} from '../commons/parenthesizedExpression';
import {
    TypeCastExpressionTypeClass,
    typeCastExpressionTypePair,
} from '../commons/typeCastExpression';

export {
    ExpressionStatementTypeClass,
    expressionStatementTypePair,
    isExpressionStatementType,
} from '../commons/expressionStatement';
export {
    ParenthesizedExpressionTypeClass,
    parenthesizedExpressionTypePair,
    isParenthesizedExpressionType,
} from '../commons/parenthesizedExpression';
export {
    TypeCastExpressionTypeClass,
    typeCastExpressionTypePair,
    isTypeCastExpressionType,
} from '../commons/typeCastExpression';

export const expressionWrapperVisitorEvaluatePairs = lazyPairs(
    () =>
        [
            expressionStatementTypePair,
            parenthesizedExpressionTypePair,
            typeCastExpressionTypePair,
        ] as const,
);

export class ExpressionWrapperVisitor extends LwcCommonVisitor<
    ReturnType<typeof expressionWrapperVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return expressionWrapperVisitorEvaluatePairs();
    }
}

export type ExpressionWrapperTypeClass =
    ExpressionStatementTypeClass | ParenthesizedExpressionTypeClass | TypeCastExpressionTypeClass;

export const isExpressionWrapperType = (
    target: LwcCommonTypeClass<string>,
): target is ExpressionWrapperTypeClass => {
    return (
        target instanceof ExpressionStatementTypeClass ||
        target instanceof ParenthesizedExpressionTypeClass ||
        target instanceof TypeCastExpressionTypeClass
    );
};
