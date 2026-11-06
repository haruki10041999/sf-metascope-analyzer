import type {
    MutingPermissionSetParseResult,
    PermissionSetGroupParseResult,
    PermissionSetParseResult,
    ProfileParseResult,
} from '../../parser/Metadata/permission';
import type {
    ConvertKeys,
    MutingPermissionSetJson,
    JsonType,
    PermissionSetJson,
    ProfileJson,
} from '../../types';
import {
    MetadataContext,
    MetadataFinding,
    ReferenceProblem,
    makeReferenceChecker,
} from './references';

// 権限の解析。方針: docs/metadata-a-plan.md 3.3 章
// 権限の表 (誰が何をできるか)、権限セットグループの実際の権限 (含む権限セットの和 − ミュート)、参照先の確認、矛盾、強い権限。
// ファイルに書いてある行だけを扱い、書いていない権限を「なし」とは扱わない (SFDX の Profile は一部だけを持つことが多いため)

export type PermissionHolderType = 'permissionSet' | 'mutingPermissionSet' | 'profile';

export type ObjectAccess = {
    object: string;
    allowCreate: boolean;
    allowRead: boolean;
    allowEdit: boolean;
    allowDelete: boolean;
    viewAllRecords: boolean;
    modifyAllRecords: boolean;
    viewAllFields: boolean;
};

export type FieldAccess = { field: string; readable: boolean; editable: boolean };

/** 有効な (enabled / visible が true の) ものの名前の一覧 */
export type EnabledAccesses = {
    apexClasses: string[];
    apexPages: string[];
    flows: string[];
    customPermissions: string[];
    userPermissions: string[];
    recordTypes: string[];
    applications: string[];
};

/** 権限の表の 1 行 (権限セット・ミュート権限セット・Profile、または権限セットグループの実際の権限) */
export type PermissionTable = {
    objects: ObjectAccess[];
    fields: FieldAccess[];
} & EnabledAccesses;

export type PermissionHolderInfo = {
    type: PermissionHolderType;
    name: string;
    label?: string;
    filePath: string;
    sourceKeys: ConvertKeys;
} & PermissionTable;

export type PermissionGroupInfo = {
    name: string;
    label?: string;
    filePath: string;
    sourceKeys: ConvertKeys;
    permissionSets: string[];
    mutingPermissionSets: string[];
    /** 含む権限セットの和からミュート権限セットを除いたもの (リポジトリにある権限セットだけで計算する) */
    effective: PermissionTable;
};

export type PermissionAnalysisCode =
    | 'UNKNOWN_OBJECT'
    | 'UNKNOWN_FIELD'
    | 'UNKNOWN_APEX_CLASS'
    | 'UNKNOWN_FLOW'
    | 'UNKNOWN_LAYOUT'
    | 'UNKNOWN_FLEXIPAGE'
    | 'UNKNOWN_PERMISSION_SET'
    | 'UNKNOWN_MUTING_PERMISSION_SET'
    | 'FIELD_EDIT_WITHOUT_READ'
    | 'FIELD_WITHOUT_OBJECT_READ'
    | 'OBJECT_PERMISSION_DEPENDENCY'
    | 'POWERFUL_USER_PERMISSION';

export type PermissionFinding = MetadataFinding<PermissionAnalysisCode> & {
    /** 見つけた権限 (<種類>:<名前>) */
    holder: string;
};

export type PermissionAnalysis = {
    holders: PermissionHolderInfo[];
    groups: PermissionGroupInfo[];
    findings: PermissionFinding[];
};

export type PermissionInputs = {
    permissionSets?: PermissionSetParseResult[];
    mutingPermissionSets?: MutingPermissionSetParseResult[];
    profiles?: ProfileParseResult[];
    permissionSetGroups?: PermissionSetGroupParseResult[];
};

/** レビューで目立たせる userPermission (組織全体に効くもの・データをすべて見る / 変えるもの) */
export const POWERFUL_USER_PERMISSIONS = [
    'ModifyAllData',
    'ViewAllData',
    'ManageUsers',
    'AuthorApex',
    'CustomizeApplication',
    'ManageProfilesPermissionsets',
    'AssignPermissionSets',
    'ManageRoles',
    'ManageSharing',
    'ManageInternalUsers',
    'ResetPasswords',
    'ModifyMetadata',
    'ViewSetup',
    'ApiEnabled',
    'ManageDataIntegrations',
    'ViewAllUsers',
    'ExportReport',
] as const;

const OBJECT_FLAGS = [
    'allowCreate',
    'allowRead',
    'allowEdit',
    'allowDelete',
    'viewAllRecords',
    'modifyAllRecords',
    'viewAllFields',
] as const;

/**
 * オブジェクトの権限の依存 (Salesforce がデプロイで弾くもの)。[権限, 必要な権限]。
 * 作成・編集・参照すべては参照、削除は編集、すべて変更は削除とすべて参照が要る
 */
const OBJECT_DEPENDENCIES: [keyof ObjectAccess, keyof ObjectAccess][] = [
    ['allowCreate', 'allowRead'],
    ['allowEdit', 'allowRead'],
    ['allowDelete', 'allowEdit'],
    ['viewAllRecords', 'allowRead'],
    ['viewAllFields', 'allowRead'],
    ['modifyAllRecords', 'allowDelete'],
    ['modifyAllRecords', 'viewAllRecords'],
];

type Row = JsonType<string> & Record<string, unknown>;

const rowsOf = (json: object, element: string): Row[] =>
    ((json as Record<string, unknown>)[element] as Row[] | undefined) ?? [];

const sortUnique = (values: string[]) => [...new Set(values)].sort();

/** enabled (または visible) が true の行の名前 */
const enabledNames = (json: object, element: string, target: string, flag = 'enabled') =>
    sortUnique(
        rowsOf(json, element)
            .filter((row) => row[flag] === true)
            .map((row) => String(row[target] ?? '')),
    );

const toTable = (
    json: PermissionSetJson | MutingPermissionSetJson | ProfileJson,
): PermissionTable => ({
    objects: rowsOf(json, 'objectPermissions').map((row) => ({
        object: String(row.object ?? ''),
        ...(Object.fromEntries(OBJECT_FLAGS.map((flag) => [flag, row[flag] === true])) as Omit<
            ObjectAccess,
            'object'
        >),
    })),
    fields: rowsOf(json, 'fieldPermissions').map((row) => ({
        field: String(row.field ?? ''),
        readable: row.readable === true,
        editable: row.editable === true,
    })),
    apexClasses: enabledNames(json, 'classAccesses', 'apexClass'),
    apexPages: enabledNames(json, 'pageAccesses', 'apexPage'),
    flows: enabledNames(json, 'flowAccesses', 'flow'),
    customPermissions: enabledNames(json, 'customPermissions', 'name'),
    userPermissions: enabledNames(json, 'userPermissions', 'name'),
    recordTypes: enabledNames(json, 'recordTypeVisibilities', 'recordType', 'visible'),
    applications: enabledNames(json, 'applicationVisibilities', 'application', 'visible'),
});

const LIST_KEYS = [
    'apexClasses',
    'apexPages',
    'flows',
    'customPermissions',
    'userPermissions',
    'recordTypes',
    'applications',
] as const satisfies readonly (keyof EnabledAccesses)[];

/** 権限の和からミュートを除く (ミュート権限セットの true は「その権限を外す」) */
export const combinePermissions = (
    permissionSets: PermissionTable[],
    muting: PermissionTable[],
): PermissionTable => {
    const objects = new Map<string, ObjectAccess>();
    for (const table of permissionSets) {
        for (const access of table.objects) {
            const current = objects.get(access.object);
            objects.set(
                access.object,
                current
                    ? ({
                          object: access.object,
                          ...Object.fromEntries(
                              OBJECT_FLAGS.map((flag) => [flag, current[flag] || access[flag]]),
                          ),
                      } as ObjectAccess)
                    : { ...access },
            );
        }
    }
    for (const table of muting) {
        for (const access of table.objects) {
            const current = objects.get(access.object);
            if (!current) continue;
            OBJECT_FLAGS.forEach((flag) => {
                if (access[flag]) current[flag] = false;
            });
        }
    }

    const fields = new Map<string, FieldAccess>();
    for (const table of permissionSets) {
        for (const access of table.fields) {
            const current = fields.get(access.field);
            fields.set(access.field, {
                field: access.field,
                readable: (current?.readable ?? false) || access.readable,
                editable: (current?.editable ?? false) || access.editable,
            });
        }
    }
    for (const table of muting) {
        for (const access of table.fields) {
            const current = fields.get(access.field);
            if (!current) continue;
            if (access.readable) current.readable = false;
            if (access.editable) current.editable = false;
        }
    }

    const lists = Object.fromEntries(
        LIST_KEYS.map((key) => {
            const muted = new Set(muting.flatMap((table) => table[key]));
            return [
                key,
                sortUnique(permissionSets.flatMap((table) => table[key])).filter(
                    (name) => !muted.has(name),
                ),
            ];
        }),
    ) as EnabledAccesses;

    return {
        objects: [...objects.values()].sort((a, b) => a.object.localeCompare(b.object)),
        fields: [...fields.values()].sort((a, b) => a.field.localeCompare(b.field)),
        ...lists,
    };
};

/** 権限の解析。context (リポジトリの解析結果) を渡すと、参照先も確かめる */
export const analyzePermissions = (
    inputs: PermissionInputs,
    context: MetadataContext = {},
): PermissionAnalysis => {
    // 権限セットグループが含む権限セットは、渡した権限セット (と context) で確かめる
    const namesOf = (results: { result: { id: string } }[] | undefined, prefix: string) =>
        results?.map((r) => r.result.id.slice(prefix.length));
    const permissionSetNames =
        context.permissionSets ?? namesOf(inputs.permissionSets, 'permissionSet_');
    const mutingNames =
        context.mutingPermissionSets ??
        namesOf(inputs.mutingPermissionSets, 'mutingPermissionSet_');
    const check = makeReferenceChecker({
        ...context,
        ...(permissionSetNames ? { permissionSets: permissionSetNames } : {}),
        ...(mutingNames ? { mutingPermissionSets: mutingNames } : {}),
    });
    const findings: PermissionFinding[] = [];
    const holders: PermissionHolderInfo[] = [];

    const readable = <R extends { dataType: string }, D extends string>(
        results: R[] | undefined,
        dataType: D,
    ) => (results ?? []).filter((r): r is Extract<R, { dataType: D }> => r.dataType === dataType);

    const all = [
        ...readable(inputs.permissionSets, 'permissionSet'),
        ...readable(inputs.mutingPermissionSets, 'mutingPermissionSet'),
        ...readable(inputs.profiles, 'profile'),
    ];

    for (const result of all) {
        const json = result.result.base as
            PermissionSetJson | MutingPermissionSetJson | ProfileJson;
        const type = json.kind;
        const holder = `${type}:${json.name}`;
        const add = (
            code: PermissionAnalysisCode,
            severity: PermissionFinding['severity'],
            target: string,
            message: string,
            sourceKeys: ConvertKeys,
        ) =>
            findings.push({
                code,
                severity,
                holder,
                target,
                message,
                filePath: result.filePath,
                sourceKeys,
            });
        const addProblem = (problem: ReferenceProblem | undefined, sourceKeys: ConvertKeys) => {
            if (problem) {
                add(
                    problem.code as PermissionAnalysisCode,
                    'warning',
                    problem.target,
                    problem.message,
                    sourceKeys,
                );
            }
        };

        const table = toTable(json);
        holders.push({
            type,
            name: json.name,
            ...('label' in json && json.label ? { label: json.label } : {}),
            filePath: result.filePath,
            sourceKeys: json.sourceKeys,
            ...table,
        });

        // 参照先
        rowsOf(json, 'objectPermissions').forEach((row) =>
            addProblem(check.object(String(row.object)), row.sourceKeys),
        );
        rowsOf(json, 'fieldPermissions').forEach((row) =>
            addProblem(check.field(String(row.field)), row.sourceKeys),
        );
        rowsOf(json, 'classAccesses').forEach((row) =>
            addProblem(check.apexClass(String(row.apexClass)), row.sourceKeys),
        );
        rowsOf(json, 'flowAccesses').forEach((row) =>
            addProblem(check.flow(String(row.flow)), row.sourceKeys),
        );
        rowsOf(json, 'recordTypeVisibilities').forEach((row) =>
            addProblem(check.object(String(row.recordType).split('.')[0]!), row.sourceKeys),
        );
        rowsOf(json, 'loginFlows').forEach((row) => {
            if (row.flow) addProblem(check.flow(String(row.flow)), row.sourceKeys);
        });
        rowsOf(json, 'profileActionOverrides').forEach((row) => {
            if (String(row.type).toLowerCase() === 'flexipage' && row.content) {
                addProblem(check.flexiPage(String(row.content)), row.sourceKeys);
            }
        });
        rowsOf(json, 'layoutAssignments').forEach((row) => {
            addProblem(check.layout(String(row.layout)), row.sourceKeys);
            addProblem(check.object(String(row.layout).split('-')[0]!), row.sourceKeys);
        });

        // ミュート権限セットの true は「外す」なので、矛盾・強い権限は見ない
        if (type === 'mutingPermissionSet') continue;

        // 矛盾 (デプロイで弾かれるもの)
        const objectRows = new Map(
            rowsOf(json, 'objectPermissions').map((row) => [String(row.object), row]),
        );
        objectRows.forEach((row, object) => {
            OBJECT_DEPENDENCIES.forEach(([flag, required]) => {
                if (row[flag] === true && row[required] !== true) {
                    add(
                        'OBJECT_PERMISSION_DEPENDENCY',
                        'error',
                        object,
                        `${object} の ${flag} には ${required} が要る`,
                        row.sourceKeys,
                    );
                }
            });
        });
        rowsOf(json, 'fieldPermissions').forEach((row) => {
            const field = String(row.field);
            if (row.editable === true && row.readable !== true) {
                add(
                    'FIELD_EDIT_WITHOUT_READ',
                    'error',
                    field,
                    `${field} は編集できるが参照できない`,
                    row.sourceKeys,
                );
            }
            const objectRow = objectRows.get(field.split('.')[0]!);
            if (row.readable === true && objectRow && objectRow.allowRead !== true) {
                add(
                    'FIELD_WITHOUT_OBJECT_READ',
                    'warning',
                    field,
                    `${field} を参照できるが、オブジェクトを参照できない`,
                    row.sourceKeys,
                );
            }
        });

        // 強い権限
        rowsOf(json, 'userPermissions')
            .filter(
                (row) =>
                    row.enabled === true &&
                    (POWERFUL_USER_PERMISSIONS as readonly string[]).includes(String(row.name)),
            )
            .forEach((row) =>
                add(
                    'POWERFUL_USER_PERMISSION',
                    'info',
                    String(row.name),
                    `強い権限 ${String(row.name)} を与える`,
                    row.sourceKeys,
                ),
            );
    }

    // 権限セットグループ
    const tables = (type: PermissionHolderType) =>
        new Map(holders.filter((h) => h.type === type).map((h) => [h.name.toLowerCase(), h]));
    const permissionSets = tables('permissionSet');
    const mutingSets = tables('mutingPermissionSet');
    const groups: PermissionGroupInfo[] = readable(
        inputs.permissionSetGroups,
        'permissionSetGroup',
    ).map((result) => {
        const json = result.result.base;
        const holder = `permissionSetGroup:${json.name}`;
        const included = json.permissionSets ?? [];
        const muting = json.mutingPermissionSets ?? [];
        const problems = [
            ...included.map((name) => check.permissionSet(name)),
            ...muting.map((name) => check.mutingPermissionSet(name)),
        ];
        problems.forEach((problem) => {
            if (problem) {
                findings.push({
                    code: problem.code as PermissionAnalysisCode,
                    severity: 'warning',
                    holder,
                    target: problem.target,
                    message: problem.message,
                    filePath: result.filePath,
                    sourceKeys: json.sourceKeys,
                });
            }
        });
        const pick = (map: Map<string, PermissionHolderInfo>, names: string[]) =>
            names.flatMap((name) => {
                const info = map.get(name.toLowerCase());
                return info ? [info] : [];
            });
        return {
            name: json.name,
            ...(json.label ? { label: json.label } : {}),
            filePath: result.filePath,
            sourceKeys: json.sourceKeys,
            permissionSets: included,
            mutingPermissionSets: muting,
            effective: combinePermissions(pick(permissionSets, included), pick(mutingSets, muting)),
        };
    });

    return { holders, groups, findings };
};
