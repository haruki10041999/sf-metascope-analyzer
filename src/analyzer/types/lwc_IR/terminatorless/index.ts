import { LwcCommonTypeClass, LwcCommonVisitor } from '../commonVisitor';
import { BreakStatementTypeClass, breakStatementTypePair } from '../commons/breakStatement';
import {
    ContinueStatementTypeClass,
    continueStatementTypePair,
} from '../commons/continueStatement';
import { ReturnStatementTypeClass, returnStatementTypePair } from '../commons/returnStatement';
import { ThrowStatementTypeClass, throwStatementTypePair } from '../commons/throwStatement';
import { YieldExpressionTypeClass, yieldExpressionTypePair } from '../commons/yieldExpression';
import { AwaitExpressionTypeClass, awaitExpressionTypePair } from '../commons/awaitExpression';

export {
    BreakStatementTypeClass,
    breakStatementTypePair,
    isBreakStatementType,
} from '../commons/breakStatement';
export {
    ContinueStatementTypeClass,
    continueStatementTypePair,
    isContinueStatementType,
} from '../commons/continueStatement';
export {
    ReturnStatementTypeClass,
    returnStatementTypePair,
    isReturnStatementType,
} from '../commons/returnStatement';
export {
    ThrowStatementTypeClass,
    throwStatementTypePair,
    isThrowStatementType,
} from '../commons/throwStatement';
export {
    YieldExpressionTypeClass,
    yieldExpressionTypePair,
    isYieldExpressionType,
} from '../commons/yieldExpression';
export {
    AwaitExpressionTypeClass,
    awaitExpressionTypePair,
    isAwaitExpressionType,
} from '../commons/awaitExpression';

const terminatorlessVisitorEvaluatePairs = [
    breakStatementTypePair,
    continueStatementTypePair,
    returnStatementTypePair,
    throwStatementTypePair,
    yieldExpressionTypePair,
    awaitExpressionTypePair,
] as const;

export class TerminatorlessVisitor extends LwcCommonVisitor<
    (typeof terminatorlessVisitorEvaluatePairs)[number]
> {
    readonly evaluatePair = terminatorlessVisitorEvaluatePairs;
}

export type TerminatorlessTypeClass =
    | BreakStatementTypeClass
    | ContinueStatementTypeClass
    | ReturnStatementTypeClass
    | ThrowStatementTypeClass
    | YieldExpressionTypeClass
    | AwaitExpressionTypeClass;

export const isTerminatorlessType = (
    target: LwcCommonTypeClass<string>,
): target is TerminatorlessTypeClass => {
    return (
        target instanceof BreakStatementTypeClass ||
        target instanceof ContinueStatementTypeClass ||
        target instanceof ReturnStatementTypeClass ||
        target instanceof ThrowStatementTypeClass ||
        target instanceof YieldExpressionTypeClass ||
        target instanceof AwaitExpressionTypeClass
    );
};
