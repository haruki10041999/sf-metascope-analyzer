import { isTSTypeAliasDeclaration, type TSTypeAliasDeclaration } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSTypeAliasDeclarationTypeClass extends LwcCommonTypeClass<'tSTypeAliasDeclaration'> {
    private constructor(originalSource: string) {
        super('tSTypeAliasDeclaration', originalSource);
    }

    static create(
        target: TSTypeAliasDeclaration,
        originalSource: string,
    ): TSTypeAliasDeclarationTypeClass {
        throw new Error(
            'TSTypeAliasDeclarationTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const tSTypeAliasDeclarationTypePair: EvaluatePair<
    TSTypeAliasDeclaration,
    TSTypeAliasDeclarationTypeClass
> = makeEvaluatePair(isTSTypeAliasDeclaration, (target, originalSource) =>
    TSTypeAliasDeclarationTypeClass.create(target, originalSource),
);

export const isTSTypeAliasDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is TSTypeAliasDeclarationTypeClass => target instanceof TSTypeAliasDeclarationTypeClass;
