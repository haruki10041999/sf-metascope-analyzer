import { LwcCommonTypeClass, LwcCommonVisitor } from '../commonVisitor';
import {
    FunctionDeclarationTypeClass,
    functionDeclarationTypePair,
} from '../commons/functionDeclaration';
import {
    FunctionExpressionTypeClass,
    functionExpressionTypePair,
} from '../commons/functionExpression';
import { ObjectMethodTypeClass, objectMethodTypePair } from '../commons/objectMethod';
import {
    ArrowFunctionExpressionTypeClass,
    arrowFunctionExpressionTypePair,
} from '../commons/arrowFunctionExpression';
import { ClassMethodTypeClass, classMethodTypePair } from '../commons/classMethod';
import {
    ClassPrivateMethodTypeClass,
    classPrivateMethodTypePair,
} from '../commons/classPrivateMethod';
import { StaticBlockTypeClass, staticBlockTypePair } from '../commons/staticBlock';
import { TSModuleBlockTypeClass, tSModuleBlockTypePair } from '../commons/tSModuleBlock';

export {
    FunctionDeclarationTypeClass,
    functionDeclarationTypePair,
    isFunctionDeclarationType,
} from '../commons/functionDeclaration';
export {
    FunctionExpressionTypeClass,
    functionExpressionTypePair,
    isFunctionExpressionType,
} from '../commons/functionExpression';
export {
    ObjectMethodTypeClass,
    objectMethodTypePair,
    isObjectMethodType,
} from '../commons/objectMethod';
export {
    ArrowFunctionExpressionTypeClass,
    arrowFunctionExpressionTypePair,
    isArrowFunctionExpressionType,
} from '../commons/arrowFunctionExpression';
export {
    ClassMethodTypeClass,
    classMethodTypePair,
    isClassMethodType,
} from '../commons/classMethod';
export {
    ClassPrivateMethodTypeClass,
    classPrivateMethodTypePair,
    isClassPrivateMethodType,
} from '../commons/classPrivateMethod';
export {
    StaticBlockTypeClass,
    staticBlockTypePair,
    isStaticBlockType,
} from '../commons/staticBlock';
export {
    TSModuleBlockTypeClass,
    tSModuleBlockTypePair,
    isTSModuleBlockType,
} from '../commons/tSModuleBlock';

const functionParentVisitorEvaluatePairs = [
    functionDeclarationTypePair,
    functionExpressionTypePair,
    objectMethodTypePair,
    arrowFunctionExpressionTypePair,
    classMethodTypePair,
    classPrivateMethodTypePair,
    staticBlockTypePair,
    tSModuleBlockTypePair,
] as const;

export class FunctionParentVisitor extends LwcCommonVisitor<
    (typeof functionParentVisitorEvaluatePairs)[number]
> {
    readonly evaluatePair = functionParentVisitorEvaluatePairs;
}

export type FunctionParentTypeClass =
    | FunctionDeclarationTypeClass
    | FunctionExpressionTypeClass
    | ObjectMethodTypeClass
    | ArrowFunctionExpressionTypeClass
    | ClassMethodTypeClass
    | ClassPrivateMethodTypeClass
    | StaticBlockTypeClass
    | TSModuleBlockTypeClass;

export const isFunctionParentType = (
    target: LwcCommonTypeClass<string>,
): target is FunctionParentTypeClass => {
    return (
        target instanceof FunctionDeclarationTypeClass ||
        target instanceof FunctionExpressionTypeClass ||
        target instanceof ObjectMethodTypeClass ||
        target instanceof ArrowFunctionExpressionTypeClass ||
        target instanceof ClassMethodTypeClass ||
        target instanceof ClassPrivateMethodTypeClass ||
        target instanceof StaticBlockTypeClass ||
        target instanceof TSModuleBlockTypeClass
    );
};
