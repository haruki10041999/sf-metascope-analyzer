import { isClassImplements, type ClassImplements } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ClassImplementsTypeClass extends LwcCommonTypeClass<'classImplements'> {
    private constructor(originalSource: string) {
        super('classImplements', originalSource);
    }

    static create(target: ClassImplements, originalSource: string): ClassImplementsTypeClass {
        throw new Error('ClassImplementsTypeClass.create is not implemented: ' + target.type);
    }
}

export const classImplementsTypePair: EvaluatePair<ClassImplements, ClassImplementsTypeClass> =
    makeEvaluatePair(isClassImplements, (target, originalSource) =>
        ClassImplementsTypeClass.create(target, originalSource),
    );

export const isClassImplementsType = (
    target: LwcCommonTypeClass<string>,
): target is ClassImplementsTypeClass => target instanceof ClassImplementsTypeClass;
