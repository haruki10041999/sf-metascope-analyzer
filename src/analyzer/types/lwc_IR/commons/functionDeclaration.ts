import { isFunctionDeclaration, type FunctionDeclaration } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class FunctionDeclarationTypeClass extends LwcCommonTypeClass<'functionDeclaration'> {
    private constructor(originalSource: string) {
        super('functionDeclaration', originalSource);
    }

    static create(
        target: FunctionDeclaration,
        originalSource: string,
    ): FunctionDeclarationTypeClass {
        throw new Error('FunctionDeclarationTypeClass.create is not implemented: ' + target.type);
    }
}

export const functionDeclarationTypePair: EvaluatePair<
    FunctionDeclaration,
    FunctionDeclarationTypeClass
> = makeEvaluatePair(isFunctionDeclaration, (target, originalSource) =>
    FunctionDeclarationTypeClass.create(target, originalSource),
);

export const isFunctionDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is FunctionDeclarationTypeClass => target instanceof FunctionDeclarationTypeClass;
