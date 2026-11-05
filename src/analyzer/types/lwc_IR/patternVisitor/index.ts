import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import {
    AssignmentPatternTypeClass,
    assignmentPatternTypePair,
} from '../commons/assignmentPattern';
import { ArrayPatternTypeClass, arrayPatternTypePair } from '../commons/arrayPattern';
import { ObjectPatternTypeClass, objectPatternTypePair } from '../commons/objectPattern';
import { VoidPatternTypeClass, voidPatternTypePair } from '../commons/voidPattern';

export {
    AssignmentPatternTypeClass,
    assignmentPatternTypePair,
    isAssignmentPatternType,
} from '../commons/assignmentPattern';
export {
    ArrayPatternTypeClass,
    arrayPatternTypePair,
    isArrayPatternType,
} from '../commons/arrayPattern';
export {
    ObjectPatternTypeClass,
    objectPatternTypePair,
    isObjectPatternType,
} from '../commons/objectPattern';
export {
    VoidPatternTypeClass,
    voidPatternTypePair,
    isVoidPatternType,
} from '../commons/voidPattern';

export const patternVisitorEvaluatePairs = lazyPairs(
    () =>
        [
            assignmentPatternTypePair,
            arrayPatternTypePair,
            objectPatternTypePair,
            voidPatternTypePair,
        ] as const,
);

export class PatternVisitor extends LwcCommonVisitor<
    ReturnType<typeof patternVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return patternVisitorEvaluatePairs();
    }
}

export type PatternTypeClass =
    | AssignmentPatternTypeClass
    | ArrayPatternTypeClass
    | ObjectPatternTypeClass
    | VoidPatternTypeClass;

export const isPatternType = (target: LwcCommonTypeClass<string>): target is PatternTypeClass => {
    return (
        target instanceof AssignmentPatternTypeClass ||
        target instanceof ArrayPatternTypeClass ||
        target instanceof ObjectPatternTypeClass ||
        target instanceof VoidPatternTypeClass
    );
};
