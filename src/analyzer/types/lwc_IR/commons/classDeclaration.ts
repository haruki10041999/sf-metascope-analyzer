import { isClassDeclaration, type ClassDeclaration } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ClassDeclarationTypeClass extends LwcCommonTypeClass<'classDeclaration'> {
    private constructor(originalSource: string) {
        super('classDeclaration', originalSource);
    }

    static create(target: ClassDeclaration, originalSource: string): ClassDeclarationTypeClass {
        throw new Error('ClassDeclarationTypeClass.create is not implemented: ' + target.type);
    }
}

export const classDeclarationTypePair: EvaluatePair<ClassDeclaration, ClassDeclarationTypeClass> =
    makeEvaluatePair(isClassDeclaration, (target, originalSource) =>
        ClassDeclarationTypeClass.create(target, originalSource),
    );

export const isClassDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is ClassDeclarationTypeClass => target instanceof ClassDeclarationTypeClass;
