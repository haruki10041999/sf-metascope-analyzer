import { LwcCommonTypeClass, LwcCommonVisitor } from '../commonVisitor';
import { JSXAttributeTypeClass, jSXAttributeTypePair } from '../commons/jSXAttribute';
import {
    JSXClosingElementTypeClass,
    jSXClosingElementTypePair,
} from '../commons/jSXClosingElement';
import { JSXElementTypeClass, jSXElementTypePair } from '../commons/jSXElement';
import { JSXEmptyExpressionTypeClass, jSXEmptyExpressionTypePair } from './jSXEmptyExpression';
import {
    JSXExpressionContainerTypeClass,
    jSXExpressionContainerTypePair,
} from '../commons/jSXExpressionContainer';
import { JSXSpreadChildTypeClass, jSXSpreadChildTypePair } from '../commons/jSXSpreadChild';
import { JSXIdentifierTypeClass, jSXIdentifierTypePair } from './jSXIdentifier';
import { JSXMemberExpressionTypeClass, jSXMemberExpressionTypePair } from './jSXMemberExpression';
import { JSXNamespacedNameTypeClass, jSXNamespacedNameTypePair } from './jSXNamespacedName';
import {
    JSXOpeningElementTypeClass,
    jSXOpeningElementTypePair,
} from '../commons/jSXOpeningElement';
import { JSXSpreadAttributeTypeClass, jSXSpreadAttributeTypePair } from './jSXSpreadAttribute';
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
    JSXEmptyExpressionTypeClass,
    jSXEmptyExpressionTypePair,
    isJSXEmptyExpressionType,
} from './jSXEmptyExpression';
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
    JSXIdentifierTypeClass,
    jSXIdentifierTypePair,
    isJSXIdentifierType,
} from './jSXIdentifier';
export {
    JSXMemberExpressionTypeClass,
    jSXMemberExpressionTypePair,
    isJSXMemberExpressionType,
} from './jSXMemberExpression';
export {
    JSXNamespacedNameTypeClass,
    jSXNamespacedNameTypePair,
    isJSXNamespacedNameType,
} from './jSXNamespacedName';
export {
    JSXOpeningElementTypeClass,
    jSXOpeningElementTypePair,
    isJSXOpeningElementType,
} from '../commons/jSXOpeningElement';
export {
    JSXSpreadAttributeTypeClass,
    jSXSpreadAttributeTypePair,
    isJSXSpreadAttributeType,
} from './jSXSpreadAttribute';
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

const jSXVisitorEvaluatePairs = [
    jSXAttributeTypePair,
    jSXClosingElementTypePair,
    jSXElementTypePair,
    jSXEmptyExpressionTypePair,
    jSXExpressionContainerTypePair,
    jSXSpreadChildTypePair,
    jSXIdentifierTypePair,
    jSXMemberExpressionTypePair,
    jSXNamespacedNameTypePair,
    jSXOpeningElementTypePair,
    jSXSpreadAttributeTypePair,
    jSXTextTypePair,
    jSXFragmentTypePair,
    jSXOpeningFragmentTypePair,
    jSXClosingFragmentTypePair,
] as const;

export class JSXVisitor extends LwcCommonVisitor<(typeof jSXVisitorEvaluatePairs)[number]> {
    readonly evaluatePair = jSXVisitorEvaluatePairs;
}

export type JSXTypeClass =
    | JSXAttributeTypeClass
    | JSXClosingElementTypeClass
    | JSXElementTypeClass
    | JSXEmptyExpressionTypeClass
    | JSXExpressionContainerTypeClass
    | JSXSpreadChildTypeClass
    | JSXIdentifierTypeClass
    | JSXMemberExpressionTypeClass
    | JSXNamespacedNameTypeClass
    | JSXOpeningElementTypeClass
    | JSXSpreadAttributeTypeClass
    | JSXTextTypeClass
    | JSXFragmentTypeClass
    | JSXOpeningFragmentTypeClass
    | JSXClosingFragmentTypeClass;

export const isJSXType = (target: LwcCommonTypeClass<string>): target is JSXTypeClass => {
    return (
        target instanceof JSXAttributeTypeClass ||
        target instanceof JSXClosingElementTypeClass ||
        target instanceof JSXElementTypeClass ||
        target instanceof JSXEmptyExpressionTypeClass ||
        target instanceof JSXExpressionContainerTypeClass ||
        target instanceof JSXSpreadChildTypeClass ||
        target instanceof JSXIdentifierTypeClass ||
        target instanceof JSXMemberExpressionTypeClass ||
        target instanceof JSXNamespacedNameTypeClass ||
        target instanceof JSXOpeningElementTypeClass ||
        target instanceof JSXSpreadAttributeTypeClass ||
        target instanceof JSXTextTypeClass ||
        target instanceof JSXFragmentTypeClass ||
        target instanceof JSXOpeningFragmentTypeClass ||
        target instanceof JSXClosingFragmentTypeClass
    );
};
