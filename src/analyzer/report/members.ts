import type { CustomObjectJson, FlowElementJson } from '../types';
import { compareKeyed, readable } from './commons';
import { type Value, leafOf, propertiesOf } from './metadata';
import type {
    FlowElementRow,
    LabelDefinitionRow,
    MetadataSnapshot,
    ObjectMemberRow,
    SnapshotInput,
} from './types';
import { recordOf as record } from '../processor/commons/json';

// 宣言単位の provider (docs/todo.md 2.2): オブジェクトの子 (object.members)・Flow の要素 (flow.elements)・
// ラベルの定義 (label.definitions)。中身は「場所 = 値」の一覧 (details) で持つ (metadata.properties と同じ書き方)。
// 既定は今の状態のすべて。比べるときは status と、変わった中身 (changedDetails)

const text = (value: unknown): string | undefined => {
    const leaf = leafOf(value);
    return leaf === undefined ? undefined : String(leaf);
};

/** 中身の一覧 ("場所 = 値")。omit のキーは持たない (行の列に出すもの) */
const detailsOf = (value: unknown, omit: readonly string[]): string[] => {
    const node = record(value);
    if (!node) return [];
    const out: [string, Value][] = [];
    for (const [key, child] of Object.entries(node)) {
        if (key === 'kind' || key === 'sourceKeys' || omit.includes(key)) continue;
        propertiesOf(child, key, out);
    }
    return out.map(([path, v]) => `${path} = ${String(v)}`);
};

/** 比べるときの、増えた・変わった中身 */
const changedDetailsOf = (before: string[] | undefined, after: string[] | undefined) => {
    const old = new Set(before ?? []);
    return (after ?? []).filter((detail) => !old.has(detail));
};

const sameDetails = <T extends { details: string[] }>(b: T, a: T) =>
    b.details.length === a.details.length && b.details.every((d, i) => d === a.details[i]);

// ---------------------------------------------------------------------------
// object.members
// ---------------------------------------------------------------------------

/** オブジェクトの子の種類 → JSON のプロパティ (searchLayouts は 1 つのまとまり) */
const MEMBER_KEYS = {
    recordType: 'recordTypes',
    listView: 'listViews',
    fieldSet: 'fieldSets',
    compactLayout: 'compactLayouts',
    webLink: 'webLinks',
    businessProcess: 'businessProcesses',
    sharingReason: 'sharingReasons',
    actionOverride: 'actionOverrides',
    searchLayout: 'searchLayouts',
} as const satisfies Record<string, keyof CustomObjectJson>;

export type ObjectMemberType = keyof typeof MEMBER_KEYS;

type MemberItem = Omit<ObjectMemberRow, 'status' | 'filePath' | 'changedDetails'>;

const NAME_COLUMNS = [
    'fullName',
    'label',
    'masterLabel',
    'description',
    'actionName',
    'formFactor',
];

const membersOf = (object: CustomObjectJson, types: readonly ObjectMemberType[] | undefined) => {
    const items: MemberItem[] = [];
    for (const [memberType, key] of Object.entries(MEMBER_KEYS) as [
        ObjectMemberType,
        (typeof MEMBER_KEYS)[ObjectMemberType],
    ][]) {
        if (types && !types.includes(memberType)) continue;
        const value: unknown = object[key];
        if (memberType === 'searchLayout') {
            // 検索レイアウトは、一覧の種類ごとに 1 行 (項目・ボタンの並び)
            for (const [list, fields] of Object.entries(record(value) ?? {})) {
                if (!Array.isArray(fields)) continue;
                items.push({
                    object: object.apiName,
                    memberType,
                    name: list,
                    details: [`fields = ${fields.join(', ')}`],
                });
            }
            continue;
        }
        for (const member of Array.isArray(value) ? value : []) {
            const node = record(member)!;
            const name =
                memberType === 'actionOverride'
                    ? `${text(node.actionName) ?? ''}${node.formFactor ? ` (${text(node.formFactor)})` : ''}`
                    : (text(node.fullName) ?? '');
            const label = text(node.label) ?? text(node.masterLabel);
            const description = text(node.description) ?? text(node.comment);
            items.push({
                object: object.apiName,
                memberType,
                name,
                ...(label !== undefined ? { label } : {}),
                ...(description !== undefined ? { description } : {}),
                details: detailsOf(node, [...NAME_COLUMNS, 'comment', 'skippedElements']),
            });
        }
    }
    return items;
};

const objectsOf = (snapshot: MetadataSnapshot | undefined, objects: string[] | undefined) =>
    snapshot
        ? readable(snapshot.objects, 'object').filter(
              (o) => !objects || objects.includes(o.json.apiName),
          )
        : undefined;

/**
 * object.members: オブジェクトの子 (レコードタイプ・リストビュー・項目セット・コンパクトレイアウト・ボタンとリンク・
 * ビジネスプロセス・共有の理由・アクションの上書き・検索レイアウト)。1 行 1 つで、中身は「場所 = 値」の一覧
 */
export const getObjectMembers = (
    input: SnapshotInput,
    filter: { objects?: string[]; memberTypes?: ObjectMemberType[] } = {},
): ObjectMemberRow[] => {
    const hasBefore = input.before !== undefined;
    const rowsOf = (snapshot: MetadataSnapshot | undefined) =>
        objectsOf(snapshot, filter.objects)?.flatMap((o) =>
            membersOf(o.json, filter.memberTypes).map((item) => ({
                ...item,
                filePath: o.filePath,
            })),
        );
    return compareKeyed(
        rowsOf(input.before),
        rowsOf(input.after) ?? [],
        (row) => `${row.object}|${row.memberType}|${row.name}`,
        hasBefore,
        sameDetails,
    )
        .map((compared) => {
            const row = (compared.after ?? compared.before)!;
            const changed =
                compared.status === 'changed'
                    ? changedDetailsOf(compared.before?.details, compared.after?.details)
                    : [];
            return {
                ...(compared.status ? { status: compared.status } : {}),
                ...row,
                ...(changed.length ? { changedDetails: changed } : {}),
            };
        })
        .sort(
            (a, b) =>
                a.object.localeCompare(b.object) ||
                a.memberType.localeCompare(b.memberType) ||
                a.name.localeCompare(b.name),
        );
};

// ---------------------------------------------------------------------------
// flow.elements
// ---------------------------------------------------------------------------

/** 要素の対象のオブジェクト (レコードの操作・レコードトリガーなど) */
const objectOfElement = (element: FlowElementJson) =>
    text(record(element.properties)?.object) ?? text(record(element.properties)?.inputReference);

/**
 * flow.elements: Flow の要素の中身 (決定の条件・割り当て・レコードの操作の対象と条件・画面の項目・アクションの引数など)。
 * 1 行 1 要素で、中身は「場所 = 値」の一覧。flow.diagram (図) と flow.list (一覧) の詳しい版
 */
export const getFlowElements = (
    input: SnapshotInput,
    filter: { flows?: string[]; kinds?: string[] } = {},
): FlowElementRow[] => {
    const hasBefore = input.before !== undefined;
    const rowsOf = (snapshot: MetadataSnapshot | undefined) =>
        snapshot
            ? readable(snapshot.flows, 'flow')
                  .filter((f) => !filter.flows || filter.flows.includes(f.json.name))
                  .flatMap((f) =>
                      (f.json.elements ?? [])
                          .filter((e) => !filter.kinds || filter.kinds.includes(e.kind))
                          .map((element, order) => {
                              const object = objectOfElement(element);
                              return {
                                  filePath: f.filePath,
                                  flow: f.json.name,
                                  element: element.name,
                                  kind: element.kind,
                                  order: order + 1,
                                  ...(element.label !== undefined ? { label: element.label } : {}),
                                  ...(element.description !== undefined
                                      ? { description: element.description }
                                      : {}),
                                  ...(object !== undefined ? { object } : {}),
                                  details: detailsOf(element, ['name', 'label', 'description']),
                              };
                          }),
                  )
            : undefined;
    return compareKeyed(
        rowsOf(input.before),
        rowsOf(input.after) ?? [],
        (row) => `${row.flow}|${row.element}`,
        hasBefore,
        sameDetails,
    ).map((compared) => {
        const row = (compared.after ?? compared.before)!;
        const changed =
            compared.status === 'changed'
                ? changedDetailsOf(compared.before?.details, compared.after?.details)
                : [];
        return {
            ...(compared.status ? { status: compared.status } : {}),
            ...row,
            ...(changed.length ? { changedDetails: changed } : {}),
        };
    });
};

// ---------------------------------------------------------------------------
// label.definitions
// ---------------------------------------------------------------------------

/** 組織の翻訳 (translations) の、言語 → ラベル名 → 訳 */
const labelTranslationsOf = (snapshot: MetadataSnapshot) => {
    const byLanguage = new Map<string, Map<string, string>>();
    for (const result of snapshot.others ?? []) {
        if (result.dataType !== 'translations') continue;
        const base = record(result.result.base);
        const language = text(base?.fullName);
        if (!language) continue;
        const labels = new Map<string, string>();
        for (const item of Array.isArray(base?.customLabels) ? base.customLabels : []) {
            const node = record(item);
            const name = text(node?.name);
            const label = text(node?.label);
            if (name && label !== undefined) labels.set(name, label);
        }
        byLanguage.set(language, labels);
    }
    return byLanguage;
};

/**
 * label.definitions: カスタム表示ラベルの定義 (値・言語・保護・分類・説明) と、組織の翻訳 (translations) にある各言語の訳。
 * 訳のない言語も出す。使われている場所は crossRef.labels
 */
export const getLabelDefinitions = (
    input: SnapshotInput,
    filter: { labels?: string[]; categories?: string[] } = {},
): LabelDefinitionRow[] => {
    const hasBefore = input.before !== undefined;
    const rowsOf = (snapshot: MetadataSnapshot | undefined) => {
        if (!snapshot) return undefined;
        const translations = labelTranslationsOf(snapshot);
        const languages = [...translations.keys()].sort();
        return readable(snapshot.customLabels, 'customLabels').flatMap((file) =>
            (file.json.labels ?? [])
                .filter((label) => !filter.labels || filter.labels.includes(label.fullName))
                .filter(
                    (label) =>
                        !filter.categories ||
                        (label.categories ?? []).some((c) => filter.categories!.includes(c)),
                )
                .map((label) => {
                    const translated = languages.flatMap((language) => {
                        const value = translations.get(language)?.get(label.fullName);
                        return value === undefined ? [] : [`${language}: ${value}`];
                    });
                    const missing = languages.filter(
                        (language) =>
                            language !== label.language &&
                            !translations.get(language)?.has(label.fullName),
                    );
                    return {
                        filePath: file.filePath,
                        label: label.fullName,
                        value: label.value ?? '',
                        ...(label.language !== undefined ? { language: label.language } : {}),
                        ...(label.protected !== undefined ? { protected: label.protected } : {}),
                        ...(label.shortDescription !== undefined
                            ? { shortDescription: label.shortDescription }
                            : {}),
                        categories: label.categories ?? [],
                        translations: translated,
                        missingLanguages: missing,
                    };
                }),
        );
    };
    return compareKeyed(
        rowsOf(input.before),
        rowsOf(input.after) ?? [],
        (row) => row.label,
        hasBefore,
        (b, a) => JSON.stringify(b) === JSON.stringify(a),
    )
        .map((compared) => ({
            ...(compared.status ? { status: compared.status } : {}),
            ...(compared.after ?? compared.before)!,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
};
