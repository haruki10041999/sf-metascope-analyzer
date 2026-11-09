import { type TypeField } from '../../commons/ir';
import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import { StringLiteralTypeClass, stringLiteralTypePair } from '../commons/stringLiteral';
import { NumericLiteralTypeClass, numericLiteralTypePair } from '../commons/numericLiteral';
import { NullLiteralTypeClass, nullLiteralTypePair } from '../commons/nullLiteral';
import { BooleanLiteralTypeClass, booleanLiteralTypePair } from '../commons/booleanLiteral';
import { BigIntLiteralTypeClass, bigIntLiteralTypePair } from '../commons/bigIntLiteral';
import { JSXAttributeTypeClass, jSXAttributeTypePair } from '../commons/jSXAttribute';
import {
    JSXClosingElementTypeClass,
    jSXClosingElementTypePair,
} from '../commons/jSXClosingElement';
import { JSXElementTypeClass, jSXElementTypePair } from '../commons/jSXElement';
import {
    JSXExpressionContainerTypeClass,
    jSXExpressionContainerTypePair,
} from '../commons/jSXExpressionContainer';
import { JSXSpreadChildTypeClass, jSXSpreadChildTypePair } from '../commons/jSXSpreadChild';
import {
    JSXOpeningElementTypeClass,
    jSXOpeningElementTypePair,
} from '../commons/jSXOpeningElement';
import { JSXTextTypeClass, jSXTextTypePair } from '../commons/jSXText';
import { JSXFragmentTypeClass, jSXFragmentTypePair } from '../commons/jSXFragment';
import {
    JSXOpeningFragmentTypeClass,
    jSXOpeningFragmentTypePair,
} from '../commons/jSXOpeningFragment';
import {
    JSXClosingFragmentTypeClass,
    jSXClosingFragmentTypePair,
} from '../commons/jSXClosingFragment';

export {
    StringLiteralTypeClass,
    stringLiteralTypePair,
    isStringLiteralType,
} from '../commons/stringLiteral';
export {
    NumericLiteralTypeClass,
    numericLiteralTypePair,
    isNumericLiteralType,
} from '../commons/numericLiteral';
export {
    NullLiteralTypeClass,
    nullLiteralTypePair,
    isNullLiteralType,
} from '../commons/nullLiteral';
export {
    BooleanLiteralTypeClass,
    booleanLiteralTypePair,
    isBooleanLiteralType,
} from '../commons/booleanLiteral';
export {
    BigIntLiteralTypeClass,
    bigIntLiteralTypePair,
    isBigIntLiteralType,
} from '../commons/bigIntLiteral';
export {
    JSXAttributeTypeClass,
    jSXAttributeTypePair,
    isJSXAttributeType,
} from '../commons/jSXAttribute';
export {
    JSXClosingElementTypeClass,
    jSXClosingElementTypePair,
    isJSXClosingElementType,
} from '../commons/jSXClosingElement';
export { JSXElementTypeClass, jSXElementTypePair, isJSXElementType } from '../commons/jSXElement';
export {
    JSXExpressionContainerTypeClass,
    jSXExpressionContainerTypePair,
    isJSXExpressionContainerType,
} from '../commons/jSXExpressionContainer';
export {
    JSXSpreadChildTypeClass,
    jSXSpreadChildTypePair,
    isJSXSpreadChildType,
} from '../commons/jSXSpreadChild';
export {
    JSXOpeningElementTypeClass,
    jSXOpeningElementTypePair,
    isJSXOpeningElementType,
} from '../commons/jSXOpeningElement';
export { JSXTextTypeClass, jSXTextTypePair, isJSXTextType } from '../commons/jSXText';
export {
    JSXFragmentTypeClass,
    jSXFragmentTypePair,
    isJSXFragmentType,
} from '../commons/jSXFragment';
export {
    JSXOpeningFragmentTypeClass,
    jSXOpeningFragmentTypePair,
    isJSXOpeningFragmentType,
} from '../commons/jSXOpeningFragment';
export {
    JSXClosingFragmentTypeClass,
    jSXClosingFragmentTypePair,
    isJSXClosingFragmentType,
} from '../commons/jSXClosingFragment';

export const immutableVisitorEvaluatePairs = lazyPairs(
    () =>
        [
            stringLiteralTypePair,
            numericLiteralTypePair,
            nullLiteralTypePair,
            booleanLiteralTypePair,
            bigIntLiteralTypePair,
            jSXAttributeTypePair,
            jSXClosingElementTypePair,
            jSXElementTypePair,
            jSXExpressionContainerTypePair,
            jSXSpreadChildTypePair,
            jSXOpeningElementTypePair,
            jSXTextTypePair,
            jSXFragmentTypePair,
            jSXOpeningFragmentTypePair,
            jSXClosingFragmentTypePair,
        ] as const,
);

export class ImmutableVisitor extends LwcCommonVisitor<
    ReturnType<typeof immutableVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return immutableVisitorEvaluatePairs();
    }
}

export type ImmutableTypeClass =
    | StringLiteralTypeClass
    | NumericLiteralTypeClass
    | NullLiteralTypeClass
    | BooleanLiteralTypeClass
    | BigIntLiteralTypeClass
    | JSXAttributeTypeClass
    | JSXClosingElementTypeClass
    | JSXElementTypeClass
    | JSXExpressionContainerTypeClass
    | JSXSpreadChildTypeClass
    | JSXOpeningElementTypeClass
    | JSXTextTypeClass
    | JSXFragmentTypeClass
    | JSXOpeningFragmentTypeClass
    | JSXClosingFragmentTypeClass;

export const isImmutableType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ImmutableTypeClass => {
    return (
        target instanceof StringLiteralTypeClass ||
        target instanceof NumericLiteralTypeClass ||
        target instanceof NullLiteralTypeClass ||
        target instanceof BooleanLiteralTypeClass ||
        target instanceof BigIntLiteralTypeClass ||
        target instanceof JSXAttributeTypeClass ||
        target instanceof JSXClosingElementTypeClass ||
        target instanceof JSXElementTypeClass ||
        target instanceof JSXExpressionContainerTypeClass ||
        target instanceof JSXSpreadChildTypeClass ||
        target instanceof JSXOpeningElementTypeClass ||
        target instanceof JSXTextTypeClass ||
        target instanceof JSXFragmentTypeClass ||
        target instanceof JSXOpeningFragmentTypeClass ||
        target instanceof JSXClosingFragmentTypeClass
    );
};
