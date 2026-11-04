import { isTSConditionalType, type TSConditionalType } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSConditionalTypeTypeClass extends LwcCommonTypeClass<'tSConditionalType'> {
    private constructor(originalSource: string) {
        super('tSConditionalType', originalSource);
    }

    static create(target: TSConditionalType, originalSource: string): TSConditionalTypeTypeClass {
        throw new Error('TSConditionalTypeTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSConditionalTypeTypePair: EvaluatePair<
    TSConditionalType,
    TSConditionalTypeTypeClass
> = makeEvaluatePair(isTSConditionalType, (target, originalSource) =>
    TSConditionalTypeTypeClass.create(target, originalSource),
);

export const isTSConditionalTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSConditionalTypeTypeClass => target instanceof TSConditionalTypeTypeClass;
