import { isDeclareVariable, type DeclareVariable } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class DeclareVariableTypeClass extends LwcCommonTypeClass<'declareVariable'> {
    private constructor(originalSource: string) {
        super('declareVariable', originalSource);
    }

    static create(target: DeclareVariable, originalSource: string): DeclareVariableTypeClass {
        throw new Error('DeclareVariableTypeClass.create is not implemented: ' + target.type);
    }
}

export const declareVariableTypePair: EvaluatePair<DeclareVariable, DeclareVariableTypeClass> =
    makeEvaluatePair(isDeclareVariable, (target, originalSource) =>
        DeclareVariableTypeClass.create(target, originalSource),
    );

export const isDeclareVariableType = (
    target: LwcCommonTypeClass<string>,
): target is DeclareVariableTypeClass => target instanceof DeclareVariableTypeClass;
