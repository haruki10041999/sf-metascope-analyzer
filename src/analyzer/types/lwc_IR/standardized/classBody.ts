import { isClassBody, type ClassBody } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ClassBodyTypeClass extends LwcCommonTypeClass<'classBody'> {
    private constructor(originalSource: string) {
        super('classBody', originalSource);
    }

    static create(target: ClassBody, originalSource: string): ClassBodyTypeClass {
        throw new Error('ClassBodyTypeClass.create is not implemented: ' + target.type);
    }
}

export const classBodyTypePair: EvaluatePair<ClassBody, ClassBodyTypeClass> = makeEvaluatePair(
    isClassBody,
    (target, originalSource) => ClassBodyTypeClass.create(target, originalSource),
);

export const isClassBodyType = (target: LwcCommonTypeClass<string>): target is ClassBodyTypeClass =>
    target instanceof ClassBodyTypeClass;
