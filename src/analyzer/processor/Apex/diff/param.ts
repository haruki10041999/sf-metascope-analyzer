import { ErrorJson, ParameterJson } from '../../../types';

import {
    ListItemDiff,
    Match,
    NodeDiff,
    Sources,
    ValueDiff,
    makeNodeDiff,
    makeSequenceDiff,
    makeValueDiff,
} from './commons';
import { TypeDiff, makeTypeDiff } from './type';
import { ModifierDiff, makeModifierDiff } from './modifier';

export type ParameterDiff = NodeDiff<
    'parameter',
    ParameterJson,
    {
        variant: ValueDiff<string>;
        variantType: TypeDiff;
        modifier: ModifierDiff[];
    }
>;

export const makeParameterDiff = (
    before: ParameterJson | ErrorJson,
    after: ParameterJson | ErrorJson,
    match: Match = 'slot',
): ParameterDiff => {
    return makeNodeDiff('parameter', before, after, match, (b, a) => ({
        variant: makeValueDiff(b.variant, a.variant),
        variantType: makeTypeDiff(b.variantType, a.variantType),
        modifier: makeModifierDiff(b.modifier, a.modifier),
    }));
};

/** パラメータは位置で識別されるので C. 順序付き列。入れ替えは moved になる */
export type ParametersDiff = ListItemDiff<'parameter', ParameterJson | ErrorJson, ParameterDiff>;

export const makeParametersDiff = (
    before: (ParameterJson | ErrorJson)[],
    after: (ParameterJson | ErrorJson)[],
    sources?: Sources,
): ParametersDiff[] => {
    // 構文エラーの直し途中 (ErrorJson ↔ ParameterJson) も同じ位置のパラメータとして組にする
    return makeSequenceDiff('parameter', before, after, makeParameterDiff, {
        sources,
        canPair: () => true,
    });
};
