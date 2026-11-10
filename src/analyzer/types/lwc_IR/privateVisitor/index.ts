import { type TypeField } from '../../commons/ir';
import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
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

export const privateVisitorEvaluatePairs = lazyPairs(
    () => [classPrivatePropertyTypePair, classPrivateMethodTypePair, privateNameTypePair] as const,
);

export class PrivateVisitor extends LwcCommonVisitor<
    ReturnType<typeof privateVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return privateVisitorEvaluatePairs();
    }
}

export type PrivateTypeClass =
    ClassPrivatePropertyTypeClass | ClassPrivateMethodTypeClass | PrivateNameTypeClass;

export const isPrivateType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is PrivateTypeClass => {
    return (
        target instanceof ClassPrivatePropertyTypeClass ||
        target instanceof ClassPrivateMethodTypeClass ||
        target instanceof PrivateNameTypeClass
    );
};
