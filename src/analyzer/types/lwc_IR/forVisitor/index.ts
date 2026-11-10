import { type TypeField } from '../../commons/ir';
import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
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

export const forVisitorEvaluatePairs = lazyPairs(
    () => [forInStatementTypePair, forStatementTypePair, forOfStatementTypePair] as const,
);

export class ForVisitor extends LwcCommonVisitor<
    ReturnType<typeof forVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return forVisitorEvaluatePairs();
    }
}

export type ForTypeClass =
    ForInStatementTypeClass | ForStatementTypeClass | ForOfStatementTypeClass;

export const isForType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ForTypeClass => {
    return (
        target instanceof ForInStatementTypeClass ||
        target instanceof ForStatementTypeClass ||
        target instanceof ForOfStatementTypeClass
    );
};
