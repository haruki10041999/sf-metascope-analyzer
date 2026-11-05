import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import { ArrayExpressionTypeClass, arrayExpressionTypePair } from '../commons/arrayExpression';
import {
    AssignmentExpressionTypeClass,
    assignmentExpressionTypePair,
} from '../commons/assignmentExpression';
import { BinaryExpressionTypeClass, binaryExpressionTypePair } from '../commons/binaryExpression';
import { CallExpressionTypeClass, callExpressionTypePair } from '../commons/callExpression';
import {
    ConditionalExpressionTypeClass,
    conditionalExpressionTypePair,
} from '../commons/conditionalExpression';
import {
    FunctionExpressionTypeClass,
    functionExpressionTypePair,
} from '../commons/functionExpression';
import { IdentifierTypeClass, identifierTypePair } from '../commons/identifier';
import { StringLiteralTypeClass, stringLiteralTypePair } from '../commons/stringLiteral';
import { NumericLiteralTypeClass, numericLiteralTypePair } from '../commons/numericLiteral';
import { NullLiteralTypeClass, nullLiteralTypePair } from '../commons/nullLiteral';
import { BooleanLiteralTypeClass, booleanLiteralTypePair } from '../commons/booleanLiteral';
import { RegExpLiteralTypeClass, regExpLiteralTypePair } from '../commons/regExpLiteral';
import {
    LogicalExpressionTypeClass,
    logicalExpressionTypePair,
} from '../commons/logicalExpression';
import { MemberExpressionTypeClass, memberExpressionTypePair } from '../commons/memberExpression';
import { NewExpressionTypeClass, newExpressionTypePair } from '../commons/newExpression';
import { ObjectExpressionTypeClass, objectExpressionTypePair } from '../commons/objectExpression';
import {
    SequenceExpressionTypeClass,
    sequenceExpressionTypePair,
} from '../commons/sequenceExpression';
import {
    ParenthesizedExpressionTypeClass,
    parenthesizedExpressionTypePair,
} from '../commons/parenthesizedExpression';
import { ThisExpressionTypeClass, thisExpressionTypePair } from '../commons/thisExpression';
import { UnaryExpressionTypeClass, unaryExpressionTypePair } from '../commons/unaryExpression';
import { UpdateExpressionTypeClass, updateExpressionTypePair } from '../commons/updateExpression';
import {
    ArrowFunctionExpressionTypeClass,
    arrowFunctionExpressionTypePair,
} from '../commons/arrowFunctionExpression';
import { ClassExpressionTypeClass, classExpressionTypePair } from '../commons/classExpression';
import { MetaPropertyTypeClass, metaPropertyTypePair } from '../commons/metaProperty';
import {
    TaggedTemplateExpressionTypeClass,
    taggedTemplateExpressionTypePair,
} from '../commons/taggedTemplateExpression';
import { TemplateLiteralTypeClass, templateLiteralTypePair } from '../commons/templateLiteral';
import { YieldExpressionTypeClass, yieldExpressionTypePair } from '../commons/yieldExpression';
import { AwaitExpressionTypeClass, awaitExpressionTypePair } from '../commons/awaitExpression';
import { ImportExpressionTypeClass, importExpressionTypePair } from '../commons/importExpression';
import { BigIntLiteralTypeClass, bigIntLiteralTypePair } from '../commons/bigIntLiteral';
import {
    OptionalMemberExpressionTypeClass,
    optionalMemberExpressionTypePair,
} from '../commons/optionalMemberExpression';
import {
    OptionalCallExpressionTypeClass,
    optionalCallExpressionTypePair,
} from '../commons/optionalCallExpression';
import {
    TypeCastExpressionTypeClass,
    typeCastExpressionTypePair,
} from '../commons/typeCastExpression';
import { JSXElementTypeClass, jSXElementTypePair } from '../commons/jSXElement';
import { JSXFragmentTypeClass, jSXFragmentTypePair } from '../commons/jSXFragment';
import { BindExpressionTypeClass, bindExpressionTypePair } from './bindExpression';
import { DoExpressionTypeClass, doExpressionTypePair } from './doExpression';
import { ModuleExpressionTypeClass, moduleExpressionTypePair } from './moduleExpression';
import { TopicReferenceTypeClass, topicReferenceTypePair } from './topicReference';
import {
    TSInstantiationExpressionTypeClass,
    tSInstantiationExpressionTypePair,
} from '../commons/tSInstantiationExpression';
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

export {
    ArrayExpressionTypeClass,
    arrayExpressionTypePair,
    isArrayExpressionType,
} from '../commons/arrayExpression';
export {
    AssignmentExpressionTypeClass,
    assignmentExpressionTypePair,
    isAssignmentExpressionType,
} from '../commons/assignmentExpression';
export {
    BinaryExpressionTypeClass,
    binaryExpressionTypePair,
    isBinaryExpressionType,
} from '../commons/binaryExpression';
export {
    CallExpressionTypeClass,
    callExpressionTypePair,
    isCallExpressionType,
} from '../commons/callExpression';
export {
    ConditionalExpressionTypeClass,
    conditionalExpressionTypePair,
    isConditionalExpressionType,
} from '../commons/conditionalExpression';
export {
    FunctionExpressionTypeClass,
    functionExpressionTypePair,
    isFunctionExpressionType,
} from '../commons/functionExpression';
export { IdentifierTypeClass, identifierTypePair, isIdentifierType } from '../commons/identifier';
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
    RegExpLiteralTypeClass,
    regExpLiteralTypePair,
    isRegExpLiteralType,
} from '../commons/regExpLiteral';
export {
    LogicalExpressionTypeClass,
    logicalExpressionTypePair,
    isLogicalExpressionType,
} from '../commons/logicalExpression';
export {
    MemberExpressionTypeClass,
    memberExpressionTypePair,
    isMemberExpressionType,
} from '../commons/memberExpression';
export {
    NewExpressionTypeClass,
    newExpressionTypePair,
    isNewExpressionType,
} from '../commons/newExpression';
export {
    ObjectExpressionTypeClass,
    objectExpressionTypePair,
    isObjectExpressionType,
} from '../commons/objectExpression';
export {
    SequenceExpressionTypeClass,
    sequenceExpressionTypePair,
    isSequenceExpressionType,
} from '../commons/sequenceExpression';
export {
    ParenthesizedExpressionTypeClass,
    parenthesizedExpressionTypePair,
    isParenthesizedExpressionType,
} from '../commons/parenthesizedExpression';
export {
    ThisExpressionTypeClass,
    thisExpressionTypePair,
    isThisExpressionType,
} from '../commons/thisExpression';
export {
    UnaryExpressionTypeClass,
    unaryExpressionTypePair,
    isUnaryExpressionType,
} from '../commons/unaryExpression';
export {
    UpdateExpressionTypeClass,
    updateExpressionTypePair,
    isUpdateExpressionType,
} from '../commons/updateExpression';
export {
    ArrowFunctionExpressionTypeClass,
    arrowFunctionExpressionTypePair,
    isArrowFunctionExpressionType,
} from '../commons/arrowFunctionExpression';
export {
    ClassExpressionTypeClass,
    classExpressionTypePair,
    isClassExpressionType,
} from '../commons/classExpression';
export {
    MetaPropertyTypeClass,
    metaPropertyTypePair,
    isMetaPropertyType,
} from '../commons/metaProperty';
export {
    TaggedTemplateExpressionTypeClass,
    taggedTemplateExpressionTypePair,
    isTaggedTemplateExpressionType,
} from '../commons/taggedTemplateExpression';
export {
    TemplateLiteralTypeClass,
    templateLiteralTypePair,
    isTemplateLiteralType,
} from '../commons/templateLiteral';
export {
    YieldExpressionTypeClass,
    yieldExpressionTypePair,
    isYieldExpressionType,
} from '../commons/yieldExpression';
export {
    AwaitExpressionTypeClass,
    awaitExpressionTypePair,
    isAwaitExpressionType,
} from '../commons/awaitExpression';
export {
    ImportExpressionTypeClass,
    importExpressionTypePair,
    isImportExpressionType,
} from '../commons/importExpression';
export {
    BigIntLiteralTypeClass,
    bigIntLiteralTypePair,
    isBigIntLiteralType,
} from '../commons/bigIntLiteral';
export {
    OptionalMemberExpressionTypeClass,
    optionalMemberExpressionTypePair,
    isOptionalMemberExpressionType,
} from '../commons/optionalMemberExpression';
export {
    OptionalCallExpressionTypeClass,
    optionalCallExpressionTypePair,
    isOptionalCallExpressionType,
} from '../commons/optionalCallExpression';
export {
    TypeCastExpressionTypeClass,
    typeCastExpressionTypePair,
    isTypeCastExpressionType,
} from '../commons/typeCastExpression';
export { JSXElementTypeClass, jSXElementTypePair, isJSXElementType } from '../commons/jSXElement';
export {
    JSXFragmentTypeClass,
    jSXFragmentTypePair,
    isJSXFragmentType,
} from '../commons/jSXFragment';
export {
    BindExpressionTypeClass,
    bindExpressionTypePair,
    isBindExpressionType,
} from './bindExpression';
export { DoExpressionTypeClass, doExpressionTypePair, isDoExpressionType } from './doExpression';
export {
    ModuleExpressionTypeClass,
    moduleExpressionTypePair,
    isModuleExpressionType,
} from './moduleExpression';
export {
    TopicReferenceTypeClass,
    topicReferenceTypePair,
    isTopicReferenceType,
} from './topicReference';
export {
    TSInstantiationExpressionTypeClass,
    tSInstantiationExpressionTypePair,
    isTSInstantiationExpressionType,
} from '../commons/tSInstantiationExpression';
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

export const expressionVisitorEvaluatePairs = lazyPairs(
    () =>
        [
            arrayExpressionTypePair,
            assignmentExpressionTypePair,
            binaryExpressionTypePair,
            callExpressionTypePair,
            conditionalExpressionTypePair,
            functionExpressionTypePair,
            identifierTypePair,
            stringLiteralTypePair,
            numericLiteralTypePair,
            nullLiteralTypePair,
            booleanLiteralTypePair,
            regExpLiteralTypePair,
            logicalExpressionTypePair,
            memberExpressionTypePair,
            newExpressionTypePair,
            objectExpressionTypePair,
            sequenceExpressionTypePair,
            parenthesizedExpressionTypePair,
            thisExpressionTypePair,
            unaryExpressionTypePair,
            updateExpressionTypePair,
            arrowFunctionExpressionTypePair,
            classExpressionTypePair,
            metaPropertyTypePair,
            taggedTemplateExpressionTypePair,
            templateLiteralTypePair,
            yieldExpressionTypePair,
            awaitExpressionTypePair,
            importExpressionTypePair,
            bigIntLiteralTypePair,
            optionalMemberExpressionTypePair,
            optionalCallExpressionTypePair,
            typeCastExpressionTypePair,
            jSXElementTypePair,
            jSXFragmentTypePair,
            bindExpressionTypePair,
            doExpressionTypePair,
            moduleExpressionTypePair,
            topicReferenceTypePair,
            tSInstantiationExpressionTypePair,
            tSAsExpressionTypePair,
            tSSatisfiesExpressionTypePair,
            tSTypeAssertionTypePair,
            tSNonNullExpressionTypePair,
        ] as const,
);

export class ExpressionVisitor extends LwcCommonVisitor<
    ReturnType<typeof expressionVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return expressionVisitorEvaluatePairs();
    }
}

export type ExpressionTypeClass =
    | ArrayExpressionTypeClass
    | AssignmentExpressionTypeClass
    | BinaryExpressionTypeClass
    | CallExpressionTypeClass
    | ConditionalExpressionTypeClass
    | FunctionExpressionTypeClass
    | IdentifierTypeClass
    | StringLiteralTypeClass
    | NumericLiteralTypeClass
    | NullLiteralTypeClass
    | BooleanLiteralTypeClass
    | RegExpLiteralTypeClass
    | LogicalExpressionTypeClass
    | MemberExpressionTypeClass
    | NewExpressionTypeClass
    | ObjectExpressionTypeClass
    | SequenceExpressionTypeClass
    | ParenthesizedExpressionTypeClass
    | ThisExpressionTypeClass
    | UnaryExpressionTypeClass
    | UpdateExpressionTypeClass
    | ArrowFunctionExpressionTypeClass
    | ClassExpressionTypeClass
    | MetaPropertyTypeClass
    | TaggedTemplateExpressionTypeClass
    | TemplateLiteralTypeClass
    | YieldExpressionTypeClass
    | AwaitExpressionTypeClass
    | ImportExpressionTypeClass
    | BigIntLiteralTypeClass
    | OptionalMemberExpressionTypeClass
    | OptionalCallExpressionTypeClass
    | TypeCastExpressionTypeClass
    | JSXElementTypeClass
    | JSXFragmentTypeClass
    | BindExpressionTypeClass
    | DoExpressionTypeClass
    | ModuleExpressionTypeClass
    | TopicReferenceTypeClass
    | TSInstantiationExpressionTypeClass
    | TSAsExpressionTypeClass
    | TSSatisfiesExpressionTypeClass
    | TSTypeAssertionTypeClass
    | TSNonNullExpressionTypeClass;

export const isExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is ExpressionTypeClass => {
    return (
        target instanceof ArrayExpressionTypeClass ||
        target instanceof AssignmentExpressionTypeClass ||
        target instanceof BinaryExpressionTypeClass ||
        target instanceof CallExpressionTypeClass ||
        target instanceof ConditionalExpressionTypeClass ||
        target instanceof FunctionExpressionTypeClass ||
        target instanceof IdentifierTypeClass ||
        target instanceof StringLiteralTypeClass ||
        target instanceof NumericLiteralTypeClass ||
        target instanceof NullLiteralTypeClass ||
        target instanceof BooleanLiteralTypeClass ||
        target instanceof RegExpLiteralTypeClass ||
        target instanceof LogicalExpressionTypeClass ||
        target instanceof MemberExpressionTypeClass ||
        target instanceof NewExpressionTypeClass ||
        target instanceof ObjectExpressionTypeClass ||
        target instanceof SequenceExpressionTypeClass ||
        target instanceof ParenthesizedExpressionTypeClass ||
        target instanceof ThisExpressionTypeClass ||
        target instanceof UnaryExpressionTypeClass ||
        target instanceof UpdateExpressionTypeClass ||
        target instanceof ArrowFunctionExpressionTypeClass ||
        target instanceof ClassExpressionTypeClass ||
        target instanceof MetaPropertyTypeClass ||
        target instanceof TaggedTemplateExpressionTypeClass ||
        target instanceof TemplateLiteralTypeClass ||
        target instanceof YieldExpressionTypeClass ||
        target instanceof AwaitExpressionTypeClass ||
        target instanceof ImportExpressionTypeClass ||
        target instanceof BigIntLiteralTypeClass ||
        target instanceof OptionalMemberExpressionTypeClass ||
        target instanceof OptionalCallExpressionTypeClass ||
        target instanceof TypeCastExpressionTypeClass ||
        target instanceof JSXElementTypeClass ||
        target instanceof JSXFragmentTypeClass ||
        target instanceof BindExpressionTypeClass ||
        target instanceof DoExpressionTypeClass ||
        target instanceof ModuleExpressionTypeClass ||
        target instanceof TopicReferenceTypeClass ||
        target instanceof TSInstantiationExpressionTypeClass ||
        target instanceof TSAsExpressionTypeClass ||
        target instanceof TSSatisfiesExpressionTypeClass ||
        target instanceof TSTypeAssertionTypeClass ||
        target instanceof TSNonNullExpressionTypeClass
    );
};
