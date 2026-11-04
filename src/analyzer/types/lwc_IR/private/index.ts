import { LwcCommonTypeClass, LwcCommonVisitor } from '../commonVisitor';
import {
    ClassPrivatePropertyTypeClass,
    classPrivatePropertyTypePair,
} from '../commons/classPrivateProperty';
import {
    ClassPrivateMethodTypeClass,
    classPrivateMethodTypePair,
} from '../commons/classPrivateMethod';
import { PrivateNameTypeClass, privateNameTypePair } from '../commons/privateName';

export {
    ClassPrivatePropertyTypeClass,
    classPrivatePropertyTypePair,
    isClassPrivatePropertyType,
} from '../commons/classPrivateProperty';
export {
    ClassPrivateMethodTypeClass,
    classPrivateMethodTypePair,
    isClassPrivateMethodType,
} from '../commons/classPrivateMethod';
export {
    PrivateNameTypeClass,
    privateNameTypePair,
    isPrivateNameType,
} from '../commons/privateName';

const privateVisitorEvaluatePairs = [
    classPrivatePropertyTypePair,
    classPrivateMethodTypePair,
    privateNameTypePair,
] as const;

export class PrivateVisitor extends LwcCommonVisitor<(typeof privateVisitorEvaluatePairs)[number]> {
    readonly evaluatePair = privateVisitorEvaluatePairs;
}

export type PrivateTypeClass =
    ClassPrivatePropertyTypeClass | ClassPrivateMethodTypeClass | PrivateNameTypeClass;

export const isPrivateType = (target: LwcCommonTypeClass<string>): target is PrivateTypeClass => {
    return (
        target instanceof ClassPrivatePropertyTypeClass ||
        target instanceof ClassPrivateMethodTypeClass ||
        target instanceof PrivateNameTypeClass
    );
};
