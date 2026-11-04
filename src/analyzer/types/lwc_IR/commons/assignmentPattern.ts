import { isAssignmentPattern, type AssignmentPattern } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class AssignmentPatternTypeClass extends LwcCommonTypeClass<'assignmentPattern'> {
    private constructor(originalSource: string) {
        super('assignmentPattern', originalSource);
    }

    static create(target: AssignmentPattern, originalSource: string): AssignmentPatternTypeClass {
        throw new Error('AssignmentPatternTypeClass.create is not implemented: ' + target.type);
    }
}

export const assignmentPatternTypePair: EvaluatePair<
    AssignmentPattern,
    AssignmentPatternTypeClass
> = makeEvaluatePair(isAssignmentPattern, (target, originalSource) =>
    AssignmentPatternTypeClass.create(target, originalSource),
);

export const isAssignmentPatternType = (
    target: LwcCommonTypeClass<string>,
): target is AssignmentPatternTypeClass => target instanceof AssignmentPatternTypeClass;
