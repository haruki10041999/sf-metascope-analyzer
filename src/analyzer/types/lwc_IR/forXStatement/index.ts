import { LwcCommonTypeClass, LwcCommonVisitor } from '../commonVisitor';
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

const forXStatementVisitorEvaluatePairs = [forInStatementTypePair, forOfStatementTypePair] as const;

export class ForXStatementVisitor extends LwcCommonVisitor<
    (typeof forXStatementVisitorEvaluatePairs)[number]
> {
    readonly evaluatePair = forXStatementVisitorEvaluatePairs;
}

export type ForXStatementTypeClass = ForInStatementTypeClass | ForOfStatementTypeClass;

export const isForXStatementType = (
    target: LwcCommonTypeClass<string>,
): target is ForXStatementTypeClass => {
    return target instanceof ForInStatementTypeClass || target instanceof ForOfStatementTypeClass;
};
