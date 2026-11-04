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
} from '../../commons/diff/commons';
import { TypeJsonDiff, makeTypeDiff } from './type';
import { ModifiersJsonDiff, makeModifierDiff } from './modifier';

export type ParameterJsonDiff = NodeDiff<
    'parameter',
    ParameterJson,
    {
        variant: ValueDiff<string>;
        variantType: TypeJsonDiff;
        modifier: ModifiersJsonDiff;
    }
>;

export const makeParameterDiff = (
    before: ParameterJson | ErrorJson,
    after: ParameterJson | ErrorJson,
    match: Match = 'slot',
): ParameterJsonDiff => {
    return makeNodeDiff('parameter', before, after, match, (b, a) => ({
        variant: makeValueDiff(b.variant, a.variant),
        variantType: makeTypeDiff(b.variantType, a.variantType),
        modifier: makeModifierDiff(b.modifier, a.modifier),
    }));
};

/** パラメータは位置で識別されるので C. 順序付き列。入れ替えは moved になる */
export type ParametersDiff = ListItemDiff<
    'parameter',
    ParameterJson | ErrorJson,
    ParameterJsonDiff
>;

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
