import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import { BinaryExpressionTypeClass, binaryExpressionTypePair } from '../commons/binaryExpression';
import {
    LogicalExpressionTypeClass,
    logicalExpressionTypePair,
} from '../commons/logicalExpression';

export {
    BinaryExpressionTypeClass,
    binaryExpressionTypePair,
    isBinaryExpressionType,
} from '../commons/binaryExpression';
export {
    LogicalExpressionTypeClass,
    logicalExpressionTypePair,
    isLogicalExpressionType,
} from '../commons/logicalExpression';

export const binaryVisitorEvaluatePairs = lazyPairs(
    () => [binaryExpressionTypePair, logicalExpressionTypePair] as const,
);

export class BinaryVisitor extends LwcCommonVisitor<
    ReturnType<typeof binaryVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return binaryVisitorEvaluatePairs();
    }
}

export type BinaryTypeClass = BinaryExpressionTypeClass | LogicalExpressionTypeClass;

export const isBinaryType = (target: LwcCommonTypeClass<string>): target is BinaryTypeClass => {
    return (
        target instanceof BinaryExpressionTypeClass || target instanceof LogicalExpressionTypeClass
    );
};
