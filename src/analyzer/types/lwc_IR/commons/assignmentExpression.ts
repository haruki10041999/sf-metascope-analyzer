import { isAssignmentExpression, type AssignmentExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class AssignmentExpressionTypeClass extends LwcCommonTypeClass<'assignmentExpression'> {
    private constructor(originalSource: string) {
        super('assignmentExpression', originalSource);
    }

    static create(
        target: AssignmentExpression,
        originalSource: string,
    ): AssignmentExpressionTypeClass {
        throw new Error('AssignmentExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const assignmentExpressionTypePair: EvaluatePair<
    AssignmentExpression,
    AssignmentExpressionTypeClass
> = makeEvaluatePair(isAssignmentExpression, (target, originalSource) =>
    AssignmentExpressionTypeClass.create(target, originalSource),
);

export const isAssignmentExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is AssignmentExpressionTypeClass => target instanceof AssignmentExpressionTypeClass;
