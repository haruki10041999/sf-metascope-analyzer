import {
    analyzePermissions,
    type FieldAccess,
    type ObjectAccess,
    type PermissionAnalysis,
    type PermissionTable,
} from '../processor/Metadata/permissionAnalysis';
import {
    PERMISSION_SET_ROWS,
    PERMISSION_SET_SCHEMA,
    PERMISSION_SET_GROUP_SCHEMA,
    PROFILE_ROWS,
    PROFILE_SCHEMA,
    MUTING_PERMISSION_SET_SCHEMA,
    permissionRowKey,
    type JsonType,
    type PermissionRowSpec,
} from '../types';
import { changedProps, compareKeyed, contextOf, readable, rowBase } from './commons';
import type {
    AccessFlags,
    ApexAccessRow,
    EffectivePermissionRow,
    Matrix,
    MetadataSnapshot,
    PermissionDiffRow,
    PermissionHolderRef,
    ReportInput,
} from './types';

// 権限の provider (permission.*)。方針: docs/report-components-plan.md 2.5 章、docs/metadata-a-plan.md 3・4 章

type HolderType = PermissionHolderRef['type'];

/** 種類ごとの解析結果・行の表・ルートの値のスキーマ */
const HOLDERS: {
    type: HolderType;
    results: (
        snapshot: MetadataSnapshot,
    ) =>
        { dataType: string; filePath: string; result: { id: string; base: unknown } }[] | undefined;
    rows: Record<string, PermissionRowSpec>;
    schema: Record<string, unknown>;
}[] = [
    {
        type: 'permissionSet',
        results: (s) => s.permissionSets,
        rows: PERMISSION_SET_ROWS,
        schema: PERMISSION_SET_SCHEMA,
    },
    {
        type: 'mutingPermissionSet',
        results: (s) => s.mutingPermissionSets,
        rows: PERMISSION_SET_ROWS,
        schema: MUTING_PERMISSION_SET_SCHEMA,
    },
    {
        type: 'profile',
        results: (s) => s.profiles,
        rows: PROFILE_ROWS,
        schema: { ...PROFILE_SCHEMA, loginHours: 'object' },
    },
    {
        type: 'permissionSetGroup',
        results: (s) => s.permissionSetGroups,
        rows: {},
        schema: {
            ...PERMISSION_SET_GROUP_SCHEMA,
            permissionSets: 'list',
            mutingPermissionSets: 'list',
        },
    },
];

type Holder = { id: string; filePath: string; json: JsonType<string> & Record<string, unknown> };

/**
 * permission.diffs: 権限セット・ミュート権限セット・Profile・権限セットグループの変更。
 * 権限の行はキー (行の表) で対応付け、変わった値を changes に持つ。before を渡さなければ、すべての行を status なしで返す
 */
export const getPermissionDiffs = (input: ReportInput): PermissionDiffRow[] => {
    const hasBefore = input.before !== undefined;
    return HOLDERS.flatMap(({ type, results, rows, schema }) => {
        const holders = compareKeyed<Holder>(
            input.before ? readable(results(input.before), type) : undefined,
            readable(results(input.after), type),
            (holder) => holder.id,
            hasBefore,
        );
        return holders.flatMap((compared): PermissionDiffRow[] => {
            const node = (compared.after ?? compared.before)!;
            const holder: PermissionHolderRef = { type, name: String(node.json.name) };
            // 単位ごと追加・削除・変化なし
            if (compared.status && compared.status !== 'changed') {
                return compared.status === 'unchanged'
                    ? []
                    : [
                          {
                              ...rowBase(compared, node.json, node.filePath),
                              holder,
                              category: 'unit',
                              target: '',
                              changes: [],
                          },
                      ];
            }
            const settings = changedProps(
                Object.fromEntries(Object.keys(schema).map((k) => [k, compared.before?.json[k]])),
                Object.fromEntries(Object.keys(schema).map((k) => [k, compared.after?.json[k]])),
            );
            const settingRows: PermissionDiffRow[] =
                settings.length || !hasBefore
                    ? [
                          {
                              ...rowBase(compared, node.json, node.filePath),
                              holder,
                              category: 'settings',
                              target: '',
                              changes: settings,
                          },
                      ]
                    : [];
            const rowDiffs = Object.entries(rows).flatMap(([element, spec]) =>
                compareKeyed(
                    compared.before?.json[element] as (JsonType<string> & object)[] | undefined,
                    compared.after?.json[element] as (JsonType<string> & object)[] | undefined,
                    (row) => permissionRowKey(spec, row),
                    hasBefore,
                )
                    .filter((row) => row.status !== 'unchanged')
                    .map((row): PermissionDiffRow => ({
                        ...rowBase(row, row.after ?? row.before, node.filePath),
                        holder,
                        category: element,
                        target: row.key,
                        changes: changedProps(row.before, row.after),
                    })),
            );
            return [...settingRows, ...rowDiffs];
        });
    });
};

const holdersOf = (analysis: PermissionAnalysis) =>
    analysis.holders.map((h) => ({
        ref: { type: h.type, name: h.name } as PermissionHolderRef,
        info: h,
    }));

const analyze = (snapshot: MetadataSnapshot | undefined) =>
    snapshot
        ? analyzePermissions(
              {
                  ...(snapshot.permissionSets ? { permissionSets: snapshot.permissionSets } : {}),
                  ...(snapshot.mutingPermissionSets
                      ? { mutingPermissionSets: snapshot.mutingPermissionSets }
                      : {}),
                  ...(snapshot.profiles ? { profiles: snapshot.profiles } : {}),
                  ...(snapshot.permissionSetGroups
                      ? { permissionSetGroups: snapshot.permissionSetGroups }
                      : {}),
              },
              contextOf(snapshot),
          )
        : undefined;

const refKey = (ref: PermissionHolderRef) => `${ref.type}:${ref.name}`;

/** Matrix の組み立て。onlyChanged なら、変わったセルのある行だけにする */
const makeMatrix = <V>(
    input: ReportInput,
    cellsOf: (
        holder: PermissionAnalysis['holders'][number],
    ) => { row: string; value: V; sourceKeys?: never }[],
    options: { onlyChanged?: boolean; rows?: string[] } = {},
): Matrix<V> => {
    const before = analyze(input.before);
    const after = analyze(input.after)!;
    const hasBefore = before !== undefined;
    const columns = new Map<string, PermissionHolderRef>();
    const cells: Matrix<V>['cells'] = {};
    const put = (side: 'before' | 'after', analysis: PermissionAnalysis) =>
        holdersOf(analysis)
            .filter(({ info }) => info.type !== 'mutingPermissionSet')
            .forEach(({ ref, info }) => {
                columns.set(refKey(ref), ref);
                cellsOf(info).forEach(({ row, value }) => {
                    if (options.rows && !options.rows.includes(row)) return;
                    const cell = ((cells[row] ??= {})[refKey(ref)] ??= { filePath: info.filePath });
                    cell[side] = value;
                });
            });
    if (before) put('before', before);
    put('after', after);
    // status
    Object.values(cells).forEach((row) =>
        Object.values(row).forEach((cell) => {
            if (!hasBefore) return;
            cell.status =
                cell.before === undefined
                    ? 'added'
                    : cell.after === undefined
                      ? 'removed'
                      : JSON.stringify(cell.before) === JSON.stringify(cell.after)
                        ? 'unchanged'
                        : 'changed';
        }),
    );
    const rows = Object.keys(cells)
        .filter(
            (row) =>
                !options.onlyChanged ||
                Object.values(cells[row]!).some((c) => c.status && c.status !== 'unchanged'),
        )
        .sort();
    return {
        columns: [...columns.values()].sort((a, b) => refKey(a).localeCompare(refKey(b))),
        rows,
        cells: Object.fromEntries(rows.map((row) => [row, cells[row]!])),
    };
};

const flagsOf = ({ object: _object, ...flags }: ObjectAccess): AccessFlags => flags;

export type MatrixOptions = {
    /** 変わったセルのある行だけにする (before を渡したとき) */
    onlyChanged?: boolean;
    /** この行 (オブジェクト・項目) だけにする */
    rows?: string[];
};

/** permission.objectAccess: 権限セット・Profile × オブジェクトの CRUD (ミュート権限セットは列にしない) */
export const getObjectAccessMatrix = (
    input: ReportInput,
    options: MatrixOptions = {},
): Matrix<AccessFlags> =>
    makeMatrix(
        input,
        (holder) => holder.objects.map((o) => ({ row: o.object, value: flagsOf(o) })) as never,
        options,
    );

/** permission.fieldAccess: 権限セット・Profile × 項目の参照・編集 */
export const getFieldAccessMatrix = (
    input: ReportInput,
    options: MatrixOptions = {},
): Matrix<Omit<FieldAccess, 'field'>> =>
    makeMatrix(
        input,
        (holder) =>
            holder.fields.map((f) => ({
                row: f.field,
                value: { readable: f.readable, editable: f.editable },
            })) as never,
        options,
    );

/** permission.apexAccess: Apex クラス・Visualforce ページの実行権限 */
export const getApexAccess = (input: ReportInput): ApexAccessRow[] => {
    const rowsOf = (analysis: PermissionAnalysis | undefined) =>
        (analysis?.holders ?? [])
            .filter((h) => h.type !== 'mutingPermissionSet')
            .flatMap((h) => [
                ...h.apexClasses.map((name) => ({ h, accessType: 'apexClass' as const, name })),
                ...h.apexPages.map((name) => ({ h, accessType: 'apexPage' as const, name })),
            ]);
    const before = analyze(input.before);
    return compareKeyed(
        before ? rowsOf(before) : undefined,
        rowsOf(analyze(input.after)),
        (r) => `${r.h.type}:${r.h.name}:${r.accessType}:${r.name}`,
        before !== undefined,
        () => true,
    ).map((compared) => {
        const r = (compared.after ?? compared.before)!;
        return {
            ...rowBase(compared, undefined, r.h.filePath),
            holder: { type: r.h.type, name: r.h.name },
            accessType: r.accessType,
            name: r.name,
            enabled: compared.after !== undefined,
        };
    });
};

const crud = (o: ObjectAccess) =>
    `${o.allowCreate ? 'C' : '-'}${o.allowRead ? 'R' : '-'}${o.allowEdit ? 'E' : '-'}${o.allowDelete ? 'D' : '-'}${o.viewAllRecords ? ' VA' : ''}${o.modifyAllRecords ? ' MA' : ''}`;

const effectiveEntries = (table: PermissionTable): [string, string, string | boolean][] => [
    ...table.objects.map((o): [string, string, string] => ['object', o.object, crud(o)]),
    ...table.fields.map((f): [string, string, string] => [
        'field',
        f.field,
        `${f.readable ? 'R' : '-'}${f.editable ? 'E' : '-'}`,
    ]),
    ...table.apexClasses.map((n): [string, string, boolean] => ['apexClass', n, true]),
    ...table.apexPages.map((n): [string, string, boolean] => ['apexPage', n, true]),
    ...table.flows.map((n): [string, string, boolean] => ['flow', n, true]),
    ...table.customPermissions.map((n): [string, string, boolean] => ['customPermission', n, true]),
    ...table.userPermissions.map((n): [string, string, boolean] => ['userPermission', n, true]),
];

/** permission.effective: 権限セットグループ (ミュートを含む) を合わせた、実際に与える権限 */
export const getEffectivePermissions = (input: ReportInput): EffectivePermissionRow[] => {
    const before = analyze(input.before);
    const after = analyze(input.after)!;
    const entriesOf = (analysis: PermissionAnalysis | undefined) =>
        (analysis?.groups ?? []).flatMap((g) =>
            effectiveEntries(g.effective).map(([category, target, value]) => ({
                g,
                category,
                target,
                value,
            })),
        );
    return compareKeyed(
        before ? entriesOf(before) : undefined,
        entriesOf(after),
        (e) => `${e.g.name}:${e.category}:${e.target}`,
        before !== undefined,
        (b, a) => b.value === a.value,
    ).map((compared) => {
        const e = (compared.after ?? compared.before)!;
        return {
            ...rowBase(compared, undefined, e.g.filePath),
            group: e.g.name,
            category: e.category as EffectivePermissionRow['category'],
            target: e.target,
            ...(compared.before ? { before: compared.before.value } : {}),
            ...(compared.after ? { after: compared.after.value } : {}),
        };
    });
};

export { analyze as analyzePermissionSnapshot };
