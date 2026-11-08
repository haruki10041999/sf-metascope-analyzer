import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import { UnaryExpressionTypeClass, unaryExpressionTypePair } from '../commons/unaryExpression';
import { SpreadElementTypeClass, spreadElementTypePair } from '../commons/spreadElement';

export {
    UnaryExpressionTypeClass,
    unaryExpressionTypePair,
    isUnaryExpressionType,
} from '../commons/unaryExpression';
export {
    SpreadElementTypeClass,
    spreadElementTypePair,
    isSpreadElementType,
} from '../commons/spreadElement';

export const unaryLikeVisitorEvaluatePairs = lazyPairs(
    () => [unaryExpressionTypePair, spreadElementTypePair] as const,
);

export class UnaryLikeVisitor extends LwcCommonVisitor<
    ReturnType<typeof unaryLikeVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return unaryLikeVisitorEvaluatePairs();
    }
}

export type UnaryLikeTypeClass = UnaryExpressionTypeClass | SpreadElementTypeClass;

export const isUnaryLikeType = (
    target: LwcCommonTypeClass<string>,
): target is UnaryLikeTypeClass => {
    return target instanceof UnaryExpressionTypeClass || target instanceof SpreadElementTypeClass;
};
