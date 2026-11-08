import { isTSThisType, type TSThisType } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSThisTypeTypeClass extends LwcCommonTypeClass<'tSThisType'> {
    private constructor() {
        super('tSThisType');
    }

    static create(_target: TSThisType, _originalSource: string): TSThisTypeTypeClass {
        return new TSThisTypeTypeClass();
    }
}

export const tSThisTypeTypePair: EvaluatePair<TSThisType, TSThisTypeTypeClass> = makeEvaluatePair(
    isTSThisType,
    (target, originalSource) => TSThisTypeTypeClass.create(target, originalSource),
);

export const isTSThisTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSThisTypeTypeClass => target instanceof TSThisTypeTypeClass;
