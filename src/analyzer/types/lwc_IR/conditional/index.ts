import { LwcCommonTypeClass, LwcCommonVisitor } from '../commonVisitor';
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

const conditionalVisitorEvaluatePairs = [
    conditionalExpressionTypePair,
    ifStatementTypePair,
] as const;

export class ConditionalVisitor extends LwcCommonVisitor<
    (typeof conditionalVisitorEvaluatePairs)[number]
> {
    readonly evaluatePair = conditionalVisitorEvaluatePairs;
}

export type ConditionalTypeClass = ConditionalExpressionTypeClass | IfStatementTypeClass;

export const isConditionalType = (
    target: LwcCommonTypeClass<string>,
): target is ConditionalTypeClass => {
    return (
        target instanceof ConditionalExpressionTypeClass || target instanceof IfStatementTypeClass
    );
};
