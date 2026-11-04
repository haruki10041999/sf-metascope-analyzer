import { isTSModuleDeclaration, type TSModuleDeclaration } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSModuleDeclarationTypeClass extends LwcCommonTypeClass<'tSModuleDeclaration'> {
    private constructor(originalSource: string) {
        super('tSModuleDeclaration', originalSource);
    }

    static create(
        target: TSModuleDeclaration,
        originalSource: string,
    ): TSModuleDeclarationTypeClass {
        throw new Error('TSModuleDeclarationTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSModuleDeclarationTypePair: EvaluatePair<
    TSModuleDeclaration,
    TSModuleDeclarationTypeClass
> = makeEvaluatePair(isTSModuleDeclaration, (target, originalSource) =>
    TSModuleDeclarationTypeClass.create(target, originalSource),
);

export const isTSModuleDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is TSModuleDeclarationTypeClass => target instanceof TSModuleDeclarationTypeClass;
