import { isTSIntersectionType, type TSIntersectionType } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSIntersectionTypeTypeClass extends LwcCommonTypeClass<'tSIntersectionType'> {
    private constructor(originalSource: string) {
        super('tSIntersectionType', originalSource);
    }

    static create(target: TSIntersectionType, originalSource: string): TSIntersectionTypeTypeClass {
        throw new Error('TSIntersectionTypeTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSIntersectionTypeTypePair: EvaluatePair<
    TSIntersectionType,
    TSIntersectionTypeTypeClass
> = makeEvaluatePair(isTSIntersectionType, (target, originalSource) =>
    TSIntersectionTypeTypeClass.create(target, originalSource),
);

export const isTSIntersectionTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSIntersectionTypeTypeClass => target instanceof TSIntersectionTypeTypeClass;
