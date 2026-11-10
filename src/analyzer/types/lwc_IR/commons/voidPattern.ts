import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isVoidPattern, type VoidPattern } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type VoidPatternFields = TypeField<'voidPattern'>;

export class VoidPatternTypeClass extends LwcCommonTypeClass<'voidPattern', VoidPatternFields> {
    private constructor(sourceSpan: SourceSpan) {
        super('voidPattern', {}, sourceSpan);
    }

    static create(target: VoidPattern, originalSource: string): VoidPatternTypeClass {
        return new VoidPatternTypeClass(getSourceSpan(target, originalSource));
    }
}

export const voidPatternTypePair: EvaluatePair<VoidPattern, VoidPatternTypeClass> =
    makeEvaluatePair(isVoidPattern, (target, originalSource) =>
        VoidPatternTypeClass.create(target, originalSource),
    );

export const isVoidPatternType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is VoidPatternTypeClass => target instanceof VoidPatternTypeClass;
