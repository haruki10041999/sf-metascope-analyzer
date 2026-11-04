import { isClassPrivateMethod, type ClassPrivateMethod } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ClassPrivateMethodTypeClass extends LwcCommonTypeClass<'classPrivateMethod'> {
    private constructor(originalSource: string) {
        super('classPrivateMethod', originalSource);
    }

    static create(target: ClassPrivateMethod, originalSource: string): ClassPrivateMethodTypeClass {
        throw new Error('ClassPrivateMethodTypeClass.create is not implemented: ' + target.type);
    }
}

export const classPrivateMethodTypePair: EvaluatePair<
    ClassPrivateMethod,
    ClassPrivateMethodTypeClass
> = makeEvaluatePair(isClassPrivateMethod, (target, originalSource) =>
    ClassPrivateMethodTypeClass.create(target, originalSource),
);

export const isClassPrivateMethodType = (
    target: LwcCommonTypeClass<string>,
): target is ClassPrivateMethodTypeClass => target instanceof ClassPrivateMethodTypeClass;
