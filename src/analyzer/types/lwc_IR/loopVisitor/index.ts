import { type TypeField } from '../../commons/ir';
import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import { DoWhileStatementTypeClass, doWhileStatementTypePair } from '../commons/doWhileStatement';
import { ForInStatementTypeClass, forInStatementTypePair } from '../commons/forInStatement';
import { ForStatementTypeClass, forStatementTypePair } from '../commons/forStatement';
import { WhileStatementTypeClass, whileStatementTypePair } from '../commons/whileStatement';
import { ForOfStatementTypeClass, forOfStatementTypePair } from '../commons/forOfStatement';

export {
    DoWhileStatementTypeClass,
    doWhileStatementTypePair,
    isDoWhileStatementType,
} from '../commons/doWhileStatement';
export {
    ForInStatementTypeClass,
    forInStatementTypePair,
    isForInStatementType,
} from '../commons/forInStatement';
export {
    ForStatementTypeClass,
    forStatementTypePair,
    isForStatementType,
} from '../commons/forStatement';
export {
    WhileStatementTypeClass,
    whileStatementTypePair,
    isWhileStatementType,
} from '../commons/whileStatement';
export {
    ForOfStatementTypeClass,
    forOfStatementTypePair,
    isForOfStatementType,
} from '../commons/forOfStatement';

export const loopVisitorEvaluatePairs = lazyPairs(
    () =>
        [
            doWhileStatementTypePair,
            forInStatementTypePair,
            forStatementTypePair,
            whileStatementTypePair,
            forOfStatementTypePair,
        ] as const,
);

export class LoopVisitor extends LwcCommonVisitor<
    ReturnType<typeof loopVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return loopVisitorEvaluatePairs();
    }
}

export type LoopTypeClass =
    | DoWhileStatementTypeClass
    | ForInStatementTypeClass
    | ForStatementTypeClass
    | WhileStatementTypeClass
    | ForOfStatementTypeClass;

export const isLoopType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is LoopTypeClass => {
    return (
        target instanceof DoWhileStatementTypeClass ||
        target instanceof ForInStatementTypeClass ||
        target instanceof ForStatementTypeClass ||
        target instanceof WhileStatementTypeClass ||
        target instanceof ForOfStatementTypeClass
    );
};
