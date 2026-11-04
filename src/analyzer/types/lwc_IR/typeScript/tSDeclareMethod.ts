import { isTSDeclareMethod, type TSDeclareMethod } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSDeclareMethodTypeClass extends LwcCommonTypeClass<'tSDeclareMethod'> {
    private constructor(originalSource: string) {
        super('tSDeclareMethod', originalSource);
    }

    static create(target: TSDeclareMethod, originalSource: string): TSDeclareMethodTypeClass {
        throw new Error('TSDeclareMethodTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSDeclareMethodTypePair: EvaluatePair<TSDeclareMethod, TSDeclareMethodTypeClass> =
    makeEvaluatePair(isTSDeclareMethod, (target, originalSource) =>
        TSDeclareMethodTypeClass.create(target, originalSource),
    );

export const isTSDeclareMethodType = (
    target: LwcCommonTypeClass<string>,
): target is TSDeclareMethodTypeClass => target instanceof TSDeclareMethodTypeClass;
