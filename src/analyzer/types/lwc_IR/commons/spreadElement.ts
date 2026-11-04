import { isSpreadElement, type SpreadElement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class SpreadElementTypeClass extends LwcCommonTypeClass<'spreadElement'> {
    private constructor(originalSource: string) {
        super('spreadElement', originalSource);
    }

    static create(target: SpreadElement, originalSource: string): SpreadElementTypeClass {
        throw new Error('SpreadElementTypeClass.create is not implemented: ' + target.type);
    }
}

export const spreadElementTypePair: EvaluatePair<SpreadElement, SpreadElementTypeClass> =
    makeEvaluatePair(isSpreadElement, (target, originalSource) =>
        SpreadElementTypeClass.create(target, originalSource),
    );

export const isSpreadElementType = (
    target: LwcCommonTypeClass<string>,
): target is SpreadElementTypeClass => target instanceof SpreadElementTypeClass;
