import { isVoidPattern, type VoidPattern } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class VoidPatternTypeClass extends LwcCommonTypeClass<'voidPattern'> {
    private constructor() {
        super('voidPattern');
    }

    static create(_target: VoidPattern, _originalSource: string): VoidPatternTypeClass {
        return new VoidPatternTypeClass();
    }
}

export const voidPatternTypePair: EvaluatePair<VoidPattern, VoidPatternTypeClass> =
    makeEvaluatePair(isVoidPattern, (target, originalSource) =>
        VoidPatternTypeClass.create(target, originalSource),
    );

export const isVoidPatternType = (
    target: LwcCommonTypeClass<string>,
): target is VoidPatternTypeClass => target instanceof VoidPatternTypeClass;
