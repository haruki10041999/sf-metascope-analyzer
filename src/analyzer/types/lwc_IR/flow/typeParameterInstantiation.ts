import { isTypeParameterInstantiation, type TypeParameterInstantiation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TypeParameterInstantiationTypeClass extends LwcCommonTypeClass<'typeParameterInstantiation'> {
    private constructor(originalSource: string) {
        super('typeParameterInstantiation', originalSource);
    }

    static create(
        target: TypeParameterInstantiation,
        originalSource: string,
    ): TypeParameterInstantiationTypeClass {
        throw new Error(
            'TypeParameterInstantiationTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const typeParameterInstantiationTypePair: EvaluatePair<
    TypeParameterInstantiation,
    TypeParameterInstantiationTypeClass
> = makeEvaluatePair(isTypeParameterInstantiation, (target, originalSource) =>
    TypeParameterInstantiationTypeClass.create(target, originalSource),
);

export const isTypeParameterInstantiationType = (
    target: LwcCommonTypeClass<string>,
): target is TypeParameterInstantiationTypeClass =>
    target instanceof TypeParameterInstantiationTypeClass;
