import { isDeclareTypeAlias, type DeclareTypeAlias } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class DeclareTypeAliasTypeClass extends LwcCommonTypeClass<'declareTypeAlias'> {
    private constructor(originalSource: string) {
        super('declareTypeAlias', originalSource);
    }

    static create(target: DeclareTypeAlias, originalSource: string): DeclareTypeAliasTypeClass {
        throw new Error('DeclareTypeAliasTypeClass.create is not implemented: ' + target.type);
    }
}

export const declareTypeAliasTypePair: EvaluatePair<DeclareTypeAlias, DeclareTypeAliasTypeClass> =
    makeEvaluatePair(isDeclareTypeAlias, (target, originalSource) =>
        DeclareTypeAliasTypeClass.create(target, originalSource),
    );

export const isDeclareTypeAliasType = (
    target: LwcCommonTypeClass<string>,
): target is DeclareTypeAliasTypeClass => target instanceof DeclareTypeAliasTypeClass;
