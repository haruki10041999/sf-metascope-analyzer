import { LwcCommonTypeClass, LwcCommonVisitor } from '../commonVisitor';
import { ObjectMethodTypeClass, objectMethodTypePair } from '../commons/objectMethod';
import { ObjectPropertyTypeClass, objectPropertyTypePair } from '../commons/objectProperty';

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

const objectMemberVisitorEvaluatePairs = [objectMethodTypePair, objectPropertyTypePair] as const;

export class ObjectMemberVisitor extends LwcCommonVisitor<
    (typeof objectMemberVisitorEvaluatePairs)[number]
> {
    readonly evaluatePair = objectMemberVisitorEvaluatePairs;
}

export type ObjectMemberTypeClass = ObjectMethodTypeClass | ObjectPropertyTypeClass;

export const isObjectMemberType = (
    target: LwcCommonTypeClass<string>,
): target is ObjectMemberTypeClass => {
    return target instanceof ObjectMethodTypeClass || target instanceof ObjectPropertyTypeClass;
};
