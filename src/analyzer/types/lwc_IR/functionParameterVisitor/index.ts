import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import { IdentifierTypeClass, identifierTypePair } from '../commons/identifier';
import { RestElementTypeClass, restElementTypePair } from '../commons/restElement';
import {
    AssignmentPatternTypeClass,
    assignmentPatternTypePair,
} from '../commons/assignmentPattern';
import { ArrayPatternTypeClass, arrayPatternTypePair } from '../commons/arrayPattern';
import { ObjectPatternTypeClass, objectPatternTypePair } from '../commons/objectPattern';
import { VoidPatternTypeClass, voidPatternTypePair } from '../commons/voidPattern';

export { IdentifierTypeClass, identifierTypePair, isIdentifierType } from '../commons/identifier';
export {
    RestElementTypeClass,
    restElementTypePair,
    isRestElementType,
} from '../commons/restElement';
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

export const functionParameterVisitorEvaluatePairs = lazyPairs(
    () =>
        [
            identifierTypePair,
            restElementTypePair,
            assignmentPatternTypePair,
            arrayPatternTypePair,
            objectPatternTypePair,
            voidPatternTypePair,
        ] as const,
);

export class FunctionParameterVisitor extends LwcCommonVisitor<
    ReturnType<typeof functionParameterVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return functionParameterVisitorEvaluatePairs();
    }
}

export type FunctionParameterTypeClass =
    | IdentifierTypeClass
    | RestElementTypeClass
    | AssignmentPatternTypeClass
    | ArrayPatternTypeClass
    | ObjectPatternTypeClass
    | VoidPatternTypeClass;

export const isFunctionParameterType = (
    target: LwcCommonTypeClass<string>,
): target is FunctionParameterTypeClass => {
    return (
        target instanceof IdentifierTypeClass ||
        target instanceof RestElementTypeClass ||
        target instanceof AssignmentPatternTypeClass ||
        target instanceof ArrayPatternTypeClass ||
        target instanceof ObjectPatternTypeClass ||
        target instanceof VoidPatternTypeClass
    );
};
