import { isTSTypeParameterInstantiation, type TSTypeParameterInstantiation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSTypeParameterInstantiationTypeClass extends LwcCommonTypeClass<'tSTypeParameterInstantiation'> {
    private constructor(originalSource: string) {
        super('tSTypeParameterInstantiation', originalSource);
    }

    static create(
        target: TSTypeParameterInstantiation,
        originalSource: string,
    ): TSTypeParameterInstantiationTypeClass {
        throw new Error(
            'TSTypeParameterInstantiationTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const tSTypeParameterInstantiationTypePair: EvaluatePair<
    TSTypeParameterInstantiation,
    TSTypeParameterInstantiationTypeClass
> = makeEvaluatePair(isTSTypeParameterInstantiation, (target, originalSource) =>
    TSTypeParameterInstantiationTypeClass.create(target, originalSource),
);

export const isTSTypeParameterInstantiationType = (
    target: LwcCommonTypeClass<string>,
): target is TSTypeParameterInstantiationTypeClass =>
    target instanceof TSTypeParameterInstantiationTypeClass;
