import { isObjectProperty, type ObjectProperty } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ObjectPropertyTypeClass extends LwcCommonTypeClass<'objectProperty'> {
    private constructor(originalSource: string) {
        super('objectProperty', originalSource);
    }

    static create(target: ObjectProperty, originalSource: string): ObjectPropertyTypeClass {
        throw new Error('ObjectPropertyTypeClass.create is not implemented: ' + target.type);
    }
}

export const objectPropertyTypePair: EvaluatePair<ObjectProperty, ObjectPropertyTypeClass> =
    makeEvaluatePair(isObjectProperty, (target, originalSource) =>
        ObjectPropertyTypeClass.create(target, originalSource),
    );

export const isObjectPropertyType = (
    target: LwcCommonTypeClass<string>,
): target is ObjectPropertyTypeClass => target instanceof ObjectPropertyTypeClass;
