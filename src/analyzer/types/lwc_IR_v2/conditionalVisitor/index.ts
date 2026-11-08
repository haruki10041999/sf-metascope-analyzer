import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import {
    ConditionalExpressionTypeClass,
    conditionalExpressionTypePair,
} from '../commons/conditionalExpression';
import { IfStatementTypeClass, ifStatementTypePair } from '../commons/ifStatement';

export {
    ConditionalExpressionTypeClass,
    conditionalExpressionTypePair,
    isConditionalExpressionType,
} from '../commons/conditionalExpression';
export {
    IfStatementTypeClass,
    ifStatementTypePair,
    isIfStatementType,
} from '../commons/ifStatement';

export const conditionalVisitorEvaluatePairs = lazyPairs(
    () => [conditionalExpressionTypePair, ifStatementTypePair] as const,
);

export class ConditionalVisitor extends LwcCommonVisitor<
    ReturnType<typeof conditionalVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return conditionalVisitorEvaluatePairs();
    }
}

export type ConditionalTypeClass = ConditionalExpressionTypeClass | IfStatementTypeClass;

export const isConditionalType = (
    target: LwcCommonTypeClass<string>,
): target is ConditionalTypeClass => {
    return (
        target instanceof ConditionalExpressionTypeClass || target instanceof IfStatementTypeClass
    );
};
