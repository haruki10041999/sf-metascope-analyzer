import typia from 'typia';

import type { SoqlType, SoslType } from '../../../types/apex/query';
import type { ModifierType } from '../../../types/apex/modifier';

type QueryReference = {
    kind: 'queryRef';
    queryKind: 'soql' | 'sosl';
    index: number;
};

export const isQueryReference = typia.createIs<QueryReference>();

export type RewriteQueries<T> = T extends { kind: 'soql' }
    ? QueryReference
    : T extends { kind: 'sosl' }
      ? QueryReference
      : T extends readonly (infer Item)[]
        ? RewriteQueries<Item>[]
        : T extends ModifierType
          ? T
          : T extends object
            ? { [Key in keyof T]: RewriteQueries<T[Key]> }
            : T;

export type QueryStore = {
    soql: ({ soqlIndex: number } & SoqlType)[];
    sosl: ({ soslIndex: number } & SoslType)[];
};

export const extractQueries = <T>(value: T, store: QueryStore): RewriteQueries<T> => {
    if (Array.isArray(value)) {
        return value.map((item) => extractQueries(item, store)) as RewriteQueries<T>;
    }

    if (value === null || typeof value !== 'object') {
        return value as RewriteQueries<T>;
    }

    const node = value as Record<string, unknown>;

    if (node.kind === 'soql') {
        const { kind: _kind, ...query } = node;
        const rewrittenQuery = extractQueries(query, store) as SoqlType;
        const index = store.soql.length + 1;

        store.soql.push({ soqlIndex: index, ...rewrittenQuery });
        return { kind: 'queryRef', queryKind: 'soql', index } as RewriteQueries<T>;
    }

    if (node.kind === 'sosl') {
        const { kind: _kind, ...query } = node;
        const rewrittenQuery = extractQueries(query, store) as SoslType;
        const index = store.sosl.length + 1;

        store.sosl.push({ soslIndex: index, ...rewrittenQuery });
        return { kind: 'queryRef', queryKind: 'sosl', index } as RewriteQueries<T>;
    }

    return Object.fromEntries(
        Object.entries(node).map(([key, child]) => [key, extractQueries(child, store)]),
    ) as RewriteQueries<T>;
};
