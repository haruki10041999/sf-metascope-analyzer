import {
    ErrorJson,
    FieldOrderJson,
    FieldSpecJson,
    LimitJson,
    OffsetJson,
    SoslFieldJson,
    SoslJson,
    SoslWithJson,
    isErrorJson,
} from '../../../../types';

import {
    ListItemDiff,
    Match,
    NodeDiff,
    OptionalDiff,
    Sources,
    ValueDiff,
    getValueKey,
    makeNodeDiff,
    makeOptionalDiff,
    makeSequenceDiff,
    makeSetDiff,
    makeValueDiff,
    pairAsSequence,
} from '../commons';
import { FieldTermDiff, ValueListItemDiff, makeUnorderedValueListDiff } from './commons';
import { OrderFieldDiff, makeOrderFieldDiff } from './orderBy';
import { LimitDiff, makeLimitDiff } from './limit';
import { OffsetDiff, makeOffsetDiff } from './offset';
import { UpdateListDiff, makeUpdateListDiff } from './updateList';
import { makeSoqlFunctionDiff } from './soqlFunction';

export type SoslFieldDiff = NodeDiff<
    'soslField',
    SoslFieldJson,
    {
        field: FieldTermDiff | ValueDiff<SoslFieldJson['field']>;
        func: OptionalDiff<
            NonNullable<SoslFieldJson['func']>,
            ValueDiff<NonNullable<SoslFieldJson['func']>>
        >;
    }
>;

export const makeSoslFieldDiff = (
    before: SoslFieldJson | ErrorJson,
    after: SoslFieldJson | ErrorJson,
    match: Match = 'slot',
): SoslFieldDiff =>
    makeNodeDiff('soslField', before, after, match, (b, a) => {
        let field: FieldTermDiff | ValueDiff<SoslFieldJson['field']>;
        if (
            !Array.isArray(b.field) &&
            !Array.isArray(a.field) &&
            b.field.type === 'soqlFunction' &&
            a.field.type === 'soqlFunction'
        ) {
            field = {
                type: 'soqlFunction',
                value: makeSoqlFunctionDiff(b.field, a.field),
            };
        } else {
            field = makeValueDiff(b.field, a.field);
        }
        return {
            field,
            func: makeOptionalDiff(b.func, a.func, makeValueDiff),
        };
    });

export type SoslFieldListDiff = ListItemDiff<
    'soslField',
    SoslFieldJson | ErrorJson,
    SoslFieldDiff
>[];

const makeSoslFieldListDiff = (
    before: FieldSpecJson['field'],
    after: FieldSpecJson['field'],
    sources?: Sources,
): SoslFieldListDiff | ValueDiff<FieldSpecJson['field']> =>
    Array.isArray(before) && Array.isArray(after)
        ? makeSetDiff('soslField', before, after, makeSoslFieldDiff, sources)
        : makeValueDiff(before, after);

export type FieldSpecFieldsDiff = {
    object: ValueListItemDiff<string | ErrorJson>[] | ValueDiff<FieldSpecJson['object']>;
    field: OptionalDiff<
        FieldSpecJson['field'],
        SoslFieldListDiff | ValueDiff<FieldSpecJson['field']>
    >;
    where: OptionalDiff<FieldSpecJson['where'], ValueDiff<FieldSpecJson['where']>>;
    orderBy: OptionalDiff<
        FieldSpecJson['orderBy'],
        | ListItemDiff<'orderField', FieldOrderJson | ErrorJson, OrderFieldDiff>[]
        | ValueDiff<(FieldOrderJson | ErrorJson)[] | ErrorJson>
    >;
    listView: OptionalDiff<
        FieldSpecJson['listView'],
        ValueListItemDiff<string | ErrorJson>[] | ValueDiff<FieldSpecJson['listView']>
    >;
    limit: OptionalDiff<LimitJson | ErrorJson, LimitDiff>;
    offset: OptionalDiff<OffsetJson | ErrorJson, OffsetDiff>;
};

export type FieldSpecDiff =
    | { status: 'unchanged'; value: FieldSpecJson }
    | { status: 'changed'; fields: FieldSpecFieldsDiff }
    | { status: 'changed'; before: FieldSpecJson | ErrorJson; after: FieldSpecJson | ErrorJson };

const makeFieldSpecDiff = (
    before: FieldSpecJson,
    after: FieldSpecJson,
    sources?: Sources,
): FieldSpecDiff => {
    if (getValueKey(before) === getValueKey(after)) {
        return { status: 'unchanged', value: before };
    }
    return {
        status: 'changed',
        fields: {
            object:
                Array.isArray(before.object) && Array.isArray(after.object)
                    ? makeUnorderedValueListDiff(before.object, after.object)
                    : makeValueDiff(before.object, after.object),
            field: makeOptionalDiff(before.field, after.field, (b, a) =>
                makeSoslFieldListDiff(b, a, sources),
            ),
            where: makeOptionalDiff(before.where, after.where, makeValueDiff),
            orderBy: makeOptionalDiff(before.orderBy, after.orderBy, (b, a) =>
                Array.isArray(b) && Array.isArray(a)
                    ? makeSequenceDiff('orderField', b, a, makeOrderFieldDiff, { sources })
                    : makeValueDiff(b, a),
            ),
            listView: makeOptionalDiff(before.listView, after.listView, (b, a) =>
                Array.isArray(b) && Array.isArray(a)
                    ? makeUnorderedValueListDiff(b, a)
                    : makeValueDiff(b, a),
            ),
            limit: makeOptionalDiff(before.limit, after.limit, makeLimitDiff),
            offset: makeOptionalDiff(before.offset, after.offset, makeOffsetDiff),
        },
    };
};

export type FieldSpecItemDiff =
    | {
          status: 'unchanged' | 'moved';
          index: { before: number; after: number };
          value: FieldSpecJson | ErrorJson;
      }
    | {
          status: 'changed';
          index: { before: number; after: number };
          value: FieldSpecDiff;
      }
    | { status: 'removed'; index: number; value: FieldSpecJson | ErrorJson }
    | { status: 'added'; index: number; value: FieldSpecJson | ErrorJson };

export type FieldSpecListDiff =
    FieldSpecItemDiff[] | ValueDiff<(FieldSpecJson | ErrorJson)[] | ErrorJson | undefined>;

const makeFieldSpecListDiff = (
    before: (FieldSpecJson | ErrorJson)[] | ErrorJson | undefined,
    after: (FieldSpecJson | ErrorJson)[] | ErrorJson | undefined,
    sources?: Sources,
): FieldSpecListDiff => {
    if (!Array.isArray(before) || !Array.isArray(after)) {
        return makeValueDiff(before, after);
    }

    const pairings = pairAsSequence(before.map(getValueKey), after.map(getValueKey));
    return pairings.map((pairing): FieldSpecItemDiff => {
        if (pairing.status === 'removed') {
            return { status: 'removed', index: pairing.before, value: before[pairing.before]! };
        }
        if (pairing.status === 'added') {
            return { status: 'added', index: pairing.after, value: after[pairing.after]! };
        }
        const index = { before: pairing.before, after: pairing.after };
        const beforeItem = before[pairing.before]!;
        const afterItem = after[pairing.after]!;
        if (pairing.status === 'moved') {
            return { status: 'moved', index, value: beforeItem };
        }
        if (isErrorJson(beforeItem) || isErrorJson(afterItem)) {
            return {
                status: 'changed',
                index,
                value: { status: 'changed', before: beforeItem, after: afterItem },
            };
        }
        return {
            status: 'changed',
            index,
            value: makeFieldSpecDiff(beforeItem, afterItem, sources),
        };
    });
};

export type SoslFieldsDiff = {
    find: ValueDiff<SoslJson['find']>;
    group: OptionalDiff<NonNullable<SoslJson['group']>, ValueDiff<NonNullable<SoslJson['group']>>>;
    fieldSpec: OptionalDiff<SoslJson['fieldSpec'], FieldSpecListDiff>;
    with: OptionalDiff<
        SoslJson['with'],
        | ValueListItemDiff<SoslWithJson | ErrorJson>[]
        | ValueDiff<(SoslWithJson | ErrorJson)[] | undefined>
    >;
    limit: OptionalDiff<SoslJson['limit'], LimitDiff>;
    update: OptionalDiff<SoslJson['update'], UpdateListDiff>;
};

export type SoslDiff = NodeDiff<'sosl', SoslJson, SoslFieldsDiff>;

export const makeSoslDiff = (
    before: SoslJson | ErrorJson,
    after: SoslJson | ErrorJson,
    sources?: Sources,
    match: Match = 'slot',
): SoslDiff =>
    makeNodeDiff('sosl', before, after, match, (b, a) => ({
        find: makeValueDiff(b.find, a.find),
        group: makeOptionalDiff(b.group, a.group, makeValueDiff),
        fieldSpec: makeOptionalDiff(b.fieldSpec, a.fieldSpec, (beforeSpecs, afterSpecs) =>
            makeFieldSpecListDiff(beforeSpecs, afterSpecs, sources),
        ),
        with: makeOptionalDiff(b.with, a.with, (beforeWith, afterWith) =>
            Array.isArray(beforeWith) && Array.isArray(afterWith)
                ? makeUnorderedValueListDiff(beforeWith, afterWith)
                : makeValueDiff(beforeWith, afterWith),
        ),
        limit: makeOptionalDiff(b.limit, a.limit, makeLimitDiff),
        update: makeOptionalDiff(b.update, a.update, makeUpdateListDiff),
    }));
