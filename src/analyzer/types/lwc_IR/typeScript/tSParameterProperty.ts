import { isTSParameterProperty, type TSParameterProperty } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSParameterPropertyTypeClass extends LwcCommonTypeClass<'tSParameterProperty'> {
    private constructor(originalSource: string) {
        super('tSParameterProperty', originalSource);
    }

    static create(
        target: TSParameterProperty,
        originalSource: string,
    ): TSParameterPropertyTypeClass {
        throw new Error('TSParameterPropertyTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSParameterPropertyTypePair: EvaluatePair<
    TSParameterProperty,
    TSParameterPropertyTypeClass
> = makeEvaluatePair(isTSParameterProperty, (target, originalSource) =>
    TSParameterPropertyTypeClass.create(target, originalSource),
);

export const isTSParameterPropertyType = (
    target: LwcCommonTypeClass<string>,
): target is TSParameterPropertyTypeClass => target instanceof TSParameterPropertyTypeClass;
