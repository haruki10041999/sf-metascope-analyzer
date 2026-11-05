import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import { ObjectMethodTypeClass, objectMethodTypePair } from '../commons/objectMethod';
import { ObjectPropertyTypeClass, objectPropertyTypePair } from '../commons/objectProperty';
import {
    ObjectTypeInternalSlotTypeClass,
    objectTypeInternalSlotTypePair,
} from '../commons/objectTypeInternalSlot';
import {
    ObjectTypeCallPropertyTypeClass,
    objectTypeCallPropertyTypePair,
} from '../commons/objectTypeCallProperty';
import {
    ObjectTypeIndexerTypeClass,
    objectTypeIndexerTypePair,
} from '../commons/objectTypeIndexer';
import {
    ObjectTypePropertyTypeClass,
    objectTypePropertyTypePair,
} from '../commons/objectTypeProperty';
import {
    ObjectTypeSpreadPropertyTypeClass,
    objectTypeSpreadPropertyTypePair,
} from '../commons/objectTypeSpreadProperty';

export {
    ObjectMethodTypeClass,
    objectMethodTypePair,
    isObjectMethodType,
} from '../commons/objectMethod';
export {
    ObjectPropertyTypeClass,
    objectPropertyTypePair,
    isObjectPropertyType,
} from '../commons/objectProperty';
export {
    ObjectTypeInternalSlotTypeClass,
    objectTypeInternalSlotTypePair,
    isObjectTypeInternalSlotType,
} from '../commons/objectTypeInternalSlot';
export {
    ObjectTypeCallPropertyTypeClass,
    objectTypeCallPropertyTypePair,
    isObjectTypeCallPropertyType,
} from '../commons/objectTypeCallProperty';
export {
    ObjectTypeIndexerTypeClass,
    objectTypeIndexerTypePair,
    isObjectTypeIndexerType,
} from '../commons/objectTypeIndexer';
export {
    ObjectTypePropertyTypeClass,
    objectTypePropertyTypePair,
    isObjectTypePropertyType,
} from '../commons/objectTypeProperty';
export {
    ObjectTypeSpreadPropertyTypeClass,
    objectTypeSpreadPropertyTypePair,
    isObjectTypeSpreadPropertyType,
} from '../commons/objectTypeSpreadProperty';

export const userWhitespacableVisitorEvaluatePairs = lazyPairs(
    () =>
        [
            objectMethodTypePair,
            objectPropertyTypePair,
            objectTypeInternalSlotTypePair,
            objectTypeCallPropertyTypePair,
            objectTypeIndexerTypePair,
            objectTypePropertyTypePair,
            objectTypeSpreadPropertyTypePair,
        ] as const,
);

export class UserWhitespacableVisitor extends LwcCommonVisitor<
    ReturnType<typeof userWhitespacableVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return userWhitespacableVisitorEvaluatePairs();
    }
}

export type UserWhitespacableTypeClass =
    | ObjectMethodTypeClass
    | ObjectPropertyTypeClass
    | ObjectTypeInternalSlotTypeClass
    | ObjectTypeCallPropertyTypeClass
    | ObjectTypeIndexerTypeClass
    | ObjectTypePropertyTypeClass
    | ObjectTypeSpreadPropertyTypeClass;

export const isUserWhitespacableType = (
    target: LwcCommonTypeClass<string>,
): target is UserWhitespacableTypeClass => {
    return (
        target instanceof ObjectMethodTypeClass ||
        target instanceof ObjectPropertyTypeClass ||
        target instanceof ObjectTypeInternalSlotTypeClass ||
        target instanceof ObjectTypeCallPropertyTypeClass ||
        target instanceof ObjectTypeIndexerTypeClass ||
        target instanceof ObjectTypePropertyTypeClass ||
        target instanceof ObjectTypeSpreadPropertyTypeClass
    );
};
