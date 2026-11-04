import { LwcCommonTypeClass, LwcCommonVisitor } from '../commonVisitor';
import { ForInStatementTypeClass, forInStatementTypePair } from '../commons/forInStatement';
import { ForStatementTypeClass, forStatementTypePair } from '../commons/forStatement';
import { ForOfStatementTypeClass, forOfStatementTypePair } from '../commons/forOfStatement';

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
    ForOfStatementTypeClass,
    forOfStatementTypePair,
    isForOfStatementType,
} from '../commons/forOfStatement';

const forVisitorEvaluatePairs = [
    forInStatementTypePair,
    forStatementTypePair,
    forOfStatementTypePair,
] as const;

export class ForVisitor extends LwcCommonVisitor<(typeof forVisitorEvaluatePairs)[number]> {
    readonly evaluatePair = forVisitorEvaluatePairs;
}

export type ForTypeClass =
    ForInStatementTypeClass | ForStatementTypeClass | ForOfStatementTypeClass;

export const isForType = (target: LwcCommonTypeClass<string>): target is ForTypeClass => {
    return (
        target instanceof ForInStatementTypeClass ||
        target instanceof ForStatementTypeClass ||
        target instanceof ForOfStatementTypeClass
    );
};
