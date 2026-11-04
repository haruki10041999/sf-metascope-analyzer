import { isEnumDeclaration, type EnumDeclaration } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class EnumDeclarationTypeClass extends LwcCommonTypeClass<'enumDeclaration'> {
    private constructor(originalSource: string) {
        super('enumDeclaration', originalSource);
    }

    static create(target: EnumDeclaration, originalSource: string): EnumDeclarationTypeClass {
        throw new Error('EnumDeclarationTypeClass.create is not implemented: ' + target.type);
    }
}

export const enumDeclarationTypePair: EvaluatePair<EnumDeclaration, EnumDeclarationTypeClass> =
    makeEvaluatePair(isEnumDeclaration, (target, originalSource) =>
        EnumDeclarationTypeClass.create(target, originalSource),
    );

export const isEnumDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is EnumDeclarationTypeClass => target instanceof EnumDeclarationTypeClass;
