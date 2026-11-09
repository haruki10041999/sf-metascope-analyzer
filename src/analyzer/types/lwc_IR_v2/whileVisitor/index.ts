import { type TypeField } from '../../commons/ir';
import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import { DoWhileStatementTypeClass, doWhileStatementTypePair } from '../commons/doWhileStatement';
import { WhileStatementTypeClass, whileStatementTypePair } from '../commons/whileStatement';

export {
    DoWhileStatementTypeClass,
    doWhileStatementTypePair,
    isDoWhileStatementType,
} from '../commons/doWhileStatement';
export {
    WhileStatementTypeClass,
    whileStatementTypePair,
    isWhileStatementType,
} from '../commons/whileStatement';

export const whileVisitorEvaluatePairs = lazyPairs(
    () => [doWhileStatementTypePair, whileStatementTypePair] as const,
);

export class WhileVisitor extends LwcCommonVisitor<
    ReturnType<typeof whileVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return whileVisitorEvaluatePairs();
    }
}

export type WhileTypeClass = DoWhileStatementTypeClass | WhileStatementTypeClass;

export const isWhileType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is WhileTypeClass => {
    return target instanceof DoWhileStatementTypeClass || target instanceof WhileStatementTypeClass;
};
