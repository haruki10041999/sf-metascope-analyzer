import { type TypeField } from '../../commons/ir';
import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import { IdentifierTypeClass, identifierTypePair } from '../commons/identifier';
import { MemberExpressionTypeClass, memberExpressionTypePair } from '../commons/memberExpression';
import { ArrayPatternTypeClass, arrayPatternTypePair } from '../commons/arrayPattern';
import { ObjectPatternTypeClass, objectPatternTypePair } from '../commons/objectPattern';
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

export const lValVisitorEvaluatePairs = lazyPairs(
    () =>
        [
            identifierTypePair,
            memberExpressionTypePair,
            arrayPatternTypePair,
            objectPatternTypePair,
            tSAsExpressionTypePair,
            tSSatisfiesExpressionTypePair,
            tSTypeAssertionTypePair,
            tSNonNullExpressionTypePair,
        ] as const,
);

export class LValVisitor extends LwcCommonVisitor<
    ReturnType<typeof lValVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return lValVisitorEvaluatePairs();
    }
}

export type LValTypeClass =
    | IdentifierTypeClass
    | MemberExpressionTypeClass
    | ArrayPatternTypeClass
    | ObjectPatternTypeClass
    | TSAsExpressionTypeClass
    | TSSatisfiesExpressionTypeClass
    | TSTypeAssertionTypeClass
    | TSNonNullExpressionTypeClass;

export const isLValType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is LValTypeClass => {
    return (
        target instanceof IdentifierTypeClass ||
        target instanceof MemberExpressionTypeClass ||
        target instanceof ArrayPatternTypeClass ||
        target instanceof ObjectPatternTypeClass ||
        target instanceof TSAsExpressionTypeClass ||
        target instanceof TSSatisfiesExpressionTypeClass ||
        target instanceof TSTypeAssertionTypeClass ||
        target instanceof TSNonNullExpressionTypeClass
    );
};
