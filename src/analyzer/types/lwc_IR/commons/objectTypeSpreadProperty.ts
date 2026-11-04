import { isObjectTypeSpreadProperty, type ObjectTypeSpreadProperty } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ObjectTypeSpreadPropertyTypeClass extends LwcCommonTypeClass<'objectTypeSpreadProperty'> {
    private constructor(originalSource: string) {
        super('objectTypeSpreadProperty', originalSource);
    }

    static create(
        target: ObjectTypeSpreadProperty,
        originalSource: string,
    ): ObjectTypeSpreadPropertyTypeClass {
        throw new Error(
            'ObjectTypeSpreadPropertyTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const objectTypeSpreadPropertyTypePair: EvaluatePair<
    ObjectTypeSpreadProperty,
    ObjectTypeSpreadPropertyTypeClass
> = makeEvaluatePair(isObjectTypeSpreadProperty, (target, originalSource) =>
    ObjectTypeSpreadPropertyTypeClass.create(target, originalSource),
);

export const isObjectTypeSpreadPropertyType = (
    target: LwcCommonTypeClass<string>,
): target is ObjectTypeSpreadPropertyTypeClass =>
    target instanceof ObjectTypeSpreadPropertyTypeClass;
