import { LwcCommonTypeClass, LwcCommonVisitor } from '../commonVisitor';
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

const unaryLikeVisitorEvaluatePairs = [unaryExpressionTypePair, spreadElementTypePair] as const;

export class UnaryLikeVisitor extends LwcCommonVisitor<
    (typeof unaryLikeVisitorEvaluatePairs)[number]
> {
    readonly evaluatePair = unaryLikeVisitorEvaluatePairs;
}

export type UnaryLikeTypeClass = UnaryExpressionTypeClass | SpreadElementTypeClass;

export const isUnaryLikeType = (
    target: LwcCommonTypeClass<string>,
): target is UnaryLikeTypeClass => {
    return target instanceof UnaryExpressionTypeClass || target instanceof SpreadElementTypeClass;
};
