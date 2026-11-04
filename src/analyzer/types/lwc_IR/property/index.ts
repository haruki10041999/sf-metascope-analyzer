import { LwcCommonTypeClass, LwcCommonVisitor } from '../commonVisitor';
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

const propertyVisitorEvaluatePairs = [
    objectPropertyTypePair,
    classPropertyTypePair,
    classPrivatePropertyTypePair,
    classAccessorPropertyTypePair,
] as const;

export class PropertyVisitor extends LwcCommonVisitor<
    (typeof propertyVisitorEvaluatePairs)[number]
> {
    readonly evaluatePair = propertyVisitorEvaluatePairs;
}

export type PropertyTypeClass =
    | ObjectPropertyTypeClass
    | ClassPropertyTypeClass
    | ClassPrivatePropertyTypeClass
    | ClassAccessorPropertyTypeClass;

export const isPropertyType = (target: LwcCommonTypeClass<string>): target is PropertyTypeClass => {
    return (
        target instanceof ObjectPropertyTypeClass ||
        target instanceof ClassPropertyTypeClass ||
        target instanceof ClassPrivatePropertyTypeClass ||
        target instanceof ClassAccessorPropertyTypeClass
    );
};
