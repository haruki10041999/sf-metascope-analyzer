import { type TypeField } from '../../commons/ir';
import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import { BreakStatementTypeClass, breakStatementTypePair } from '../commons/breakStatement';
import {
    ContinueStatementTypeClass,
    continueStatementTypePair,
} from '../commons/continueStatement';
import { ReturnStatementTypeClass, returnStatementTypePair } from '../commons/returnStatement';
import { ThrowStatementTypeClass, throwStatementTypePair } from '../commons/throwStatement';

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

export const completionStatementVisitorEvaluatePairs = lazyPairs(
    () =>
        [
            breakStatementTypePair,
            continueStatementTypePair,
            returnStatementTypePair,
            throwStatementTypePair,
        ] as const,
);

export class CompletionStatementVisitor extends LwcCommonVisitor<
    ReturnType<typeof completionStatementVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return completionStatementVisitorEvaluatePairs();
    }
}

export type CompletionStatementTypeClass =
    | BreakStatementTypeClass
    | ContinueStatementTypeClass
    | ReturnStatementTypeClass
    | ThrowStatementTypeClass;

export const isCompletionStatementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is CompletionStatementTypeClass => {
    return (
        target instanceof BreakStatementTypeClass ||
        target instanceof ContinueStatementTypeClass ||
        target instanceof ReturnStatementTypeClass ||
        target instanceof ThrowStatementTypeClass
    );
};
