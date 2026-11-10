import { type TypeField } from '../../commons/ir';
import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import { ObjectPropertyTypeClass, objectPropertyTypePair } from '../commons/objectProperty';
import { ClassPropertyTypeClass, classPropertyTypePair } from '../commons/classProperty';
import {
    ClassPrivatePropertyTypeClass,
    classPrivatePropertyTypePair,
} from '../commons/classPrivateProperty';
import {
    ClassAccessorPropertyTypeClass,
    classAccessorPropertyTypePair,
} from '../commons/classAccessorProperty';

export {
    ObjectPropertyTypeClass,
    objectPropertyTypePair,
    isObjectPropertyType,
} from '../commons/objectProperty';
export {
    ClassPropertyTypeClass,
    classPropertyTypePair,
    isClassPropertyType,
} from '../commons/classProperty';
export {
    ClassPrivatePropertyTypeClass,
    classPrivatePropertyTypePair,
    isClassPrivatePropertyType,
} from '../commons/classPrivateProperty';
export {
    ClassAccessorPropertyTypeClass,
    classAccessorPropertyTypePair,
    isClassAccessorPropertyType,
} from '../commons/classAccessorProperty';

export const propertyVisitorEvaluatePairs = lazyPairs(
    () =>
        [
            objectPropertyTypePair,
            classPropertyTypePair,
            classPrivatePropertyTypePair,
            classAccessorPropertyTypePair,
        ] as const,
);

export class PropertyVisitor extends LwcCommonVisitor<
    ReturnType<typeof propertyVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return propertyVisitorEvaluatePairs();
    }
}

export type PropertyTypeClass =
    | ObjectPropertyTypeClass
    | ClassPropertyTypeClass
    | ClassPrivatePropertyTypeClass
    | ClassAccessorPropertyTypeClass;

export const isPropertyType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is PropertyTypeClass => {
    return (
        target instanceof ObjectPropertyTypeClass ||
        target instanceof ClassPropertyTypeClass ||
        target instanceof ClassPrivatePropertyTypeClass ||
        target instanceof ClassAccessorPropertyTypeClass
    );
};
