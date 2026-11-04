import { isClassPrivateProperty, type ClassPrivateProperty } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ClassPrivatePropertyTypeClass extends LwcCommonTypeClass<'classPrivateProperty'> {
    private constructor(originalSource: string) {
        super('classPrivateProperty', originalSource);
    }

    static create(
        target: ClassPrivateProperty,
        originalSource: string,
    ): ClassPrivatePropertyTypeClass {
        throw new Error('ClassPrivatePropertyTypeClass.create is not implemented: ' + target.type);
    }
}

export const classPrivatePropertyTypePair: EvaluatePair<
    ClassPrivateProperty,
    ClassPrivatePropertyTypeClass
> = makeEvaluatePair(isClassPrivateProperty, (target, originalSource) =>
    ClassPrivatePropertyTypeClass.create(target, originalSource),
);

export const isClassPrivatePropertyType = (
    target: LwcCommonTypeClass<string>,
): target is ClassPrivatePropertyTypeClass => target instanceof ClassPrivatePropertyTypeClass;
