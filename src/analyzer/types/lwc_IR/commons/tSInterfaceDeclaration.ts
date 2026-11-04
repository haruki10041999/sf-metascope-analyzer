import { isTSInterfaceDeclaration, type TSInterfaceDeclaration } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSInterfaceDeclarationTypeClass extends LwcCommonTypeClass<'tSInterfaceDeclaration'> {
    private constructor(originalSource: string) {
        super('tSInterfaceDeclaration', originalSource);
    }

    static create(
        target: TSInterfaceDeclaration,
        originalSource: string,
    ): TSInterfaceDeclarationTypeClass {
        throw new Error(
            'TSInterfaceDeclarationTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const tSInterfaceDeclarationTypePair: EvaluatePair<
    TSInterfaceDeclaration,
    TSInterfaceDeclarationTypeClass
> = makeEvaluatePair(isTSInterfaceDeclaration, (target, originalSource) =>
    TSInterfaceDeclarationTypeClass.create(target, originalSource),
);

export const isTSInterfaceDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is TSInterfaceDeclarationTypeClass => target instanceof TSInterfaceDeclarationTypeClass;
