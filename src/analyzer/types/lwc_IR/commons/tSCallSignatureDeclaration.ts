import { isTSCallSignatureDeclaration, type TSCallSignatureDeclaration } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSCallSignatureDeclarationTypeClass extends LwcCommonTypeClass<'tSCallSignatureDeclaration'> {
    private constructor(originalSource: string) {
        super('tSCallSignatureDeclaration', originalSource);
    }

    static create(
        target: TSCallSignatureDeclaration,
        originalSource: string,
    ): TSCallSignatureDeclarationTypeClass {
        throw new Error(
            'TSCallSignatureDeclarationTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const tSCallSignatureDeclarationTypePair: EvaluatePair<
    TSCallSignatureDeclaration,
    TSCallSignatureDeclarationTypeClass
> = makeEvaluatePair(isTSCallSignatureDeclaration, (target, originalSource) =>
    TSCallSignatureDeclarationTypeClass.create(target, originalSource),
);

export const isTSCallSignatureDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is TSCallSignatureDeclarationTypeClass =>
    target instanceof TSCallSignatureDeclarationTypeClass;
