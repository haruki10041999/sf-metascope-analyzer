import { LwcCommonTypeClass, LwcCommonVisitor } from '../commonVisitor';
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

const binaryVisitorEvaluatePairs = [binaryExpressionTypePair, logicalExpressionTypePair] as const;

export class BinaryVisitor extends LwcCommonVisitor<(typeof binaryVisitorEvaluatePairs)[number]> {
    readonly evaluatePair = binaryVisitorEvaluatePairs;
}

export type BinaryTypeClass = BinaryExpressionTypeClass | LogicalExpressionTypeClass;

export const isBinaryType = (target: LwcCommonTypeClass<string>): target is BinaryTypeClass => {
    return (
        target instanceof BinaryExpressionTypeClass || target instanceof LogicalExpressionTypeClass
    );
};
