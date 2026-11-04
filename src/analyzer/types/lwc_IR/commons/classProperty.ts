import { isClassProperty, type ClassProperty } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ClassPropertyTypeClass extends LwcCommonTypeClass<'classProperty'> {
    private constructor(originalSource: string) {
        super('classProperty', originalSource);
    }

    static create(target: ClassProperty, originalSource: string): ClassPropertyTypeClass {
        throw new Error('ClassPropertyTypeClass.create is not implemented: ' + target.type);
    }
}

export const classPropertyTypePair: EvaluatePair<ClassProperty, ClassPropertyTypeClass> =
    makeEvaluatePair(isClassProperty, (target, originalSource) =>
        ClassPropertyTypeClass.create(target, originalSource),
    );

export const isClassPropertyType = (
    target: LwcCommonTypeClass<string>,
): target is ClassPropertyTypeClass => target instanceof ClassPropertyTypeClass;
