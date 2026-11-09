import { analyzeFlexiPages } from '../processor/Metadata/pageAnalysis';
import {
    layoutItemKey,
    type FlexiPageComponentJson,
    type FlexiPageFieldJson,
    type FlexiPageJson,
    type LayoutItemJson,
    type LayoutJson,
} from '../types';
import { compareKeyed, contextOf, readable, rowBase } from './commons';
import type {
    FlexiPageDetail,
    LayoutDetail,
    LwcPlacementRow,
    MetadataSnapshot,
    SnapshotInput,
} from './types';

// 画面の provider (layout.detail / flexiPage.detail / lwc.placements)。方針: docs/report-components-plan.md 2.7 章
// after の構成に、before との違い (status・変更前の位置) を重ねる。after にないもの (removed) は、変更前の位置に置く

const layoutsOf = (snapshot: MetadataSnapshot | undefined) =>
    snapshot ? readable<LayoutJson>(snapshot.layouts, 'layout') : undefined;

const sameIgnoring =
    <T extends object>(...keys: string[]) =>
    (before: T, after: T) => {
        const strip = (value: T) =>
            JSON.stringify(
                Object.fromEntries(
                    Object.entries(value).filter(([k]) => !['sourceKeys', ...keys].includes(k)),
                ),
            );
        return strip(before) === strip(after);
    };

/** layout.detail: ページレイアウトのセクションと項目・関連リスト・ボタン (names を渡すとそのレイアウトだけ) */
export const getLayoutDetails = (input: SnapshotInput, names?: string[]): LayoutDetail[] => {
    const hasBefore = input.before !== undefined;
    return compareKeyed(layoutsOf(input.before), layoutsOf(input.after), (l) => l.id, hasBefore)
        .filter((c) => !names || names.includes((c.after ?? c.before)!.json.name))
        .map((compared) => {
            const { json, filePath } = (compared.after ?? compared.before)!;
            const before = compared.before?.json;
            const after = compared.after?.json;
            // 項目は位置を除いて比べ、位置の違いは movedFrom にする
            const itemKey = (item: LayoutItemJson) =>
                layoutItemKey(item) ??
                `#${item.position.section}:${item.position.column}:${item.position.row}`;
            const items = compareKeyed(
                before?.items ?? (hasBefore ? [] : undefined),
                after?.items ?? [],
                itemKey,
                hasBefore,
                sameIgnoring<LayoutItemJson>('position'),
            );
            // セクションはラベルで対応付ける (ラベルがなければ番号。項目の position.section と同じ)
            const labeled = (layout: LayoutJson | undefined) =>
                (layout?.sections ?? []).map((node, i) => ({
                    label: node.label ?? `#${i + 1}`,
                    node,
                }));
            const sections = compareKeyed(
                hasBefore ? labeled(before) : undefined,
                labeled(after),
                (s) => s.label,
                hasBefore,
                (b, a) => b.node.sourceKeys.objectKey === a.node.sourceKeys.objectKey,
            );
            return {
                ...rowBase(compared, json, filePath),
                name: json.name,
                objectApiName: json.objectApiName,
                sections: sections.map((section) => {
                    const { label, node } = (section.after ?? section.before)!;
                    return {
                        ...rowBase(section, node, filePath),
                        label,
                        columns: node.columns,
                        items: items
                            .filter((c) => (c.after ?? c.before)!.position.section === label)
                            .map((c) => {
                                const item = (c.after ?? c.before)!;
                                const moved =
                                    c.before &&
                                    c.after &&
                                    JSON.stringify(c.before.position) !==
                                        JSON.stringify(c.after.position);
                                const other = item.field
                                    ? undefined
                                    : (item.customLink ??
                                      item.page ??
                                      item.canvas ??
                                      item.component ??
                                      item.reportChartComponent ??
                                      (item.emptySpace ? '(空白)' : undefined));
                                return {
                                    ...rowBase(
                                        moved && c.status === 'unchanged'
                                            ? { status: 'changed' as const }
                                            : c,
                                        item,
                                        filePath,
                                    ),
                                    ...(item.field !== undefined ? { field: item.field } : {}),
                                    ...(other !== undefined ? { other } : {}),
                                    ...(item.behavior !== undefined
                                        ? { behavior: item.behavior }
                                        : {}),
                                    column: item.position.column,
                                    row: item.position.row,
                                    ...(moved ? { movedFrom: c.before!.position } : {}),
                                };
                            })
                            .sort((a, b) => a.column - b.column || a.row - b.row),
                    };
                }),
                relatedLists: compareKeyed(
                    before?.relatedLists ?? (hasBefore ? [] : undefined),
                    after?.relatedLists ?? [],
                    (r) => r.relatedList,
                    hasBefore,
                ).map((c) => {
                    const r = (c.after ?? c.before)!;
                    return {
                        ...rowBase(c, r, filePath),
                        relatedList: r.relatedList,
                        fields: r.fields ?? [],
                    };
                }),
                actions: compareKeyed(
                    before?.actions ?? (hasBefore ? [] : undefined),
                    after?.actions ?? [],
                    (a) => `${a.context ?? ''}:${a.actionName}`,
                    hasBefore,
                ).map((c) => {
                    const a = (c.after ?? c.before)!;
                    return {
                        ...rowBase(c, a, filePath),
                        actionName: a.actionName,
                        ...(a.actionType !== undefined ? { actionType: a.actionType } : {}),
                        ...(a.sortOrder !== undefined ? { sortOrder: a.sortOrder } : {}),
                    };
                }),
            };
        });
};

const pagesOf = (snapshot: MetadataSnapshot | undefined) =>
    snapshot ? readable<FlexiPageJson>(snapshot.flexiPages, 'flexiPage') : undefined;

type PageItem =
    | ({ itemType: 'component' } & FlexiPageComponentJson)
    | ({ itemType: 'field' } & FlexiPageFieldJson);

const pageItems = (page: FlexiPageJson | undefined): PageItem[] => [
    ...(page?.components ?? []).map((c) => ({ itemType: 'component' as const, ...c })),
    ...(page?.fields ?? []).map((f) => ({ itemType: 'field' as const, ...f })),
];

/** flexiPage.detail: Lightning ページのリージョンと部品・項目 (リージョンの中は表示順) */
export const getFlexiPageDetails = (input: SnapshotInput, names?: string[]): FlexiPageDetail[] => {
    const hasBefore = input.before !== undefined;
    return compareKeyed(pagesOf(input.before), pagesOf(input.after), (p) => p.id, hasBefore)
        .filter((c) => !names || names.includes((c.after ?? c.before)!.json.name))
        .map((compared) => {
            const { json, filePath } = (compared.after ?? compared.before)!;
            const before = compared.before?.json;
            const after = compared.after?.json;
            const items = compareKeyed(
                hasBefore ? pageItems(before) : undefined,
                pageItems(after),
                (item) => item.identifier,
                hasBefore,
                sameIgnoring<PageItem>('region'),
            );
            const regions = compareKeyed(
                before?.regions ?? (hasBefore ? [] : undefined),
                after?.regions ?? [],
                (r) => r.name,
                hasBefore,
            );
            return {
                ...rowBase(compared, json, filePath),
                name: json.name,
                ...(json.masterLabel !== undefined ? { label: json.masterLabel } : {}),
                ...(json.type !== undefined ? { pageType: json.type } : {}),
                ...(json.sobjectType !== undefined ? { sobjectType: json.sobjectType } : {}),
                ...(json.template !== undefined ? { template: json.template } : {}),
                regions: regions.map((region) => {
                    const node = (region.after ?? region.before)!;
                    // 表示順: after の順、removed は before の順で後ろに
                    const order = [...(region.after?.items ?? []), ...(region.before?.items ?? [])];
                    return {
                        ...rowBase(region, node, filePath),
                        name: node.name,
                        items: items
                            .filter((c) => (c.after ?? c.before)!.region === node.name)
                            .sort(
                                (a, b) =>
                                    order.indexOf((a.after ?? a.before)!.identifier) -
                                    order.indexOf((b.after ?? b.before)!.identifier),
                            )
                            .map((c) => {
                                const item = (c.after ?? c.before)!;
                                const moved =
                                    c.before && c.after && c.before.region !== c.after.region;
                                return {
                                    ...rowBase(
                                        moved && c.status === 'unchanged'
                                            ? { status: 'changed' as const }
                                            : c,
                                        item,
                                        filePath,
                                    ),
                                    identifier: item.identifier,
                                    itemType: item.itemType,
                                    name:
                                        item.itemType === 'component'
                                            ? item.componentName
                                            : item.fieldItem,
                                    properties: item.properties ?? {},
                                    hasVisibilityRule: item.visibilityRule !== undefined,
                                    ...(moved ? { movedFrom: c.before!.region } : {}),
                                };
                            }),
                    };
                }),
            };
        });
};

/** lwc.placements: LWC を置いている Lightning ページ (before を渡すと、置いた・外した・変えたが status に出る) */
export const getLwcPlacements = (input: SnapshotInput, lwc?: string[]): LwcPlacementRow[] => {
    const placementsOf = (snapshot: MetadataSnapshot) =>
        analyzeFlexiPages(snapshot.flexiPages ?? [], contextOf(snapshot)).placements;
    const filePaths = new Map(
        [...(pagesOf(input.before) ?? []), ...(pagesOf(input.after) ?? [])].map((p) => [
            p.json.name,
            p.filePath,
        ]),
    );
    return compareKeyed(
        input.before ? placementsOf(input.before) : undefined,
        placementsOf(input.after),
        (p) => `${p.flexiPage}:${p.identifier}`,
        input.before !== undefined,
        (b, a) => JSON.stringify(b) === JSON.stringify(a),
    )
        .filter((c) => !lwc || lwc.includes((c.after ?? c.before)!.lwc))
        .map((c) => {
            const p = (c.after ?? c.before)!;
            return {
                ...rowBase(c, undefined, filePaths.get(p.flexiPage)),
                lwc: p.lwc,
                flexiPage: p.flexiPage,
                ...(p.pageType !== undefined ? { pageType: p.pageType } : {}),
                ...(p.sobjectType !== undefined ? { sobjectType: p.sobjectType } : {}),
                region: p.region,
                properties: p.properties,
            };
        });
};
