import { isTSThisType, type TSThisType } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSThisTypeTypeClass extends LwcCommonTypeClass<'tSThisType'> {
    private constructor(originalSource: string) {
        super('tSThisType', originalSource);
    }

    static create(target: TSThisType, originalSource: string): TSThisTypeTypeClass {
        throw new Error('TSThisTypeTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSThisTypeTypePair: EvaluatePair<TSThisType, TSThisTypeTypeClass> = makeEvaluatePair(
    isTSThisType,
    (target, originalSource) => TSThisTypeTypeClass.create(target, originalSource),
);

export const isTSThisTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSThisTypeTypeClass => target instanceof TSThisTypeTypeClass;
