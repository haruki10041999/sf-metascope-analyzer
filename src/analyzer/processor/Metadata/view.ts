import {
    FieldValueType,
    ObjectDependency,
    ObjectFieldInfo,
    ObjectInfo,
    RelationType,
    getDependencyKey,
} from './analysis';
import { ObjectUnitDiff } from './diff/unit';

// viewer / MCP のレポートに渡す、表示用のデータ。解析 (analysis) と差分 (diff) を組み合わせる。
// status は差分を表示するときだけ持つ (Diff と同じ語彙)。

export type ViewStatus = 'added' | 'removed' | 'changed' | 'unchanged';

export type FieldView = {
    apiName: string;
    origin: ObjectFieldInfo['origin'];
    valueType: FieldValueType;
    fieldType?: string;
    label?: string;
    referenceTo?: string;
    relationType?: RelationType;
    status?: ViewStatus;
};

export type ObjectView = {
    apiName: string;
    objectType: ObjectInfo['objectType'];
    label?: string;
    fields: FieldView[];
    status?: ViewStatus;
};

export type DependencyView = ObjectDependency & { status?: ViewStatus };

const toFieldView = (field: ObjectFieldInfo, status?: ViewStatus): FieldView => ({
    apiName: field.apiName,
    origin: field.origin,
    valueType: field.valueType,
    ...(field.fieldType !== undefined ? { fieldType: field.fieldType } : {}),
    ...(field.label !== undefined ? { label: field.label } : {}),
    ...(field.reference
        ? {
              referenceTo: field.reference.objectApiName,
              relationType: field.reference.relationType,
          }
        : {}),
    ...(status ? { status } : {}),
});

const toObjectView = (
    object: ObjectInfo,
    fields: FieldView[],
    status?: ViewStatus,
): ObjectView => ({
    apiName: object.apiName,
    objectType: object.objectType,
    ...(object.label !== undefined ? { label: object.label } : {}),
    fields,
    ...(status ? { status } : {}),
});

/** 1 つの時点のオブジェクト (差分なし) */
export const makeObjectViews = (objects: ObjectInfo[]): ObjectView[] =>
    objects.map((object) =>
        toObjectView(
            object,
            object.fields.map((field) => toFieldView(field)),
        ),
    );

/** 項目の状態。objectKey が同じなら unchanged (Diff の判定と同じ)。暗黙の標準項目はどちらにもあれば unchanged */
const getFieldStatus = (before: ObjectFieldInfo, after: ObjectFieldInfo): ViewStatus =>
    before.sourceKeys?.objectKey === after.sourceKeys?.objectKey ? 'unchanged' : 'changed';

/**
 * 差分を表示するためのオブジェクト。オブジェクトの状態は unitDiffs (ファイルの読み込みエラーの変化も含む) から、
 * 項目の状態は API 名で対応付けて決める。削除されたものも含め、API 名の順に並べる
 */
export const makeObjectDiffViews = (
    before: ObjectInfo[],
    after: ObjectInfo[],
    unitDiffs: ObjectUnitDiff[],
): ObjectView[] => {
    const statusById = new Map(unitDiffs.map((diff) => [diff.id, diff.status]));
    const beforeByName = new Map(before.map((object) => [object.apiName, object]));
    const afterByName = new Map(after.map((object) => [object.apiName, object]));
    const names = [...new Set([...beforeByName.keys(), ...afterByName.keys()])].sort((a, b) =>
        a.localeCompare(b),
    );

    return names.map((name) => {
        const b = beforeByName.get(name);
        const a = afterByName.get(name);
        if (!a || !b) {
            const object = (a ?? b)!;
            const status: ViewStatus = a ? 'added' : 'removed';
            return toObjectView(
                object,
                object.fields.map((field) => toFieldView(field, status)),
                status,
            );
        }

        const beforeFields = new Map(b.fields.map((field) => [field.apiName, field]));
        const afterNames = new Set(a.fields.map((field) => field.apiName));
        const fields = [
            ...a.fields.map((field) => {
                const old = beforeFields.get(field.apiName);
                return toFieldView(field, old ? getFieldStatus(old, field) : 'added');
            }),
            ...b.fields
                .filter((field) => !afterNames.has(field.apiName))
                .map((field) => toFieldView(field, 'removed')),
        ];
        return toObjectView(a, fields, statusById.get(name) ?? 'unchanged');
    });
};

/** 1 つの時点の参照関係 (差分なし) */
export const makeDependencyViews = (dependencies: ObjectDependency[]): DependencyView[] =>
    dependencies.map((dependency) => ({ ...dependency }));

/** 参照関係の差分。参照元の項目と参照先で対応付け、種類 (Lookup / MasterDetail) が変われば changed */
export const makeDependencyDiffViews = (
    before: ObjectDependency[],
    after: ObjectDependency[],
): DependencyView[] => {
    const beforeByKey = new Map(
        before.map((dependency) => [getDependencyKey(dependency), dependency]),
    );
    const afterKeys = new Set(after.map(getDependencyKey));
    return [
        ...after.map((dependency): DependencyView => {
            const old = beforeByKey.get(getDependencyKey(dependency));
            const status: ViewStatus = !old
                ? 'added'
                : old.type === dependency.type
                  ? 'unchanged'
                  : 'changed';
            return { ...dependency, status };
        }),
        ...before
            .filter((dependency) => !afterKeys.has(getDependencyKey(dependency)))
            .map((dependency): DependencyView => ({ ...dependency, status: 'removed' })),
    ];
};
