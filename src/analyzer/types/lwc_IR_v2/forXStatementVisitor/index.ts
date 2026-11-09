import { type TypeField } from '../../commons/ir';
import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import { ForInStatementTypeClass, forInStatementTypePair } from '../commons/forInStatement';
import { ForOfStatementTypeClass, forOfStatementTypePair } from '../commons/forOfStatement';

export {
    ForInStatementTypeClass,
    forInStatementTypePair,
    isForInStatementType,
} from '../commons/forInStatement';
export {
    ForOfStatementTypeClass,
    forOfStatementTypePair,
    isForOfStatementType,
} from '../commons/forOfStatement';

export const forXStatementVisitorEvaluatePairs = lazyPairs(
    () => [forInStatementTypePair, forOfStatementTypePair] as const,
);

export class ForXStatementVisitor extends LwcCommonVisitor<
    ReturnType<typeof forXStatementVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return forXStatementVisitorEvaluatePairs();
    }
}

export type ForXStatementTypeClass = ForInStatementTypeClass | ForOfStatementTypeClass;

export const isForXStatementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ForXStatementTypeClass => {
    return target instanceof ForInStatementTypeClass || target instanceof ForOfStatementTypeClass;
};
