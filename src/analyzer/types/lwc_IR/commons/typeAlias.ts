import { isTypeAlias, type TypeAlias } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TypeAliasTypeClass extends LwcCommonTypeClass<'typeAlias'> {
    private constructor(originalSource: string) {
        super('typeAlias', originalSource);
    }

    static create(target: TypeAlias, originalSource: string): TypeAliasTypeClass {
        throw new Error('TypeAliasTypeClass.create is not implemented: ' + target.type);
    }
}

export const typeAliasTypePair: EvaluatePair<TypeAlias, TypeAliasTypeClass> = makeEvaluatePair(
    isTypeAlias,
    (target, originalSource) => TypeAliasTypeClass.create(target, originalSource),
);

export const isTypeAliasType = (target: LwcCommonTypeClass<string>): target is TypeAliasTypeClass =>
    target instanceof TypeAliasTypeClass;
