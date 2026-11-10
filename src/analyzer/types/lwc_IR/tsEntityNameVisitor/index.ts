import { type TypeField } from '../../commons/ir';
import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
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

export const tSEntityNameVisitorEvaluatePairs = lazyPairs(
    () => [identifierTypePair, thisExpressionTypePair, tSQualifiedNameTypePair] as const,
);

export class TSEntityNameVisitor extends LwcCommonVisitor<
    ReturnType<typeof tSEntityNameVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return tSEntityNameVisitorEvaluatePairs();
    }
}

export type TSEntityNameTypeClass =
    IdentifierTypeClass | ThisExpressionTypeClass | TSQualifiedNameTypeClass;

export const isTSEntityNameType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSEntityNameTypeClass => {
    return (
        target instanceof IdentifierTypeClass ||
        target instanceof ThisExpressionTypeClass ||
        target instanceof TSQualifiedNameTypeClass
    );
};
