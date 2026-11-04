import { LwcCommonTypeClass, LwcCommonVisitor } from '../commonVisitor';
import { ObjectMethodTypeClass, objectMethodTypePair } from '../commons/objectMethod';
import { ClassMethodTypeClass, classMethodTypePair } from '../commons/classMethod';
import {
    ClassPrivateMethodTypeClass,
    classPrivateMethodTypePair,
} from '../commons/classPrivateMethod';

export {
    ObjectMethodTypeClass,
    objectMethodTypePair,
    isObjectMethodType,
} from '../commons/objectMethod';
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

const methodVisitorEvaluatePairs = [
    objectMethodTypePair,
    classMethodTypePair,
    classPrivateMethodTypePair,
] as const;

export class MethodVisitor extends LwcCommonVisitor<(typeof methodVisitorEvaluatePairs)[number]> {
    readonly evaluatePair = methodVisitorEvaluatePairs;
}

export type MethodTypeClass =
    ObjectMethodTypeClass | ClassMethodTypeClass | ClassPrivateMethodTypeClass;

export const isMethodType = (target: LwcCommonTypeClass<string>): target is MethodTypeClass => {
    return (
        target instanceof ObjectMethodTypeClass ||
        target instanceof ClassMethodTypeClass ||
        target instanceof ClassPrivateMethodTypeClass
    );
};
