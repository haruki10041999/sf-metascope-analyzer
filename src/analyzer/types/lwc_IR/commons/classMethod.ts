import { isClassMethod, type ClassMethod } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ClassMethodTypeClass extends LwcCommonTypeClass<'classMethod'> {
    private constructor(originalSource: string) {
        super('classMethod', originalSource);
    }

    static create(target: ClassMethod, originalSource: string): ClassMethodTypeClass {
        throw new Error('ClassMethodTypeClass.create is not implemented: ' + target.type);
    }
}

export const classMethodTypePair: EvaluatePair<ClassMethod, ClassMethodTypeClass> =
    makeEvaluatePair(isClassMethod, (target, originalSource) =>
        ClassMethodTypeClass.create(target, originalSource),
    );

export const isClassMethodType = (
    target: LwcCommonTypeClass<string>,
): target is ClassMethodTypeClass => target instanceof ClassMethodTypeClass;
