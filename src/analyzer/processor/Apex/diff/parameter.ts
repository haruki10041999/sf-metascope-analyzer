import { ConvertKeys, ErrorJson, isErrorJson, ParameterJson, TypeJson } from '../../../types';

import { TypeDiff, makeTypeDiff } from './type';
import { ModifierDiff, makeModifierDiff } from './modifier';

export type ParameterDiff = {
    kind: 'parameter';
    sourceKeys: { before: ConvertKeys };
    variant:
        | { status: 'unchanged'; value: string }
        | { status: 'changed'; before: string; after: string };
    variantType:
        | TypeDiff
        | { status: 'unchanged'; value: TypeJson | ErrorJson }
        | { status: 'changed'; before: TypeJson | ErrorJson; after: TypeJson | ErrorJson };
    modifier: ModifierDiff;
};

export const makeParameterDiff = (before: ParameterJson, after: ParameterJson): ParameterDiff => {
    const variant =
        before.variant === after.variant
            ? { status: 'unchanged', value: before.variant }
            : { status: 'changed', before: before.variant, after: after.variant };
    const variantType =
        isErrorJson(before.variantType) || isErrorJson(after.variantType)
            ? isErrorJson(before.variantType) && isErrorJson(after.variantType)
                ? { status: 'unchanged', value: before.variantType }
                : {
                      status: 'changed',
                      before: before.variantType,
                      after: after.variantType,
                  }
            : makeTypeDiff(before.variantType, after.variantType);
    const modifier = makeModifierDiff(before.modifier, after.modifier);

    return {
        kind: 'parameter',
        variant: variant,
        variantType: variantType,
        modifier: modifier,
    };
};
