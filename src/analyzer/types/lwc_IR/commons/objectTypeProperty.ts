import { isObjectTypeProperty, type ObjectTypeProperty } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ObjectTypePropertyTypeClass extends LwcCommonTypeClass<'objectTypeProperty'> {
    private constructor(originalSource: string) {
        super('objectTypeProperty', originalSource);
    }

    static create(target: ObjectTypeProperty, originalSource: string): ObjectTypePropertyTypeClass {
        throw new Error('ObjectTypePropertyTypeClass.create is not implemented: ' + target.type);
    }
}

export const objectTypePropertyTypePair: EvaluatePair<
    ObjectTypeProperty,
    ObjectTypePropertyTypeClass
> = makeEvaluatePair(isObjectTypeProperty, (target, originalSource) =>
    ObjectTypePropertyTypeClass.create(target, originalSource),
);

export const isObjectTypePropertyType = (
    target: LwcCommonTypeClass<string>,
): target is ObjectTypePropertyTypeClass => target instanceof ObjectTypePropertyTypeClass;
