import { LwcCommonTypeClass, LwcCommonVisitor } from '../commonVisitor';
import { IdentifierTypeClass, identifierTypePair } from '../commons/identifier';
import { ThisExpressionTypeClass, thisExpressionTypePair } from '../commons/thisExpression';
import { TSQualifiedNameTypeClass, tSQualifiedNameTypePair } from '../commons/tSQualifiedName';

export { IdentifierTypeClass, identifierTypePair, isIdentifierType } from '../commons/identifier';
export {
    ThisExpressionTypeClass,
    thisExpressionTypePair,
    isThisExpressionType,
} from '../commons/thisExpression';
export {
    TSQualifiedNameTypeClass,
    tSQualifiedNameTypePair,
    isTSQualifiedNameType,
} from '../commons/tSQualifiedName';

const tSEntityNameVisitorEvaluatePairs = [
    identifierTypePair,
    thisExpressionTypePair,
    tSQualifiedNameTypePair,
] as const;

export class TSEntityNameVisitor extends LwcCommonVisitor<
    (typeof tSEntityNameVisitorEvaluatePairs)[number]
> {
    readonly evaluatePair = tSEntityNameVisitorEvaluatePairs;
}

export type TSEntityNameTypeClass =
    IdentifierTypeClass | ThisExpressionTypeClass | TSQualifiedNameTypeClass;

export const isTSEntityNameType = (
    target: LwcCommonTypeClass<string>,
): target is TSEntityNameTypeClass => {
    return (
        target instanceof IdentifierTypeClass ||
        target instanceof ThisExpressionTypeClass ||
        target instanceof TSQualifiedNameTypeClass
    );
};
