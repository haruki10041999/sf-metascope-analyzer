import { type TypeField } from '../../commons/ir';
import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import { PlaceholderTypeClass, placeholderTypePair } from './placeholder';
import {
    V8IntrinsicIdentifierTypeClass,
    v8IntrinsicIdentifierTypePair,
} from './v8IntrinsicIdentifier';

export { PlaceholderTypeClass, placeholderTypePair, isPlaceholderType } from './placeholder';
export {
    V8IntrinsicIdentifierTypeClass,
    v8IntrinsicIdentifierTypePair,
    isV8IntrinsicIdentifierType,
} from './v8IntrinsicIdentifier';

export const miscellaneousVisitorEvaluatePairs = lazyPairs(
    () => [placeholderTypePair, v8IntrinsicIdentifierTypePair] as const,
);

export class MiscellaneousVisitor extends LwcCommonVisitor<
    ReturnType<typeof miscellaneousVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return miscellaneousVisitorEvaluatePairs();
    }
}

export type MiscellaneousTypeClass = PlaceholderTypeClass | V8IntrinsicIdentifierTypeClass;

export const isMiscellaneousType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is MiscellaneousTypeClass => {
    return (
        target instanceof PlaceholderTypeClass || target instanceof V8IntrinsicIdentifierTypeClass
    );
};
