import { getImplicitFields } from '../processor/Metadata/analysis';
import { isSameValue } from '../processor/commons/diff/commons';
import {
    type CustomFieldJson,
    type CustomObjectJson,
    type FormulaValue,
    type PicklistValueJson,
    type RecordTypeJson,
    type ValidationRuleJson,
    formulaTextOf,
} from '../types';
import { type Compared, changedProps, compareKeyed, readable, rowBase } from './commons';
import type {
    ObjectDiagram,
    ObjectFieldRow,
    ObjectListRow,
    ObjectPicklistRow,
    ObjectRecordTypePicklistRow,
    ObjectValidationRuleRow,
    MetadataSnapshot,
    SnapshotInput,
} from './types';

// オブジェクトの provider (object.*)。方針: docs/report-components-plan.md 2.2 章。
// 第一の目的はドキュメントとコードの理解なので、既定は今の状態のすべてを返す (status なし)。
// 比べる時点があれば (diff / compare)、行に status と、変わったプロパティの名前 (changedProperties) を付ける

type ObjectNode = { id: string; filePath: string; json: CustomObjectJson };

/** 絞り込みの引数 (オブジェクトの API 名) */
export type ObjectFilter = { objects?: string[] };

const objectsOf = (snapshot: MetadataSnapshot | undefined) =>
    snapshot ? readable(snapshot.objects, 'object') : undefined;

/** オブジェクトを API 名で対応付ける (API 名の順) */
const compareObjects = (input: SnapshotInput, filter: ObjectFilter = {}) =>
    compareKeyed<ObjectNode>(
        objectsOf(input.before),
        objectsOf(input.after),
        (o) => o.json.apiName,
        input.before !== undefined,
    )
        .filter((c) => !filter.objects || filter.objects.includes(c.key))
        .sort((a, b) => a.key.localeCompare(b.key));

/** 子 (項目・入力規則など) を、オブジェクトの before / after から対応付ける */
const compareChildren = <T>(
    compared: Compared<ObjectNode>,
    hasBefore: boolean,
    childrenOf: (json: CustomObjectJson) => T[] | undefined,
    key: (item: T) => string,
    same?: (before: T, after: T) => boolean,
): Compared<T>[] =>
    compareKeyed<T>(
        compared.before ? (childrenOf(compared.before.json) ?? []) : hasBefore ? [] : undefined,
        compared.after ? (childrenOf(compared.after.json) ?? []) : [],
        key,
        hasBefore,
        same,
    );

/** 変わったプロパティの名前 (changed のときだけ) */
const changedNames = (compared: Compared<object>, ignore: string[] = []) =>
    compared.status === 'changed'
        ? {
              changedProperties: changedProps(compared.before, compared.after, ignore).map(
                  (c) => c.name,
              ),
          }
        : {};

const text = (value: FormulaValue | undefined) =>
    value === undefined ? undefined : formulaTextOf(value);

/** undefined になりうるプロパティを、省けるプロパティにした型 */
type Defined<T> = {
    [K in keyof T as undefined extends T[K] ? never : K]: T[K];
} & {
    [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
};

/** undefined のプロパティを持たない (zod の exactOptional に合わせる) */
const defined = <T extends object>(row: T): Defined<T> =>
    Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined)) as Defined<T>;

/** object.list: オブジェクトの一覧 */
export const getObjectList = (input: SnapshotInput, filter: ObjectFilter = {}): ObjectListRow[] =>
    compareObjects(input, filter).map((compared) => {
        const { json, filePath } = (compared.after ?? compared.before)!;
        return defined({
            ...rowBase(compared, json, filePath),
            ...changedNames(compared, [
                'fields',
                'validationRules',
                'recordTypes',
                'listViews',
                'fieldSets',
                'compactLayouts',
                'webLinks',
                'businessProcesses',
                'sharingReasons',
            ]),
            object: json.apiName,
            label: json.label,
            pluralLabel: json.pluralLabel,
            objectType: json.objectType,
            description: json.description,
            sharingModel: json.sharingModel,
            deploymentStatus: json.deploymentStatus,
            customSettingsType: json.customSettingsType,
            fieldCount: json.fields?.length ?? 0,
            validationRuleCount: json.validationRules?.length ?? 0,
            recordTypeCount: json.recordTypes?.length ?? 0,
        });
    });

/** 選択リスト値の名前の並び */
const valueNames = (field: CustomFieldJson | undefined) =>
    (field?.valueSet?.values ?? []).map((v) => v.fullName);

/** 両方にある値の並びが変わったか (追加・削除だけなら false) */
const orderChanged = (before: CustomFieldJson | undefined, after: CustomFieldJson | undefined) => {
    if (!before || !after) return false;
    const a = valueNames(after);
    const b = valueNames(before).filter((name) => a.includes(name));
    const common = a.filter((name) => b.includes(name));
    return !isSameValue(b, common);
};

const summaryOf = (field: CustomFieldJson) =>
    field.summaryOperation
        ? `${field.summaryOperation}(${field.summarizedField ?? field.summaryForeignKey ?? ''})`
        : undefined;

/** object.fields: 項目の一覧 (暗黙の標準項目を含む)。比べるときは、変わった項目とプロパティの名前 */
export const getObjectFields = (
    input: SnapshotInput,
    filter: ObjectFilter & { includeImplicit?: boolean } = {},
): ObjectFieldRow[] => {
    const hasBefore = input.before !== undefined;
    return compareObjects(input, filter).flatMap((compared) => {
        const node = (compared.after ?? compared.before)!;
        const implicit =
            filter.includeImplicit === false
                ? []
                : (() => {
                      const definedNames = new Set((node.json.fields ?? []).map((f) => f.apiName));
                      return getImplicitFields(node.json.objectType)
                          .filter((f) => !definedNames.has(f.apiName))
                          .map((f): ObjectFieldRow =>
                              defined({
                                  ...(hasBefore
                                      ? {
                                            status:
                                                compared.status === 'added' ||
                                                compared.status === 'removed'
                                                    ? compared.status
                                                    : ('unchanged' as const),
                                        }
                                      : {}),
                                  object: node.json.apiName,
                                  field: f.apiName,
                                  origin: 'implicit' as const,
                                  referenceTo: f.reference?.objectApiName,
                              }),
                          );
                  })();
        const fields = compareChildren<CustomFieldJson>(
            compared,
            hasBefore,
            (json) => json.fields,
            (f) => f.apiName,
        ).map((field): ObjectFieldRow => {
            const json = (field.after ?? field.before)!;
            return defined({
                ...rowBase(field, json, node.filePath),
                ...changedNames(field),
                object: node.json.apiName,
                field: json.apiName,
                origin: 'metadata' as const,
                label: json.label,
                type: json.type,
                required: json.required,
                unique: json.unique,
                externalId: json.externalId,
                length: json.length,
                precision: json.precision,
                scale: json.scale,
                referenceTo: json.referenceTo,
                relationshipName: json.relationshipName,
                deleteConstraint: json.deleteConstraint,
                formula: text(json.formula),
                defaultValue: text(json.defaultValue),
                summary: summaryOf(json),
                valueSetName: json.valueSet?.valueSetName,
                picklistValueCount: json.valueSet?.values?.length,
                ...(field.status === 'changed' && orderChanged(field.before, field.after)
                    ? { picklistOrderChanged: true as const }
                    : {}),
                helpText: json.inlineHelpText,
                description: json.description,
            });
        });
        return [...implicit, ...fields];
    });
};

/** object.picklists: 選択リスト値 (定義の順)。グローバル値セットを使う項目は、値セットの名前の 1 行 */
export const getObjectPicklists = (
    input: SnapshotInput,
    filter: ObjectFilter & { fields?: string[] } = {},
): ObjectPicklistRow[] => {
    const hasBefore = input.before !== undefined;
    return compareObjects(input, filter).flatMap((compared) => {
        const node = (compared.after ?? compared.before)!;
        return compareChildren<CustomFieldJson>(
            compared,
            hasBefore,
            (json) => json.fields?.filter((f) => f.valueSet !== undefined),
            (f) => f.apiName,
        )
            .filter((field) => !filter.fields || filter.fields.includes(field.key))
            .flatMap((field): ObjectPicklistRow[] => {
                const json = (field.after ?? field.before)!;
                const base = { object: node.json.apiName, field: json.apiName };
                if (json.valueSet?.valueSetName !== undefined && !json.valueSet.values) {
                    return [
                        defined({
                            ...rowBase(field, json, node.filePath),
                            ...base,
                            valueSetName: json.valueSet.valueSetName,
                            controllingField: json.valueSet.controllingField,
                        }),
                    ];
                }
                const settings = new Map(
                    (json.valueSet?.valueSettings ?? []).map((s) => [
                        s.valueName,
                        s.controllingFieldValues,
                    ]),
                );
                const values = compareKeyed<PicklistValueJson>(
                    field.before
                        ? (field.before.valueSet?.values ?? [])
                        : hasBefore
                          ? []
                          : undefined,
                    field.after?.valueSet?.values ?? [],
                    (v) => v.fullName,
                    hasBefore,
                );
                const afterOrder = new Map(
                    (field.after?.valueSet?.values ?? []).map((v, i) => [v.fullName, i + 1]),
                );
                return values.map((value) => {
                    const v = (value.after ?? value.before)!;
                    return defined({
                        ...rowBase(value, v, node.filePath),
                        ...changedNames(value),
                        ...base,
                        value: v.fullName,
                        label: v.label,
                        order: afterOrder.get(v.fullName),
                        isDefault: v.default,
                        isActive: v.isActive,
                        color: v.color,
                        controllingField: json.valueSet?.controllingField,
                        controllingValues: settings.get(v.fullName),
                    });
                });
            });
    });
};

/** object.validationRules: 入力規則 (条件の数式・メッセージ) */
export const getObjectValidationRules = (
    input: SnapshotInput,
    filter: ObjectFilter = {},
): ObjectValidationRuleRow[] => {
    const hasBefore = input.before !== undefined;
    return compareObjects(input, filter).flatMap((compared) => {
        const node = (compared.after ?? compared.before)!;
        return compareChildren<ValidationRuleJson>(
            compared,
            hasBefore,
            (json) => json.validationRules,
            (r) => r.fullName,
        ).map((rule) => {
            const json = (rule.after ?? rule.before)!;
            return defined({
                ...rowBase(rule, json, node.filePath),
                ...changedNames(rule),
                object: node.json.apiName,
                rule: json.fullName,
                active: json.active,
                condition: text(json.errorConditionFormula),
                errorMessage: json.errorMessage,
                errorDisplayField: json.errorDisplayField,
                description: json.description,
            });
        });
    });
};

/** object.recordTypePicklists: レコードタイプごとに選べる選択リスト値 */
export const getObjectRecordTypePicklists = (
    input: SnapshotInput,
    filter: ObjectFilter = {},
): ObjectRecordTypePicklistRow[] => {
    const hasBefore = input.before !== undefined;
    type Entry = {
        recordType: RecordTypeJson;
        picklist: string;
        values: string[];
        defaultValue?: string;
    };
    const entriesOf = (json: CustomObjectJson): Entry[] =>
        (json.recordTypes ?? []).flatMap((recordType) =>
            (recordType.picklistValues ?? []).map((p) => {
                const def = p.values?.find((v) => v.default)?.fullName;
                return {
                    recordType,
                    picklist: p.picklist,
                    values: (p.values ?? []).map((v) => v.fullName),
                    ...(def !== undefined ? { defaultValue: def } : {}),
                };
            }),
        );
    return compareObjects(input, filter).flatMap((compared) => {
        const node = (compared.after ?? compared.before)!;
        return compareChildren<Entry>(
            compared,
            hasBefore,
            entriesOf,
            (e) => `${e.recordType.fullName}.${e.picklist}`,
            (b, a) => isSameValue(b.values, a.values) && b.defaultValue === a.defaultValue,
        ).map((entry) => {
            const e = (entry.after ?? entry.before)!;
            return defined({
                ...rowBase(entry, e.recordType, node.filePath),
                object: node.json.apiName,
                recordType: e.recordType.fullName,
                recordTypeLabel: e.recordType.label,
                active: e.recordType.active,
                picklist: e.picklist,
                values: e.values,
                defaultValue: e.defaultValue,
            });
        });
    });
};

const RELATION_TYPES = new Set(['Lookup', 'MasterDetail']);

/**
 * object.diagram: ER 図 (参照関係)。objects を渡すと、そこから depth 段たどったオブジェクトに絞る
 * (参照している側からも、参照されている側からもたどる)。リポジトリにない参照先 (User など) は external
 */
export const getObjectDiagram = (
    input: SnapshotInput,
    args: ObjectFilter & { depth?: number } = {},
): ObjectDiagram => {
    const hasBefore = input.before !== undefined;
    const all = compareObjects(input);
    const fieldsOf = (compared: Compared<ObjectNode>) =>
        compareChildren<CustomFieldJson>(
            compared,
            hasBefore,
            (json) => json.fields,
            (f) => f.apiName,
        );
    const relations = all.flatMap((compared) =>
        compareChildren<CustomFieldJson>(
            compared,
            hasBefore,
            (json) => json.fields?.filter((f) => RELATION_TYPES.has(f.type ?? '') && f.referenceTo),
            (f) => `${f.apiName}->${f.referenceTo}:${f.type}`,
            () => true,
        ).map((field) => {
            const json = (field.after ?? field.before)!;
            return {
                ...(field.status ? { status: field.status } : {}),
                from: compared.key,
                field: json.apiName,
                to: json.referenceTo!,
                type: json.type as 'Lookup' | 'MasterDetail',
            };
        }),
    );
    // 絞り込み: objects から depth 段 (両方向)
    let names: Set<string> | undefined;
    if (args.objects) {
        names = new Set(args.objects);
        for (let i = 0; i < (args.depth ?? 1); i++) {
            for (const r of relations) {
                if (names.has(r.from) || names.has(r.to)) {
                    names.add(r.from);
                    names.add(r.to);
                }
            }
        }
    }
    const shown = relations.filter((r) => !names || (names.has(r.from) && names.has(r.to)));
    const objects: ObjectDiagram['objects'] = all
        .filter((compared) => !names || names.has(compared.key))
        .map((compared) => {
            const json = (compared.after ?? compared.before)!.json;
            return defined({
                ...(compared.status ? { status: compared.status } : {}),
                name: json.apiName,
                label: json.label,
                objectType: json.objectType,
                fields: fieldsOf(compared).map((field) => {
                    const f = (field.after ?? field.before)!;
                    return defined({
                        ...(field.status ? { status: field.status } : {}),
                        name: f.apiName,
                        label: f.label,
                        type: f.type,
                        referenceTo: RELATION_TYPES.has(f.type ?? '') ? f.referenceTo : undefined,
                    });
                }),
            });
        });
    const known = new Set(objects.map((o) => o.name));
    const external = [...new Set(shown.map((r) => r.to))]
        .filter((name) => !known.has(name) && !all.some((c) => c.key === name))
        .sort()
        .map((name) => ({
            name,
            objectType: name.endsWith('__c') ? 'custom' : 'standard',
            external: true as const,
            fields: [],
        }));
    return { objects: [...objects, ...external], relations: shown };
};
