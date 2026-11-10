import {
    FieldOrderJson,
    FieldSpecJson,
    LimitJson,
    OffsetJson,
    SoslFieldJson,
    SoslJson,
    SoslWithJson,
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
} from '../../../commons/diff/commons';
import { FieldTermDiff, makeFieldTermDiff, makeUnorderedValueListDiff } from './commons';
import { TypedListDiff, TypedListItemDiff, makeTypedListDiff } from '../../../commons/diff/list';
import { FieldOrderJsonDiff, makeOrderFieldDiff } from './orderBy';
import { LimitJsonDiff, makeLimitDiff } from './limit';
import { OffsetJsonDiff, makeOffsetDiff } from './offset';
import { UpdateListJsonDiff, makeUpdateListDiff } from './updateList';
import { makeSoqlFunctionDiff } from './soqlFunction';

export type SoslFieldJsonDiff = NodeDiff<
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
    before: SoslFieldJson,
    after: SoslFieldJson,
    match: Match = 'slot',
): SoslFieldJsonDiff =>
    makeNodeDiff('soslField', before, after, match, (b, a) => {
        let field: FieldTermDiff | ValueDiff<SoslFieldJson['field']>;
        if (
            !Array.isArray(b.field) &&
            !Array.isArray(a.field) &&
            b.field.type === 'soqlFunction' &&
            a.field.type === 'soqlFunction'
        ) {
            field = makeFieldTermDiff(b.field, a.field);
        } else {
            field = makeValueDiff(b.field, a.field);
        }
        return {
            field,
            func: makeOptionalDiff(b.func, a.func, makeValueDiff),
        };
    });

export type SoslFieldListDiff = ListItemDiff<'soslField', SoslFieldJson, SoslFieldJsonDiff>[];

const makeSoslFieldListDiff = (
    before: SoslFieldJson[],
    after: SoslFieldJson[],
    sources?: Sources,
): SoslFieldListDiff => makeSetDiff('soslField', before, after, makeSoslFieldDiff, sources);

export type FieldSpecFieldsDiff = {
    object: TypedListItemDiff<string, never>[];
    field: OptionalDiff<FieldSpecJson['field'], SoslFieldListDiff>;
    where: OptionalDiff<FieldSpecJson['where'], ValueDiff<FieldSpecJson['where']>>;
    orderBy: OptionalDiff<
        FieldSpecJson['orderBy'],
        ListItemDiff<'orderField', FieldOrderJson, FieldOrderJsonDiff>[]
    >;
    listView: OptionalDiff<FieldSpecJson['listView'], TypedListItemDiff<string, never>[]>;
    limit: OptionalDiff<LimitJson, LimitJsonDiff>;
    offset: OptionalDiff<OffsetJson, OffsetJsonDiff>;
};

export type FieldSpecJsonDiff =
    | { status: 'unchanged'; value: FieldSpecJson }
    | { status: 'changed'; fields: FieldSpecFieldsDiff }
    | { status: 'changed'; before: FieldSpecJson; after: FieldSpecJson };

const makeFieldSpecDiff = (
    before: FieldSpecJson,
    after: FieldSpecJson,
    sources?: Sources,
): FieldSpecJsonDiff => {
    if (getValueKey(before) === getValueKey(after)) {
        return { status: 'unchanged', value: before };
    }
    return {
        status: 'changed',
        fields: {
            object: makeUnorderedValueListDiff(before.object, after.object),
            field: makeOptionalDiff(before.field, after.field, (b, a) =>
                makeSoslFieldListDiff(b, a, sources),
            ),
            where: makeOptionalDiff(before.where, after.where, makeValueDiff),
            orderBy: makeOptionalDiff(before.orderBy, after.orderBy, (b, a) =>
                makeSequenceDiff('orderField', b, a, makeOrderFieldDiff, { sources }),
            ),
            listView: makeOptionalDiff(before.listView, after.listView, makeUnorderedValueListDiff),
            limit: makeOptionalDiff(before.limit, after.limit, makeLimitDiff),
            offset: makeOptionalDiff(before.offset, after.offset, makeOffsetDiff),
        },
    };
};

export type FieldSpecListDiff = TypedListDiff<FieldSpecJson, FieldSpecJsonDiff>;

// RETURNING の順が結果の順になるので C. 順序付き列
const makeFieldSpecListDiff = (
    before: FieldSpecJson[],
    after: FieldSpecJson[],
    sources?: Sources,
): FieldSpecListDiff =>
    makeTypedListDiff(
        before,
        after,
        pairAsSequence(before.map(getValueKey), after.map(getValueKey)),
        (b, a) => makeFieldSpecDiff(b, a, sources),
    );

export type SoslFieldsDiff = {
    find: ValueDiff<SoslJson['find']>;
    group: OptionalDiff<NonNullable<SoslJson['group']>, ValueDiff<NonNullable<SoslJson['group']>>>;
    fieldSpec: OptionalDiff<SoslJson['fieldSpec'], FieldSpecListDiff>;
    with: OptionalDiff<SoslJson['with'], TypedListItemDiff<SoslWithJson, never>[]>;
    limit: OptionalDiff<SoslJson['limit'], LimitJsonDiff>;
    update: OptionalDiff<SoslJson['update'], UpdateListJsonDiff>;
};

export type SoslJsonDiff = NodeDiff<'sosl', SoslJson, SoslFieldsDiff>;

export const makeSoslDiff = (
    before: SoslJson,
    after: SoslJson,
    sources?: Sources,
    match: Match = 'slot',
): SoslJsonDiff =>
    makeNodeDiff('sosl', before, after, match, (b, a) => ({
        find: makeValueDiff(b.find, a.find),
        group: makeOptionalDiff(b.group, a.group, makeValueDiff),
        fieldSpec: makeOptionalDiff(b.fieldSpec, a.fieldSpec, (beforeSpecs, afterSpecs) =>
            makeFieldSpecListDiff(beforeSpecs, afterSpecs, sources),
        ),
        with: makeOptionalDiff(b.with, a.with, makeUnorderedValueListDiff),
        limit: makeOptionalDiff(b.limit, a.limit, makeLimitDiff),
        update: makeOptionalDiff(b.update, a.update, makeUpdateListDiff),
    }));

/** WITH は B. 集合なので、要素は unchanged / added / removed だけ */
export type SoslWithJsonDiff = TypedListItemDiff<SoslWithJson, never>;
