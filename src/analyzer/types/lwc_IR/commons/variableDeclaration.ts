import { isVariableDeclaration, type VariableDeclaration } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class VariableDeclarationTypeClass extends LwcCommonTypeClass<'variableDeclaration'> {
    private constructor(originalSource: string) {
        super('variableDeclaration', originalSource);
    }

    static create(
        target: VariableDeclaration,
        originalSource: string,
    ): VariableDeclarationTypeClass {
        throw new Error('VariableDeclarationTypeClass.create is not implemented: ' + target.type);
    }
}

export const variableDeclarationTypePair: EvaluatePair<
    VariableDeclaration,
    VariableDeclarationTypeClass
> = makeEvaluatePair(isVariableDeclaration, (target, originalSource) =>
    VariableDeclarationTypeClass.create(target, originalSource),
);

export const isVariableDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is VariableDeclarationTypeClass => target instanceof VariableDeclarationTypeClass;
