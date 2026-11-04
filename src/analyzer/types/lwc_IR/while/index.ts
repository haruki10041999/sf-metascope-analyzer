import { LwcCommonTypeClass, LwcCommonVisitor } from '../commonVisitor';
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

const whileVisitorEvaluatePairs = [doWhileStatementTypePair, whileStatementTypePair] as const;

export class WhileVisitor extends LwcCommonVisitor<(typeof whileVisitorEvaluatePairs)[number]> {
    readonly evaluatePair = whileVisitorEvaluatePairs;
}

export type WhileTypeClass = DoWhileStatementTypeClass | WhileStatementTypeClass;

export const isWhileType = (target: LwcCommonTypeClass<string>): target is WhileTypeClass => {
    return target instanceof DoWhileStatementTypeClass || target instanceof WhileStatementTypeClass;
};
