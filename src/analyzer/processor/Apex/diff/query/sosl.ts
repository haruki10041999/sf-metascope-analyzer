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
    ReplacementDiff,
    Sources,
    ValueDiff,
    getValueKey,
    makeNodeDiff,
    makeOptionalDiff,
    makeReplacementDiff,
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
    before: SoslFieldJson | ErrorJson,
    after: SoslFieldJson | ErrorJson,
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

export type SoslFieldListDiff = ListItemDiff<
    'soslField',
    SoslFieldJson | ErrorJson,
    SoslFieldJsonDiff
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
    object: TypedListItemDiff<string | ErrorJson, never>[] | ValueDiff<FieldSpecJson['object']>;
    field: OptionalDiff<
        FieldSpecJson['field'],
        SoslFieldListDiff | ValueDiff<FieldSpecJson['field']>
    >;
    where: OptionalDiff<FieldSpecJson['where'], ValueDiff<FieldSpecJson['where']>>;
    orderBy: OptionalDiff<
        FieldSpecJson['orderBy'],
        | ListItemDiff<'orderField', FieldOrderJson | ErrorJson, FieldOrderJsonDiff>[]
        | ValueDiff<(FieldOrderJson | ErrorJson)[] | ErrorJson>
    >;
    listView: OptionalDiff<
        FieldSpecJson['listView'],
        TypedListItemDiff<string | ErrorJson, never>[] | ValueDiff<FieldSpecJson['listView']>
    >;
    limit: OptionalDiff<LimitJson | ErrorJson, LimitJsonDiff>;
    offset: OptionalDiff<OffsetJson | ErrorJson, OffsetJsonDiff>;
};

export type FieldSpecJsonDiff =
    | { status: 'unchanged'; value: FieldSpecJson }
    | { status: 'changed'; fields: FieldSpecFieldsDiff }
    | { status: 'changed'; before: FieldSpecJson | ErrorJson; after: FieldSpecJson | ErrorJson };

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

export type FieldSpecListDiff =
    | TypedListDiff<
          FieldSpecJson | ErrorJson,
          FieldSpecJsonDiff | ReplacementDiff<FieldSpecJson | ErrorJson>
      >
    | ValueDiff<(FieldSpecJson | ErrorJson)[] | ErrorJson | undefined>;

const makeFieldSpecListDiff = (
    before: (FieldSpecJson | ErrorJson)[] | ErrorJson | undefined,
    after: (FieldSpecJson | ErrorJson)[] | ErrorJson | undefined,
    sources?: Sources,
): FieldSpecListDiff => {
    if (!Array.isArray(before) || !Array.isArray(after)) {
        return makeValueDiff(before, after);
    }

    // RETURNING の順が結果の順になるので C. 順序付き列
    return makeTypedListDiff(
        before,
        after,
        pairAsSequence(before.map(getValueKey), after.map(getValueKey)),
        (b, a) =>
            isErrorJson(b) || isErrorJson(a)
                ? makeReplacementDiff<FieldSpecJson | ErrorJson>(b, a)
                : makeFieldSpecDiff(b, a, sources),
    );
};

export type SoslFieldsDiff = {
    find: ValueDiff<SoslJson['find']>;
    group: OptionalDiff<NonNullable<SoslJson['group']>, ValueDiff<NonNullable<SoslJson['group']>>>;
    fieldSpec: OptionalDiff<SoslJson['fieldSpec'], FieldSpecListDiff>;
    with: OptionalDiff<
        SoslJson['with'],
        | TypedListItemDiff<SoslWithJson | ErrorJson, never>[]
        | ValueDiff<(SoslWithJson | ErrorJson)[] | undefined>
    >;
    limit: OptionalDiff<SoslJson['limit'], LimitJsonDiff>;
    update: OptionalDiff<SoslJson['update'], UpdateListJsonDiff>;
};

export type SoslJsonDiff = NodeDiff<'sosl', SoslJson, SoslFieldsDiff>;

export const makeSoslDiff = (
    before: SoslJson | ErrorJson,
    after: SoslJson | ErrorJson,
    sources?: Sources,
    match: Match = 'slot',
): SoslJsonDiff =>
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

/** WITH は B. 集合なので、要素は unchanged / added / removed だけ */
export type SoslWithJsonDiff = TypedListItemDiff<SoslWithJson | ErrorJson, never>;
