import { ErrorJson, FieldJson, SelectEntryJson } from '../../../../types';

import {
    ListItemDiff,
    Match,
    NodeDiff,
    OptionalDiff,
    Sources,
    ValueDiff,
    getValueKey,
    isSameValue,
    makeNodeDiff,
    makeOptionalDiff,
    makeSetDiff,
    makeValueDiff,
} from '../commons';
import { SubQueryDiff, makeSubQueryDiff } from './subQuery';
import { SoqlFunctionDiff, makeSoqlFunctionDiff } from './soqlFunction';
import { TypeOfDiff, makeTypeOfDiff } from './typeof';

export type FieldPartDiff = (ValueDiff<string> | { status: 'added' | 'removed'; value: string })[];

export type FieldPathDiff =
    { status: 'unchanged'; value: string[] } | { status: 'changed'; parts: FieldPartDiff };

export type FieldDiff = {
    type: 'field';
    field: FieldPathDiff;
};

export const makeFieldPathDiff = (before: string[], after: string[]): FieldPathDiff => {
    if (isSameValue(before, after)) return { status: 'unchanged', value: before };

    const parts: FieldPartDiff = [];
    const length = Math.max(before.length, after.length);
    for (let offset = 1; offset <= length; offset++) {
        const beforePart = before[before.length - offset];
        const afterPart = after[after.length - offset];
        if (beforePart === undefined && afterPart !== undefined) {
            parts.push({ status: 'added', value: afterPart });
        } else if (beforePart !== undefined && afterPart === undefined) {
            parts.push({ status: 'removed', value: beforePart });
        } else if (beforePart !== undefined && afterPart !== undefined) {
            parts.push(makeValueDiff(beforePart, afterPart));
        }
    }

    return { status: 'changed', parts: parts.reverse() };
};

export const makeFieldDiff = (before: FieldJson, after: FieldJson): FieldDiff => ({
    type: 'field',
    field: makeFieldPathDiff(before.field, after.field),
});

export type SelectEntryFieldsDiff =
    | {
          type: 'field';
          alias: OptionalDiff<string, ValueDiff<string>>;
          content: FieldDiff;
      }
    | {
          type: 'soqlFunction';
          alias: OptionalDiff<string, ValueDiff<string>>;
          content: SoqlFunctionDiff;
      }
    | {
          type: 'typeOf';
          alias: OptionalDiff<string, ValueDiff<string>>;
          content: TypeOfDiff;
      };

type SelectEntryNode = Extract<SelectEntryJson, { kind: 'selectEntry' }>;

export type SelectEntryDiff =
    NodeDiff<'selectEntry', SelectEntryNode, SelectEntryFieldsDiff> | SubQueryDiff;

export type SelectEntriesDiff = ListItemDiff<
    'selectEntry',
    SelectEntryJson | ErrorJson,
    SelectEntryDiff
>;

const selectEntryIdentity = (entry: SelectEntryJson | ErrorJson): string => {
    if (entry.kind === 'error') return entry.sourceKeys.objectKey;
    if (entry.kind === 'subQuery') {
        return getValueKey({
            kind: entry.kind,
            from: getValueKey(entry.from),
        });
    }
    const { kind, sourceKeys: _sourceKeys, alias: _alias, ...content } = entry;
    return getValueKey({ kind, ...content });
};

export const makeSelectEntryDiff = (
    before: SelectEntryJson | ErrorJson,
    after: SelectEntryJson | ErrorJson,
    match: Match = 'slot',
): SelectEntryDiff => {
    if (before.kind === 'subQuery' && after.kind === 'subQuery') {
        const subQueryMatch =
            before.sourceKeys.objectKey === after.sourceKeys.objectKey ? match : 'key';
        return makeSubQueryDiff(before, after, subQueryMatch);
    }

    return makeNodeDiff(
        'selectEntry',
        before as SelectEntryNode | ErrorJson,
        after as SelectEntryNode | ErrorJson,
        match,
        (b, a) => {
            if (b.type !== a.type) return undefined;
            if (b.type === 'field' && a.type === 'field') {
                return {
                    type: 'field',
                    alias: makeOptionalDiff(b.alias, a.alias, makeValueDiff),
                    content: makeFieldDiff(b, a),
                };
            }
            if (b.type === 'soqlFunction' && a.type === 'soqlFunction') {
                return {
                    type: 'soqlFunction',
                    alias: makeOptionalDiff(b.alias, a.alias, makeValueDiff),
                    content: makeSoqlFunctionDiff(b, a),
                };
            }
            if (b.type === 'typeOf' && a.type === 'typeOf') {
                return {
                    type: 'typeOf',
                    alias: makeOptionalDiff(b.alias, a.alias, makeValueDiff),
                    content: makeTypeOfDiff(b, a),
                };
            }
            return undefined;
        },
    );
};

export const makeSelectEntriesDiff = (
    before: (SelectEntryJson | ErrorJson)[],
    after: (SelectEntryJson | ErrorJson)[],
    sources?: Sources,
): SelectEntriesDiff[] =>
    makeSetDiff('selectEntry', before, after, makeSelectEntryDiff, sources, selectEntryIdentity);

export type SelectDiff =
    { field: SelectEntriesDiff[] } | ValueDiff<(SelectEntryJson | ErrorJson)[] | ErrorJson>;

export const makeSelectDiff = (
    before: (SelectEntryJson | ErrorJson)[] | ErrorJson,
    after: (SelectEntryJson | ErrorJson)[] | ErrorJson,
    sources?: Sources,
): SelectDiff => {
    if (Array.isArray(before) && Array.isArray(after)) {
        return { field: makeSelectEntriesDiff(before, after, sources) };
    }
    return makeValueDiff(before, after);
};
