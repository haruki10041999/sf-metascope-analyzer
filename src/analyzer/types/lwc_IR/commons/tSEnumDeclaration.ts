import { isTSEnumDeclaration, type TSEnumDeclaration } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSEnumDeclarationTypeClass extends LwcCommonTypeClass<'tSEnumDeclaration'> {
    private constructor(originalSource: string) {
        super('tSEnumDeclaration', originalSource);
    }

    static create(target: TSEnumDeclaration, originalSource: string): TSEnumDeclarationTypeClass {
        throw new Error('TSEnumDeclarationTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSEnumDeclarationTypePair: EvaluatePair<
    TSEnumDeclaration,
    TSEnumDeclarationTypeClass
> = makeEvaluatePair(isTSEnumDeclaration, (target, originalSource) =>
    TSEnumDeclarationTypeClass.create(target, originalSource),
);

export const isTSEnumDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is TSEnumDeclarationTypeClass => target instanceof TSEnumDeclarationTypeClass;
