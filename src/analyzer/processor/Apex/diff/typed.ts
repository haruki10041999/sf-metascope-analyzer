import { ErrorJson } from '../../../types';

import { JsonNode, Match, Sources } from '../../commons/diff/commons';
import {
    MovedFrom,
    TypedListDiff,
    makePairedItem,
    makeSingleItem,
    makeUnchangedItem,
} from '../../commons/diff/list';
import { GumTreeDiff } from '../../commons/diff/gumtree';

type DiffNode = JsonNode | ErrorJson;
type DiffObject = Record<string, unknown>;

// ---------------------------------------------------------------------------
// GumTree で対応付ける配列 (文の並び)
// ---------------------------------------------------------------------------

export type TypedDiffBuilder = (
    before: unknown[],
    after: unknown[],
    sources?: Sources,
) => GumTreeDiff[];
export type TypedItemDiffer<T> = (
    before: T,
    after: T,
    sources?: Sources,
    context?: TypedDiffContext,
) => unknown;

type MovedNode = {
    before: DiffNode;
    match: Match;
    from: MovedFrom;
};

export type TypedDiffContext = {
    movedFrom: Set<string>;
    movedTo: Map<string, MovedNode>;
};

const getSourceKeyFromKeys = (keys: unknown): string | undefined =>
    isObject(keys) && typeof keys.sourceKey === 'string' ? keys.sourceKey : undefined;

const getSourceKey = (value: unknown): string | undefined =>
    isObject(value) ? getSourceKeyFromKeys(value.sourceKeys) : undefined;

const collectSourceNodes = (value: unknown, nodes: Map<string, DiffNode>): void => {
    if (Array.isArray(value)) {
        value.forEach((item) => collectSourceNodes(item, nodes));
        return;
    }
    if (!isObject(value)) return;
    const key = getSourceKey(value);
    if (key && isDiffNode(value)) nodes.set(key, value);
    Object.values(value).forEach((item) => collectSourceNodes(item, nodes));
};

export const makeTypedDiffContext = (
    before: unknown[],
    after: unknown[],
    build: TypedDiffBuilder,
    sources?: Sources,
): { gumTreeDiffs: GumTreeDiff[]; context: TypedDiffContext } => {
    const gumTreeDiffs = build(before, after, sources);
    const beforeNodes = new Map<string, DiffNode>();
    collectSourceNodes(before, beforeNodes);

    const context: TypedDiffContext = { movedFrom: new Set(), movedTo: new Map() };
    const visit = (diffs: GumTreeDiff[]) => {
        for (const diff of diffs) {
            const from =
                diff.status === 'moved'
                    ? diff.from
                    : diff.status === 'changed'
                      ? diff.moved
                      : undefined;
            const beforeKey = getSourceKeyFromKeys(diff.sourceKeys.before);
            const afterKey = getSourceKeyFromKeys(diff.sourceKeys.after);
            if (from && beforeKey && afterKey && 'match' in diff) {
                const beforeNode = beforeNodes.get(beforeKey);
                if (beforeNode) {
                    context.movedFrom.add(beforeKey);
                    context.movedTo.set(afterKey, { before: beforeNode, match: diff.match, from });
                }
            }
            if ('children' in diff && diff.children) visit(diff.children);
        }
    };
    visit(gumTreeDiffs);
    return { gumTreeDiffs, context };
};

const isDiffNode = (value: unknown): value is DiffNode =>
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    typeof value.kind === 'string' &&
    'sourceKeys' in value;

const isObject = (value: unknown): value is DiffObject =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/** GumTree の対応 (precomputed、なければ build で作る) から、型付きリスト Diff を作る */
export const makeTypedArrayDiff = <T, D>(
    before: T[],
    after: T[],
    build: TypedDiffBuilder,
    makeItemDiff: TypedItemDiffer<T>,
    sources?: Sources,
    context?: TypedDiffContext,
    precomputed?: GumTreeDiff[],
): TypedListDiff<T, D> => {
    const gumTreeDiffs = precomputed ?? build(before, after, sources);
    const diffItem = (beforeItem: T, afterItem: T) =>
        makeItemDiff(beforeItem, afterItem, sources, context) as D;
    const items: TypedListDiff<T, D> = [];

    for (const diff of gumTreeDiffs) {
        if (diff.status === 'removed') {
            const index = diff.index.before!;
            // 別の場所へ移動したものは、移動先に 1 回だけ出す
            if (context?.movedFrom.has(getSourceKey(before[index]) ?? '')) continue;
            items.push(makeSingleItem('removed', before[index]!, index));
            continue;
        }
        if (diff.status === 'added') {
            const index = diff.index.after!;
            const moved = context?.movedTo.get(getSourceKey(after[index]) ?? '');
            if (moved) {
                items.push(
                    makePairedItem(
                        diffItem(moved.before as T, after[index]!),
                        'moved',
                        moved.match,
                        { before: moved.from.index, after: index },
                        moved.from,
                    ),
                );
                continue;
            }
            items.push(makeSingleItem('added', after[index]!, index));
            continue;
        }

        const index = { before: diff.index.before!, after: diff.index.after! };
        const afterValue = after[index.after]!;
        if (diff.status === 'unchanged') {
            items.push(makeUnchangedItem(before[index.before]!, afterValue, diff.match, index));
            continue;
        }
        const from = diff.status === 'moved' ? diff.from : diff.moved;
        // 別の親から移動してきたものの index.before は移動元の親の中の位置なので、
        // before[index] ではなく、移動元のノードを引く
        const moved = from ? context?.movedTo.get(getSourceKey(afterValue) ?? '') : undefined;
        const beforeValue = (moved?.before as T | undefined) ?? before[index.before]!;
        items.push(
            makePairedItem(
                diffItem(beforeValue, afterValue),
                from ? 'moved' : 'changed',
                diff.match,
                index,
                from,
            ),
        );
    }

    return items;
};
