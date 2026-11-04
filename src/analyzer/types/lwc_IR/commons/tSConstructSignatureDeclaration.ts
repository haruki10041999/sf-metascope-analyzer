import {
    isTSConstructSignatureDeclaration,
    type TSConstructSignatureDeclaration,
} from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSConstructSignatureDeclarationTypeClass extends LwcCommonTypeClass<'tSConstructSignatureDeclaration'> {
    private constructor(originalSource: string) {
        super('tSConstructSignatureDeclaration', originalSource);
    }

    static create(
        target: TSConstructSignatureDeclaration,
        originalSource: string,
    ): TSConstructSignatureDeclarationTypeClass {
        throw new Error(
            'TSConstructSignatureDeclarationTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const tSConstructSignatureDeclarationTypePair: EvaluatePair<
    TSConstructSignatureDeclaration,
    TSConstructSignatureDeclarationTypeClass
> = makeEvaluatePair(isTSConstructSignatureDeclaration, (target, originalSource) =>
    TSConstructSignatureDeclarationTypeClass.create(target, originalSource),
);

export const isTSConstructSignatureDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is TSConstructSignatureDeclarationTypeClass =>
    target instanceof TSConstructSignatureDeclarationTypeClass;
