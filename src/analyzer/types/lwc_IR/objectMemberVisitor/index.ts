import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
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

export const objectMemberVisitorEvaluatePairs = lazyPairs(
    () => [objectMethodTypePair, objectPropertyTypePair] as const,
);

export class ObjectMemberVisitor extends LwcCommonVisitor<
    ReturnType<typeof objectMemberVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return objectMemberVisitorEvaluatePairs();
    }
}

export type ObjectMemberTypeClass = ObjectMethodTypeClass | ObjectPropertyTypeClass;

export const isObjectMemberType = (
    target: LwcCommonTypeClass<string>,
): target is ObjectMemberTypeClass => {
    return target instanceof ObjectMethodTypeClass || target instanceof ObjectPropertyTypeClass;
};
