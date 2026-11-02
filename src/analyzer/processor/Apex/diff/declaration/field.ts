import { ErrorJson, FieldDeclarationJson, VariantJson } from '../../../../types';

import {
    Identity,
    ListOrErrorDiff,
    Match,
    NodeDiff,
    OptionalDiff,
    Sources,
    ValueDiff,
    getObjectKey,
    getValueKey,
    makeListOrErrorDiff,
    makeNodeDiff,
    makeOptionalDiff,
    makeValueDiff,
    pairByKey,
} from '../commons';
import { makeBlockTree } from '../gumtree/tree';
import { TypeDiff, makeTypeDiff } from '../type';
import { BlockDiff, makeGumTreeBlockDiff } from './commons';

type Variant = VariantJson | ErrorJson;
type Init = NonNullable<VariantJson['init']>;

/**
 * field の変数。VariantJson は kind / sourceKeys を持たないので、ListItemDiff ではなく専用の形にする。
 * 初期値の式は GumTree で比べる (式 1 つを根の block の子にした木)。
 */
export type VariantDiff =
    | {
          status: 'unchanged';
          match: Match;
          index: { before: number; after: number };
          value: Variant;
      }
    | {
          status: 'changed';
          match: Match;
          index: { before: number; after: number };
          name: ValueDiff<string | ErrorJson>;
          init: OptionalDiff<Init, BlockDiff>;
      }
    | { status: 'added' | 'removed'; index: number; value: Variant };

const isErrorJson = (variant: Variant): variant is ErrorJson => 'kind' in variant;

const getVariantKey = (variant: Variant): string => {
    return isErrorJson(variant)
        ? getObjectKey(variant)
        : // 式は kind を持たないものが多く、JSON のままだと中の sourceKeys (位置) が入るので木の hash を使う
          `${getValueKey(variant.name)}=${variant.init === undefined ? '' : makeBlockTree([variant.init]).hash}`;
};

const getVariantId = (variant: Variant): string | undefined => {
    return isErrorJson(variant) || typeof variant.name !== 'string' ? undefined : variant.name;
};

/** 変数は D. キー対応 (キー: 変数名) */
export const makeVariantsDiff = (
    before: Variant[],
    after: Variant[],
    sources?: Sources,
): VariantDiff[] => {
    const pairings = pairByKey(
        before.map(getVariantId),
        after.map(getVariantId),
        before.map(getVariantKey),
        after.map(getVariantKey),
    );

    return pairings.map((p): VariantDiff => {
        if (p.status === 'removed') {
            return { status: 'removed', index: p.before, value: before[p.before]! };
        }
        if (p.status === 'added') {
            return { status: 'added', index: p.after, value: after[p.after]! };
        }

        const b = before[p.before]!;
        const a = after[p.after]!;
        const index = { before: p.before, after: p.after };
        // 名前で対応付くのは VariantJson 同士だけ。ErrorJson 同士は集合なので unchanged になる
        if (p.status !== 'changed' || isErrorJson(b) || isErrorJson(a)) {
            return { status: 'unchanged', match: p.match, index, value: b };
        }
        return {
            status: 'changed',
            match: p.match,
            index,
            name: makeValueDiff(b.name, a.name),
            init: makeOptionalDiff(b.init, a.init, (bi, ai) =>
                makeGumTreeBlockDiff([bi], [ai], sources),
            ),
        };
    });
};

export type FieldDiff = NodeDiff<
    'field',
    FieldDeclarationJson,
    {
        variantType: TypeDiff;
        variants: ListOrErrorDiff<VariantDiff, Variant>;
    }
>;

export const makeFieldDiff = (
    before: FieldDeclarationJson | ErrorJson,
    after: FieldDeclarationJson | ErrorJson,
    match: Match = 'slot',
    sources?: Sources,
    identity?: Identity<FieldDeclarationJson | ErrorJson>,
): FieldDiff => {
    return makeNodeDiff(
        'field',
        before,
        after,
        match,
        (b, a) => ({
            variantType: makeTypeDiff(b.variantType, a.variantType),
            variants: makeListOrErrorDiff(b.variants, a.variants, (bv, av) =>
                makeVariantsDiff(bv, av, sources),
            ),
        }),
        identity,
    );
};
