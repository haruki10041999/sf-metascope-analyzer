import { isTSArrayType, type TSArrayType } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSArrayTypeTypeClass extends LwcCommonTypeClass<'tSArrayType'> {
    private constructor(originalSource: string) {
        super('tSArrayType', originalSource);
    }

    static create(target: TSArrayType, originalSource: string): TSArrayTypeTypeClass {
        throw new Error('TSArrayTypeTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSArrayTypeTypePair: EvaluatePair<TSArrayType, TSArrayTypeTypeClass> =
    makeEvaluatePair(isTSArrayType, (target, originalSource) =>
        TSArrayTypeTypeClass.create(target, originalSource),
    );

export const isTSArrayTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSArrayTypeTypeClass => target instanceof TSArrayTypeTypeClass;
