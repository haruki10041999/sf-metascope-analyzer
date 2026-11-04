import { isTypeParameterDeclaration, type TypeParameterDeclaration } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TypeParameterDeclarationTypeClass extends LwcCommonTypeClass<'typeParameterDeclaration'> {
    private constructor(originalSource: string) {
        super('typeParameterDeclaration', originalSource);
    }

    static create(
        target: TypeParameterDeclaration,
        originalSource: string,
    ): TypeParameterDeclarationTypeClass {
        throw new Error(
            'TypeParameterDeclarationTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const typeParameterDeclarationTypePair: EvaluatePair<
    TypeParameterDeclaration,
    TypeParameterDeclarationTypeClass
> = makeEvaluatePair(isTypeParameterDeclaration, (target, originalSource) =>
    TypeParameterDeclarationTypeClass.create(target, originalSource),
);

export const isTypeParameterDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is TypeParameterDeclarationTypeClass =>
    target instanceof TypeParameterDeclarationTypeClass;
