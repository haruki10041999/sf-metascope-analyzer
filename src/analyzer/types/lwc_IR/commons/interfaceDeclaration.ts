import { isInterfaceDeclaration, type InterfaceDeclaration } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class InterfaceDeclarationTypeClass extends LwcCommonTypeClass<'interfaceDeclaration'> {
    private constructor(originalSource: string) {
        super('interfaceDeclaration', originalSource);
    }

    static create(
        target: InterfaceDeclaration,
        originalSource: string,
    ): InterfaceDeclarationTypeClass {
        throw new Error('InterfaceDeclarationTypeClass.create is not implemented: ' + target.type);
    }
}

export const interfaceDeclarationTypePair: EvaluatePair<
    InterfaceDeclaration,
    InterfaceDeclarationTypeClass
> = makeEvaluatePair(isInterfaceDeclaration, (target, originalSource) =>
    InterfaceDeclarationTypeClass.create(target, originalSource),
);

export const isInterfaceDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is InterfaceDeclarationTypeClass => target instanceof InterfaceDeclarationTypeClass;
