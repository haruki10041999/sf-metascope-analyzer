import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
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

export const functionVisitorEvaluatePairs = lazyPairs(
    () =>
        [
            functionDeclarationTypePair,
            functionExpressionTypePair,
            objectMethodTypePair,
            arrowFunctionExpressionTypePair,
            classMethodTypePair,
            classPrivateMethodTypePair,
        ] as const,
);

export class FunctionVisitor extends LwcCommonVisitor<
    ReturnType<typeof functionVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return functionVisitorEvaluatePairs();
    }
}

export type FunctionTypeClass =
    | FunctionDeclarationTypeClass
    | FunctionExpressionTypeClass
    | ObjectMethodTypeClass
    | ArrowFunctionExpressionTypeClass
    | ClassMethodTypeClass
    | ClassPrivateMethodTypeClass;

export const isFunctionType = (target: LwcCommonTypeClass<string>): target is FunctionTypeClass => {
    return (
        target instanceof FunctionDeclarationTypeClass ||
        target instanceof FunctionExpressionTypeClass ||
        target instanceof ObjectMethodTypeClass ||
        target instanceof ArrowFunctionExpressionTypeClass ||
        target instanceof ClassMethodTypeClass ||
        target instanceof ClassPrivateMethodTypeClass
    );
};
