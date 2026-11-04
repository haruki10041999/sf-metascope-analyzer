import { isTSIndexedAccessType, type TSIndexedAccessType } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSIndexedAccessTypeTypeClass extends LwcCommonTypeClass<'tSIndexedAccessType'> {
    private constructor(originalSource: string) {
        super('tSIndexedAccessType', originalSource);
    }

    static create(
        target: TSIndexedAccessType,
        originalSource: string,
    ): TSIndexedAccessTypeTypeClass {
        throw new Error('TSIndexedAccessTypeTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSIndexedAccessTypeTypePair: EvaluatePair<
    TSIndexedAccessType,
    TSIndexedAccessTypeTypeClass
> = makeEvaluatePair(isTSIndexedAccessType, (target, originalSource) =>
    TSIndexedAccessTypeTypeClass.create(target, originalSource),
);

export const isTSIndexedAccessTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSIndexedAccessTypeTypeClass => target instanceof TSIndexedAccessTypeTypeClass;
