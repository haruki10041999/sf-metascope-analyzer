import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import { IdentifierTypeClass, identifierTypePair } from '../commons/identifier';
import { MemberExpressionTypeClass, memberExpressionTypePair } from '../commons/memberExpression';
import { RestElementTypeClass, restElementTypePair } from '../commons/restElement';
import {
    AssignmentPatternTypeClass,
    assignmentPatternTypePair,
} from '../commons/assignmentPattern';
import { ArrayPatternTypeClass, arrayPatternTypePair } from '../commons/arrayPattern';
import { ObjectPatternTypeClass, objectPatternTypePair } from '../commons/objectPattern';
import { VoidPatternTypeClass, voidPatternTypePair } from '../commons/voidPattern';
import { TSAsExpressionTypeClass, tSAsExpressionTypePair } from '../commons/tSAsExpression';
import {
    TSSatisfiesExpressionTypeClass,
    tSSatisfiesExpressionTypePair,
} from '../commons/tSSatisfiesExpression';
import { TSTypeAssertionTypeClass, tSTypeAssertionTypePair } from '../commons/tSTypeAssertion';
import {
    TSNonNullExpressionTypeClass,
    tSNonNullExpressionTypePair,
} from '../commons/tSNonNullExpression';

export { IdentifierTypeClass, identifierTypePair, isIdentifierType } from '../commons/identifier';
export {
    MemberExpressionTypeClass,
    memberExpressionTypePair,
    isMemberExpressionType,
} from '../commons/memberExpression';
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
export {
    TSAsExpressionTypeClass,
    tSAsExpressionTypePair,
    isTSAsExpressionType,
} from '../commons/tSAsExpression';
export {
    TSSatisfiesExpressionTypeClass,
    tSSatisfiesExpressionTypePair,
    isTSSatisfiesExpressionType,
} from '../commons/tSSatisfiesExpression';
export {
    TSTypeAssertionTypeClass,
    tSTypeAssertionTypePair,
    isTSTypeAssertionType,
} from '../commons/tSTypeAssertion';
export {
    TSNonNullExpressionTypeClass,
    tSNonNullExpressionTypePair,
    isTSNonNullExpressionType,
} from '../commons/tSNonNullExpression';

export const patternLikeVisitorEvaluatePairs = lazyPairs(
    () =>
        [
            identifierTypePair,
            memberExpressionTypePair,
            restElementTypePair,
            assignmentPatternTypePair,
            arrayPatternTypePair,
            objectPatternTypePair,
            voidPatternTypePair,
            tSAsExpressionTypePair,
            tSSatisfiesExpressionTypePair,
            tSTypeAssertionTypePair,
            tSNonNullExpressionTypePair,
        ] as const,
);

export class PatternLikeVisitor extends LwcCommonVisitor<
    ReturnType<typeof patternLikeVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return patternLikeVisitorEvaluatePairs();
    }
}

export type PatternLikeTypeClass =
    | IdentifierTypeClass
    | MemberExpressionTypeClass
    | RestElementTypeClass
    | AssignmentPatternTypeClass
    | ArrayPatternTypeClass
    | ObjectPatternTypeClass
    | VoidPatternTypeClass
    | TSAsExpressionTypeClass
    | TSSatisfiesExpressionTypeClass
    | TSTypeAssertionTypeClass
    | TSNonNullExpressionTypeClass;

export const isPatternLikeType = (
    target: LwcCommonTypeClass<string>,
): target is PatternLikeTypeClass => {
    return (
        target instanceof IdentifierTypeClass ||
        target instanceof MemberExpressionTypeClass ||
        target instanceof RestElementTypeClass ||
        target instanceof AssignmentPatternTypeClass ||
        target instanceof ArrayPatternTypeClass ||
        target instanceof ObjectPatternTypeClass ||
        target instanceof VoidPatternTypeClass ||
        target instanceof TSAsExpressionTypeClass ||
        target instanceof TSSatisfiesExpressionTypeClass ||
        target instanceof TSTypeAssertionTypeClass ||
        target instanceof TSNonNullExpressionTypeClass
    );
};
