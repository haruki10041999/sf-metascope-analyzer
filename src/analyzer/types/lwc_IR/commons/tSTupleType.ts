import { isTSTupleType, type TSTupleType } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSTupleTypeTypeClass extends LwcCommonTypeClass<'tSTupleType'> {
    private constructor(originalSource: string) {
        super('tSTupleType', originalSource);
    }

    static create(target: TSTupleType, originalSource: string): TSTupleTypeTypeClass {
        throw new Error('TSTupleTypeTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSTupleTypeTypePair: EvaluatePair<TSTupleType, TSTupleTypeTypeClass> =
    makeEvaluatePair(isTSTupleType, (target, originalSource) =>
        TSTupleTypeTypeClass.create(target, originalSource),
    );

export const isTSTupleTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSTupleTypeTypeClass => target instanceof TSTupleTypeTypeClass;
