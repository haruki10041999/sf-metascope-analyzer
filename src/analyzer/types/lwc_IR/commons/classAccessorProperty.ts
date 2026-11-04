import { isClassAccessorProperty, type ClassAccessorProperty } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ClassAccessorPropertyTypeClass extends LwcCommonTypeClass<'classAccessorProperty'> {
    private constructor(originalSource: string) {
        super('classAccessorProperty', originalSource);
    }

    static create(
        target: ClassAccessorProperty,
        originalSource: string,
    ): ClassAccessorPropertyTypeClass {
        throw new Error('ClassAccessorPropertyTypeClass.create is not implemented: ' + target.type);
    }
}

export const classAccessorPropertyTypePair: EvaluatePair<
    ClassAccessorProperty,
    ClassAccessorPropertyTypeClass
> = makeEvaluatePair(isClassAccessorProperty, (target, originalSource) =>
    ClassAccessorPropertyTypeClass.create(target, originalSource),
);

export const isClassAccessorPropertyType = (
    target: LwcCommonTypeClass<string>,
): target is ClassAccessorPropertyTypeClass => target instanceof ClassAccessorPropertyTypeClass;
