import { isTSTypeParameterDeclaration, type TSTypeParameterDeclaration } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSTypeParameterDeclarationTypeClass extends LwcCommonTypeClass<'tSTypeParameterDeclaration'> {
    private constructor(originalSource: string) {
        super('tSTypeParameterDeclaration', originalSource);
    }

    static create(
        target: TSTypeParameterDeclaration,
        originalSource: string,
    ): TSTypeParameterDeclarationTypeClass {
        throw new Error(
            'TSTypeParameterDeclarationTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const tSTypeParameterDeclarationTypePair: EvaluatePair<
    TSTypeParameterDeclaration,
    TSTypeParameterDeclarationTypeClass
> = makeEvaluatePair(isTSTypeParameterDeclaration, (target, originalSource) =>
    TSTypeParameterDeclarationTypeClass.create(target, originalSource),
);

export const isTSTypeParameterDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is TSTypeParameterDeclarationTypeClass =>
    target instanceof TSTypeParameterDeclarationTypeClass;
