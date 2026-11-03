import { ErrorJson } from '../../../types';

import {
    JsonNode,
    Match,
    OptionalDiff,
    Sources,
    ValueDiff,
    getValueKey,
    makeValueDiff,
    toBody,
} from './commons';
import { GumTreeDiff, MovedFrom } from './gumtree/diff';

type Primitive = string | number | boolean | null | undefined;
type DiffNode = JsonNode | ErrorJson;
type DiffObject = Record<string, unknown>;

type OptionalPropertyDiff<T> = undefined extends T
    ? OptionalDiff<Exclude<T, undefined>, TypedJsonDiff<Exclude<T, undefined>>>
    : TypedJsonDiff<T>;

export type TypedFieldsDiff<T extends object> = {
    [K in keyof T as K extends 'kind' | 'sourceKeys' ? never : K]: OptionalPropertyDiff<T[K]>;
};

export type TypedNodeDiff<T extends DiffNode> = {
    kind: T['kind'];
    sourceKeys: { before: T['sourceKeys']; after: T['sourceKeys'] };
} & (
    | { status: 'unchanged'; value: Omit<T, 'kind' | 'sourceKeys'> }
    | { status: 'changed'; match: Match; fields: TypedFieldsDiff<T> }
    | {
          status: 'changed';
          match: Match;
          before: Omit<T, 'kind' | 'sourceKeys'>;
          after: Omit<T, 'kind' | 'sourceKeys'>;
      }
);

export type TypedObjectDiff<T extends object, Fields = TypedFieldsDiff<T>> =
    | { status: 'unchanged'; value: T }
    | { status: 'changed'; fields: Fields }
    | { status: 'changed'; before: T; after: T };

export type TypedListItemDiff<T, NestedDiff = TypedJsonDiff<T>> =
    | { status: 'unchanged'; match: Match; index: { before: number; after: number }; value: T }
    | {
          status: 'changed' | 'moved';
          match: Match;
          index: { before: number; after: number };
          value: NestedDiff;
          from?: { parent: string; index: number };
      }
    | { status: 'removed'; index: number; value: T }
    | { status: 'added'; index: number; value: T };

export type TypedListDiff<T, NestedDiff = TypedJsonDiff<T>> = TypedListItemDiff<T, NestedDiff>[];

export type TypedJsonDiff<T> = T extends Primitive
    ? ValueDiff<T>
    : T extends DiffNode
      ? TypedNodeDiff<T>
      : T extends (infer Item)[]
        ? TypedListDiff<Item>
        : T extends object
          ? TypedObjectDiff<T>
          : ValueDiff<T>;

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
    const afterNodes = new Map<string, DiffNode>();
    collectSourceNodes(before, beforeNodes);
    collectSourceNodes(after, afterNodes);

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

const getObjectFields = (
    before: DiffObject,
    after: DiffObject,
    build: TypedDiffBuilder,
    sources?: Sources,
    context?: TypedDiffContext,
) => {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    return Object.fromEntries(
        [...keys].map((key) => {
            const beforeValue = before[key];
            const afterValue = after[key];
            if (beforeValue === undefined || afterValue === undefined) {
                return [
                    key,
                    beforeValue === undefined
                        ? { status: 'added', value: afterValue }
                        : { status: 'removed', value: beforeValue },
                ];
            }
            return [key, makeTypedJsonDiff(beforeValue, afterValue, build, sources, context)];
        }),
    );
};

const makeNodeDiff = <T extends DiffNode>(
    before: T,
    after: T,
    build: TypedDiffBuilder,
    sources?: Sources,
    context?: TypedDiffContext,
): TypedNodeDiff<T> => {
    const sourceKeys = { before: before.sourceKeys, after: after.sourceKeys };
    if (getValueKey(before) === getValueKey(after)) {
        return { kind: after.kind, sourceKeys, status: 'unchanged', value: toBody(after) };
    }

    if (before.kind !== after.kind) {
        return {
            kind: after.kind,
            sourceKeys,
            status: 'changed',
            match: 'slot',
            before: toBody(before),
            after: toBody(after),
        };
    }

    const fields = getObjectFields(
        before as unknown as DiffObject,
        after as unknown as DiffObject,
        build,
        sources,
        context,
    );
    delete fields.kind;
    delete fields.sourceKeys;
    return {
        kind: after.kind,
        sourceKeys,
        status: 'changed',
        match: 'slot',
        fields,
    } as TypedNodeDiff<T>;
};

export const makeTypedArrayDiff = <T>(
    before: T[],
    after: T[],
    build: TypedDiffBuilder,
    makeItemDiff: TypedItemDiffer<T>,
    sources?: Sources,
    context?: TypedDiffContext,
    precomputed?: GumTreeDiff[],
): TypedListItemDiff<T, unknown>[] => {
    const gumTreeDiffs = precomputed ?? build(before, after, sources);
    const diffItem = (beforeItem: T, afterItem: T) =>
        makeItemDiff(beforeItem, afterItem, sources, context);
    const items: TypedListItemDiff<T, unknown>[] = [];

    for (const diff of gumTreeDiffs) {
        if (diff.status === 'removed') {
            const index = diff.index.before!;
            if (context?.movedFrom.has(getSourceKey(before[index]) ?? '')) continue;
            items.push({ status: 'removed', index, value: before[index]! });
            continue;
        }
        if (diff.status === 'added') {
            const index = diff.index.after!;
            const moved = context?.movedTo.get(getSourceKey(after[index]) ?? '');
            if (moved) {
                items.push({
                    status: 'moved',
                    match: moved.match,
                    index: { before: moved.from.index, after: index },
                    value: diffItem(moved.before as T, after[index]!),
                    from: moved.from,
                });
                continue;
            }
            items.push({ status: 'added', index, value: after[index]! });
            continue;
        }

        const beforeIndex = diff.index.before!;
        const afterIndex = diff.index.after!;
        const beforeValue = before[beforeIndex]!;
        const afterValue = after[afterIndex]!;
        if (diff.status === 'unchanged') {
            items.push({
                status: 'unchanged',
                match: diff.match,
                index: { before: beforeIndex, after: afterIndex },
                value: afterValue,
            });
        } else {
            items.push({
                status: diff.status,
                match: diff.match,
                index: { before: beforeIndex, after: afterIndex },
                value: diffItem(beforeValue, afterValue),
                ...(diff.status === 'moved' ? { from: diff.from } : {}),
            });
        }
    }

    return items;
};

export const makeTypedJsonDiff = <Before, After>(
    before: Before,
    after: After,
    build: TypedDiffBuilder,
    sources?: Sources,
    context?: TypedDiffContext,
): TypedJsonDiff<Before | After> => {
    if (isDiffNode(before) && isDiffNode(after)) {
        return makeNodeDiff(
            before,
            after as unknown as typeof before,
            build,
            sources,
            context,
        ) as unknown as TypedJsonDiff<Before | After>;
    }
    if (Array.isArray(before) && Array.isArray(after)) {
        return makeValueDiff<Before | After>(
            before as Before | After,
            after as Before | After,
        ) as TypedJsonDiff<Before | After>;
    }
    if (isObject(before) && isObject(after)) {
        if (getValueKey(before) === getValueKey(after)) {
            return { status: 'unchanged', value: after } as TypedJsonDiff<Before | After>;
        }
        if (isDiffNode(before) !== isDiffNode(after)) {
            return { status: 'changed', before, after } as TypedJsonDiff<Before | After>;
        }
        return {
            status: 'changed',
            fields: getObjectFields(before, after, build, sources, context),
        } as TypedJsonDiff<Before | After>;
    }
    return makeValueDiff<Before | After>(
        before as Before | After,
        after as Before | After,
    ) as TypedJsonDiff<Before | After>;
};
