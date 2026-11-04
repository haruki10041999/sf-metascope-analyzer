import { isTypeParameter, type TypeParameter } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TypeParameterTypeClass extends LwcCommonTypeClass<'typeParameter'> {
    private constructor(originalSource: string) {
        super('typeParameter', originalSource);
    }

    static create(target: TypeParameter, originalSource: string): TypeParameterTypeClass {
        throw new Error('TypeParameterTypeClass.create is not implemented: ' + target.type);
    }
}

export const typeParameterTypePair: EvaluatePair<TypeParameter, TypeParameterTypeClass> =
    makeEvaluatePair(isTypeParameter, (target, originalSource) =>
        TypeParameterTypeClass.create(target, originalSource),
    );

export const isTypeParameterType = (
    target: LwcCommonTypeClass<string>,
): target is TypeParameterTypeClass => target instanceof TypeParameterTypeClass;
