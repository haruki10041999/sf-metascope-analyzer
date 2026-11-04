import { isTSEnumBody, type TSEnumBody } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSEnumBodyTypeClass extends LwcCommonTypeClass<'tSEnumBody'> {
    private constructor(originalSource: string) {
        super('tSEnumBody', originalSource);
    }

    static create(target: TSEnumBody, originalSource: string): TSEnumBodyTypeClass {
        throw new Error('TSEnumBodyTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSEnumBodyTypePair: EvaluatePair<TSEnumBody, TSEnumBodyTypeClass> = makeEvaluatePair(
    isTSEnumBody,
    (target, originalSource) => TSEnumBodyTypeClass.create(target, originalSource),
);

export const isTSEnumBodyType = (
    target: LwcCommonTypeClass<string>,
): target is TSEnumBodyTypeClass => target instanceof TSEnumBodyTypeClass;
