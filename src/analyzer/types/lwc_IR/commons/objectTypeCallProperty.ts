import { isObjectTypeCallProperty, type ObjectTypeCallProperty } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ObjectTypeCallPropertyTypeClass extends LwcCommonTypeClass<'objectTypeCallProperty'> {
    private constructor(originalSource: string) {
        super('objectTypeCallProperty', originalSource);
    }

    static create(
        target: ObjectTypeCallProperty,
        originalSource: string,
    ): ObjectTypeCallPropertyTypeClass {
        throw new Error(
            'ObjectTypeCallPropertyTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const objectTypeCallPropertyTypePair: EvaluatePair<
    ObjectTypeCallProperty,
    ObjectTypeCallPropertyTypeClass
> = makeEvaluatePair(isObjectTypeCallProperty, (target, originalSource) =>
    ObjectTypeCallPropertyTypeClass.create(target, originalSource),
);

export const isObjectTypeCallPropertyType = (
    target: LwcCommonTypeClass<string>,
): target is ObjectTypeCallPropertyTypeClass => target instanceof ObjectTypeCallPropertyTypeClass;
