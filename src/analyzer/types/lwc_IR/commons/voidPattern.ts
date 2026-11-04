import { isVoidPattern, type VoidPattern } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class VoidPatternTypeClass extends LwcCommonTypeClass<'voidPattern'> {
    private constructor(originalSource: string) {
        super('voidPattern', originalSource);
    }

    static create(target: VoidPattern, originalSource: string): VoidPatternTypeClass {
        throw new Error('VoidPatternTypeClass.create is not implemented: ' + target.type);
    }
}

export const voidPatternTypePair: EvaluatePair<VoidPattern, VoidPatternTypeClass> =
    makeEvaluatePair(isVoidPattern, (target, originalSource) =>
        VoidPatternTypeClass.create(target, originalSource),
    );

export const isVoidPatternType = (
    target: LwcCommonTypeClass<string>,
): target is VoidPatternTypeClass => target instanceof VoidPatternTypeClass;
