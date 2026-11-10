import {
    LOGIN_HOURS_SCHEMA,
    LoginHoursJson,
    MUTING_PERMISSION_SET_SCHEMA,
    MutingPermissionSetJson,
    PERMISSION_SET_GROUP_SCHEMA,
    PERMISSION_SET_ROWS,
    PERMISSION_SET_SCHEMA,
    PROFILE_ROWS,
    PROFILE_SCHEMA,
    PermissionRowJson,
    PermissionRowSpec,
    PermissionSetGroupJson,
    PermissionSetJson,
    ProfileJson,
    PropertySchema,
    permissionRowKey,
} from '../../../types';

import {
    ListItemDiff,
    Match,
    NodeDiff,
    Sources,
    ValueDiff,
    makeKeyedDiff,
    makeNodeDiff,
    makeValueDiff,
} from '../../commons/diff/commons';
import { TypedListDiff } from '../../commons/diff/list';
import {
    PresentDiff,
    PropertiesDiff,
    makePresentDiff,
    makePropertiesDiff,
    makeUnorderedValuesDiff,
    presentEntry,
} from '../../commons/diff/present';

// 権限の差分。方針: docs/metadata-implementation.md 10 章
// ルートの値は makePropertiesDiff、行は要素名ごとにキー (行の表の key) で D。行の値は makePropertiesDiff。
// 繰り返す値 (lists) とスキーマにない要素の名前 (skippedElements) は B. 集合

/** 繰り返す値 (categoryGroupVisibilities の dataCategories など) の差分 */
type ListsDiff<S extends PermissionRowSpec> = {
    [L in NonNullable<S['lists']>[number]]?: PresentDiff<string[], TypedListDiff<string, never>>;
};

/** 権限の 1 行の差分 */
export type PermissionRowJsonDiff<S extends PermissionRowSpec = PermissionRowSpec> = NodeDiff<
    S['kind'],
    PermissionRowJson<S>,
    PropertiesDiff<S['schema']> & ListsDiff<S>
>;

/** 要素名ごとの行の差分。片方のファイルにしかない要素は、行の並びごと added / removed */
export type PermissionRowsDiff<R extends Record<string, PermissionRowSpec>> = {
    [E in keyof R]?: PresentDiff<
        PermissionRowJson<R[E]>[],
        ListItemDiff<R[E]['kind'], PermissionRowJson<R[E]>, PermissionRowJsonDiff<R[E]>>[]
    >;
};

const makeRowDiff =
    (spec: PermissionRowSpec) =>
    (before: PermissionRowJson, after: PermissionRowJson, match: Match): PermissionRowJsonDiff =>
        makeNodeDiff(spec.kind, before, after, match, (b, a) => ({
            ...makePropertiesDiff(spec.schema, b, a),
            ...Object.fromEntries(
                (spec.lists ?? []).flatMap((list) => {
                    const diff = makePresentDiff(
                        (b as Record<string, string[] | undefined>)[list],
                        (a as Record<string, string[] | undefined>)[list],
                        makeUnorderedValuesDiff,
                    );
                    return diff === undefined ? [] : [[list, diff]];
                }),
            ),
        })) as PermissionRowJsonDiff;

/** 行の表にある要素ごとの差分。両方のファイルにない要素は持たない */
export const makePermissionRowsDiff = <R extends Record<string, PermissionRowSpec>>(
    rows: R,
    before: object,
    after: object,
    sources?: Sources,
): PermissionRowsDiff<R> =>
    Object.fromEntries(
        Object.entries(rows).flatMap(([name, spec]) => {
            const diff = makePresentDiff(
                (before as Record<string, PermissionRowJson[] | undefined>)[name],
                (after as Record<string, PermissionRowJson[] | undefined>)[name],
                (b, a) =>
                    makeKeyedDiff(
                        spec.kind,
                        b,
                        a,
                        makeRowDiff(spec),
                        (row) => permissionRowKey(spec, row),
                        sources,
                    ),
            );
            return diff === undefined ? [] : [[name, diff]];
        }),
    ) as PermissionRowsDiff<R>;

type SkippedDiff = {
    skippedElements?: PresentDiff<string[], TypedListDiff<string, never>>;
};

const skippedEntry = (
    before: { skippedElements?: string[] },
    after: { skippedElements?: string[] },
) =>
    presentEntry(
        'skippedElements',
        makePresentDiff(before.skippedElements, after.skippedElements, makeUnorderedValuesDiff),
    );

type PermissionsFields<S extends PropertySchema, R extends Record<string, PermissionRowSpec>> = {
    name: ValueDiff<string>;
} & PropertiesDiff<S> &
    PermissionRowsDiff<R> &
    SkippedDiff;

export type PermissionSetJsonDiff = NodeDiff<
    'permissionSet',
    PermissionSetJson,
    PermissionsFields<typeof PERMISSION_SET_SCHEMA, typeof PERMISSION_SET_ROWS>
>;

export type MutingPermissionSetJsonDiff = NodeDiff<
    'mutingPermissionSet',
    MutingPermissionSetJson,
    PermissionsFields<typeof MUTING_PERMISSION_SET_SCHEMA, typeof PERMISSION_SET_ROWS>
>;

export type LoginHoursJsonDiff = NodeDiff<
    'loginHours',
    LoginHoursJson,
    PropertiesDiff<typeof LOGIN_HOURS_SCHEMA>
>;

export type ProfileJsonDiff = NodeDiff<
    'profile',
    ProfileJson,
    PermissionsFields<typeof PROFILE_SCHEMA, typeof PROFILE_ROWS> & {
        loginHours?: PresentDiff<LoginHoursJson, LoginHoursJsonDiff>;
    }
>;

export const makePermissionSetDiff = (
    before: PermissionSetJson,
    after: PermissionSetJson,
    match: Match = 'key',
    sources?: Sources,
): PermissionSetJsonDiff =>
    makeNodeDiff('permissionSet', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        ...makePropertiesDiff(PERMISSION_SET_SCHEMA, b, a),
        ...makePermissionRowsDiff(PERMISSION_SET_ROWS, b, a, sources),
        ...skippedEntry(b, a),
    }));

export const makeMutingPermissionSetDiff = (
    before: MutingPermissionSetJson,
    after: MutingPermissionSetJson,
    match: Match = 'key',
    sources?: Sources,
): MutingPermissionSetJsonDiff =>
    makeNodeDiff('mutingPermissionSet', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        ...makePropertiesDiff(MUTING_PERMISSION_SET_SCHEMA, b, a),
        ...makePermissionRowsDiff(PERMISSION_SET_ROWS, b, a, sources),
        ...skippedEntry(b, a),
    }));

export const makeProfileDiff = (
    before: ProfileJson,
    after: ProfileJson,
    match: Match = 'key',
    sources?: Sources,
): ProfileJsonDiff =>
    makeNodeDiff('profile', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        ...makePropertiesDiff(PROFILE_SCHEMA, b, a),
        ...makePermissionRowsDiff(PROFILE_ROWS, b, a, sources),
        ...presentEntry(
            'loginHours',
            makePresentDiff(b.loginHours, a.loginHours, (bh, ah) =>
                makeNodeDiff('loginHours', bh, ah, 'slot', (x, y) =>
                    makePropertiesDiff(LOGIN_HOURS_SCHEMA, x, y),
                ),
            ),
        ),
        ...skippedEntry(b, a),
    }));

export type PermissionSetGroupJsonDiff = NodeDiff<
    'permissionSetGroup',
    PermissionSetGroupJson,
    {
        name: ValueDiff<string>;
        permissionSets?: PresentDiff<string[], TypedListDiff<string, never>>;
        mutingPermissionSets?: PresentDiff<string[], TypedListDiff<string, never>>;
    } & PropertiesDiff<typeof PERMISSION_SET_GROUP_SCHEMA> &
        SkippedDiff
>;

export const makePermissionSetGroupDiff = (
    before: PermissionSetGroupJson,
    after: PermissionSetGroupJson,
    match: Match = 'key',
): PermissionSetGroupJsonDiff =>
    makeNodeDiff('permissionSetGroup', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        ...makePropertiesDiff(PERMISSION_SET_GROUP_SCHEMA, b, a),
        ...presentEntry(
            'permissionSets',
            makePresentDiff(b.permissionSets, a.permissionSets, makeUnorderedValuesDiff),
        ),
        ...presentEntry(
            'mutingPermissionSets',
            makePresentDiff(
                b.mutingPermissionSets,
                a.mutingPermissionSets,
                makeUnorderedValuesDiff,
            ),
        ),
        ...skippedEntry(b, a),
    }));
