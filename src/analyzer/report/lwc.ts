import type { LwcBundleParseResult } from '../parser/Lwc/parser';
import { analyzeObject } from '../processor/Metadata/analysis';
import { type LwcBundleAnalysis, analyzeLwcBundles } from '../processor/Lwc/analysis';
import { lwcInterfaceOf } from '../processor/Lwc/interface';
import { isSameValue } from '../processor/commons/diff/commons';
import type {
    ConvertKeys,
    LwcAttributeValueJson,
    LwcBundleJson,
    LwcMemberJson,
    LwcTemplateNodeJson,
} from '../types';
import { type Compared, changedProps, compareKeyed, rowBase } from './commons';
import type {
    LwcComponentRow,
    LwcDetailRow,
    LwcWireframe,
    MetadataSnapshot,
    SnapshotInput,
    WireframeNode,
} from './types';

// LWC のドキュメント・理解のための provider (lwc.components / lwc.detail)。方針: docs/report-components-plan.md 2.4 章。
// 既定は今の状態のすべて (status なし)。比べる時点があれば (diff / compare)、行に status と変わったプロパティの名前を付ける

/** 絞り込みの引数 (accountList でも c/accountList でもよい) */
export type LwcFilter = { components?: string[] };

type Bundle = {
    key: string;
    result: Extract<LwcBundleParseResult, { dataType: 'lwcBundle' }>;
    json: LwcBundleJson;
    analysis: LwcBundleAnalysis;
};

const bundleKeyOf = (json: LwcBundleJson) => `${json.namespace}/${json.name}`;

const accepts = (filter: LwcFilter, json: LwcBundleJson) =>
    !filter.components ||
    filter.components.includes(json.name) ||
    filter.components.includes(bundleKeyOf(json));

/** スナップショットのバンドルと、バンドルをまたぐ解析 (オブジェクトがあれば項目も突き合わせる) */
const bundlesOf = (
    snapshot: MetadataSnapshot | undefined,
    filter: LwcFilter,
): Bundle[] | undefined => {
    if (!snapshot) return undefined;
    const results = (snapshot.lwc ?? []).filter(
        (r): r is Bundle['result'] => r.dataType === 'lwcBundle',
    );
    const objects = (snapshot.objects ?? []).flatMap((r) =>
        r.dataType === 'object' ? [analyzeObject(r.result.base)] : [],
    );
    const analyses = new Map(
        analyzeLwcBundles(results, objects).map((a) => [a.bundle, a] as const),
    );
    return results
        .map((result) => {
            const json = result.result.base;
            const key = bundleKeyOf(json);
            const analysis =
                analyses.get(key) ??
                analyses.get(json.name) ??
                ([...analyses.values()].find(
                    (a) => `${a.component.namespace}/${a.component.name}` === key,
                ) as LwcBundleAnalysis);
            return { key, result, json, analysis };
        })
        .filter((b) => accepts(filter, b.json));
};

const compareBundles = (
    input: SnapshotInput,
    filter: LwcFilter,
    same?: (b: Bundle, a: Bundle) => boolean,
) =>
    compareKeyed<Bundle>(
        bundlesOf(input.before, filter),
        bundlesOf(input.after, filter),
        (b) => b.key,
        input.before !== undefined,
        same,
    ).sort((a, b) => a.key.localeCompare(b.key));

const sortUnique = (values: string[]) => [...new Set(values)].sort();

/** 位置のキー (宣言の { base, name, ... } の形なら base) */
const keysOf = (keys: unknown): ConvertKeys | undefined => {
    if (typeof keys !== 'object' || keys === null) return undefined;
    const base = (keys as { base?: unknown }).base;
    return (typeof base === 'object' && base !== null ? base : keys) as ConvertKeys;
};

/** 使っているオブジェクト (Account.Name → Account) */
const objectsOf = (analysis: LwcBundleAnalysis | undefined) =>
    sortUnique(
        (analysis?.metadataDependencies ?? []).flatMap((d) =>
            d.value && (d.refType === 'object' || d.refType === 'field')
                ? [d.value.split('.')[0]!]
                : [],
        ),
    );

const apexMethodsOf = (json: LwcBundleJson) =>
    sortUnique(
        json.modules.flatMap(({ module }) =>
            (module?.imports ?? []).flatMap((i) =>
                i.apex ? [`${i.apex.className}.${i.apex.methodName}`] : [],
            ),
        ),
    );

// ---------------------------------------------------------------------------
// lwc.components
// ---------------------------------------------------------------------------

type ComponentSummary = Omit<
    LwcComponentRow,
    'status' | 'filePath' | 'sourceKeys' | 'changedProperties'
>;

const summaryOf = ({ json, analysis }: Bundle): ComponentSummary => {
    const meta = json.meta ?? undefined;
    const main = json.modules.find((m) => m.main);
    const language = main?.fileName.endsWith('.ts') ? 'ts' : main ? 'js' : undefined;
    return {
        component: bundleKeyOf(json),
        ...(meta?.masterLabel !== undefined ? { label: meta.masterLabel } : {}),
        ...(meta?.description !== undefined ? { description: meta.description } : {}),
        ...(meta?.isExposed !== undefined ? { isExposed: meta.isExposed } : {}),
        targets: meta?.targets ?? [],
        ...(meta?.apiVersion !== undefined ? { apiVersion: meta.apiVersion } : {}),
        ...(language ? { language } : {}),
        apiProperties: analysis?.component.apiProperties ?? [],
        events: analysis?.component.events ?? [],
        childComponents: sortUnique([
            ...(analysis?.localComponents ?? []),
            ...(analysis?.packageComponents ?? []),
        ]),
        baseComponents: sortUnique(analysis?.lightningComponents ?? []),
        apexMethods: apexMethodsOf(json),
        objects: objectsOf(analysis),
        findingCount: analysis?.findings.length ?? 0,
    };
};

/** lwc.components: コンポーネントの一覧 (公開先・@api・イベント・使う子コンポーネント・Apex・オブジェクト) */
export const getLwcComponents = (input: SnapshotInput, filter: LwcFilter = {}): LwcComponentRow[] =>
    compareBundles(input, filter, (b, a) => isSameValue(summaryOf(b), summaryOf(a))).map(
        (compared) => {
            const bundle = (compared.after ?? compared.before)!;
            const changed =
                compared.status === 'changed'
                    ? changedProps(summaryOf(compared.before!), summaryOf(compared.after!)).map(
                          (c) => c.name,
                      )
                    : [];
            return {
                ...rowBase(compared, bundle.json.meta ?? undefined, bundle.result.filePath),
                ...(changed.length ? { changedProperties: changed } : {}),
                ...summaryOf(bundle),
            };
        },
    );

// ---------------------------------------------------------------------------
// lwc.detail
// ---------------------------------------------------------------------------

type DetailItem = {
    category: LwcDetailRow['category'];
    name: string;
    detail?: string;
    sourceKeys?: ConvertKeys;
};

const IMPORT_CATEGORIES: Partial<Record<string, DetailItem['category']>> = {
    label: 'label',
    customPermission: 'customPermission',
    resourceUrl: 'resource',
    contentAssetUrl: 'resource',
    messageChannel: 'messageChannel',
};

/** @wire のメンバー (アダプターと、設定のキー。$ のついた値はプロパティに追従する) */
const wireItemsOf = (json: LwcBundleJson): DetailItem[] => {
    const component = json.modules.find((m) => m.main)?.module?.component;
    return (component?.block ?? []).flatMap((member: LwcMemberJson) => {
        const modifier = 'modifier' in member ? member.modifier : undefined;
        const wire = modifier?.decorator?.find((d) => d.name === 'wire')?.wire;
        if (!wire) return [];
        const adapter = wire.apex
            ? `Apex ${wire.apex.className}.${wire.apex.methodName}`
            : `${(wire.adapter as { name?: string }).name ?? '?'}${wire.adapterSource ? ` (${wire.adapterSource})` : ''}`;
        const config = wire.config
            .map((c) =>
                c.reactive
                    ? `${c.key}: $${c.reactive}`
                    : c.fieldNames
                      ? `${c.key}: ${c.fieldNames.join(', ')}`
                      : c.key,
            )
            .join(' / ');
        const name = 'name' in member && typeof member.name === 'string' ? member.name : '?';
        return [
            {
                category: 'wire' as const,
                name,
                detail: config ? `${adapter}・${config}` : adapter,
                ...(keysOf(member.sourceKeys) ? { sourceKeys: keysOf(member.sourceKeys)! } : {}),
            },
        ];
    });
};

const detailItemsOf = ({ json, analysis }: Bundle): DetailItem[] => {
    const items: DetailItem[] = [];
    // 親から使えるもの
    for (const member of lwcInterfaceOf(json)) {
        const detail = [
            member.type,
            member.params ? `(${member.params.join(', ')})` : undefined,
            member.accessor && member.accessor !== 'field' ? member.accessor : undefined,
        ]
            .filter(Boolean)
            .join(' ');
        items.push({
            category: member.memberType,
            name: member.name,
            ...(detail ? { detail } : {}),
            ...(member.sourceKeys ? { sourceKeys: member.sourceKeys } : {}),
        });
    }
    items.push(...wireItemsOf(json));
    // import (Apex・ラベル・カスタム権限・静的リソース・メッセージチャネル)
    const wired = new Set(
        wireItemsOf(json).flatMap((w) =>
            w.detail?.startsWith('Apex ') ? [w.detail.slice(5).split('・')[0]!] : [],
        ),
    );
    for (const { module } of json.modules) {
        for (const item of module?.imports ?? []) {
            if (item.apex) {
                const name = `${item.apex.className}.${item.apex.methodName}`;
                items.push({
                    category: 'apex',
                    name,
                    detail: wired.has(name) ? '@wire' : '呼び出し (imperative)',
                    sourceKeys: item.sourceKeys,
                });
                continue;
            }
            const category = IMPORT_CATEGORIES[item.category];
            if (category) {
                items.push({
                    category,
                    name: item.source.replace(/^@salesforce\/\w+\//, ''),
                    sourceKeys: item.sourceKeys,
                });
            }
        }
    }
    // 使うコンポーネント
    for (const name of sortUnique([
        ...(analysis?.localComponents ?? []),
        ...(analysis?.packageComponents ?? []),
    ])) {
        items.push({ category: 'child', name });
    }
    for (const name of sortUnique(analysis?.lightningComponents ?? [])) {
        items.push({
            category: 'baseComponent',
            name,
            ...(analysis?.dataAccessComponents.includes(name)
                ? { detail: 'データを読み書きする' }
                : {}),
        });
    }
    // 使うオブジェクト・項目 (同じものは 1 つ)
    const data = new Map<string, DetailItem>();
    for (const dependency of analysis?.metadataDependencies ?? []) {
        if (
            !dependency.value ||
            (dependency.refType !== 'object' && dependency.refType !== 'field')
        )
            continue;
        const key = `${dependency.refType}:${dependency.value}`;
        if (data.has(key)) continue;
        data.set(key, {
            category: dependency.refType,
            name: dependency.value,
            detail:
                dependency.origin === 'import'
                    ? '@salesforce/schema'
                    : `テンプレート${dependency.attribute ? ` (${dependency.attribute})` : ''}`,
            sourceKeys: dependency.sourceKeys,
        });
    }
    items.push(...[...data.values()].sort((a, b) => a.name.localeCompare(b.name)));
    // 突き合わせの指摘
    for (const finding of analysis?.findings ?? []) {
        items.push({
            category: 'finding',
            name: `${finding.code}: ${finding.target}`,
            detail: finding.message,
            sourceKeys: finding.sourceKeys,
        });
    }
    return items;
};

/**
 * lwc.detail: コンポーネントの中身 (親から使えるもの・@wire・Apex・使うコンポーネント・オブジェクトと項目・
 * ラベルなどの import・突き合わせの指摘)。1 行 1 項目。components で絞る
 */
export const getLwcDetail = (
    input: SnapshotInput,
    filter: LwcFilter & { categories?: LwcDetailRow['category'][] } = {},
): LwcDetailRow[] => {
    const hasBefore = input.before !== undefined;
    return compareBundles(input, filter, () => true).flatMap((compared: Compared<Bundle>) => {
        const bundle = (compared.after ?? compared.before)!;
        const counts = new Map<string, number>();
        const keyed = (items: DetailItem[]) => {
            counts.clear();
            return items.map((item) => {
                const base = `${item.category}:${item.name}`;
                const n = (counts.get(base) ?? 0) + 1;
                counts.set(base, n);
                return { ...item, key: n === 1 ? base : `${base}#${n}` };
            });
        };
        return compareKeyed(
            compared.before ? keyed(detailItemsOf(compared.before)) : hasBefore ? [] : undefined,
            compared.after ? keyed(detailItemsOf(compared.after)) : [],
            (item) => item.key,
            hasBefore,
            (b, a) => b.detail === a.detail,
        )
            .filter((row) => {
                const item = (row.after ?? row.before)!;
                return !filter.categories || filter.categories.includes(item.category);
            })
            .map((row): LwcDetailRow => {
                const { key: _key, sourceKeys, ...item } = (row.after ?? row.before)!;
                return {
                    ...rowBase(
                        row,
                        sourceKeys ? { sourceKeys } : undefined,
                        bundle.result.filePath,
                    ),
                    ...(row.status === 'changed' ? { changedProperties: ['detail'] } : {}),
                    component: bundle.key,
                    ...item,
                };
            });
    });
};

// ---------------------------------------------------------------------------
// lwc.wireframe (方式 A。docs/lwc-snapshot-plan.md 4 章)
// ---------------------------------------------------------------------------

const valueText = (value: LwcAttributeValueJson): string =>
    value.type === 'static'
        ? value.value
        : value.type === 'expression'
          ? `{${value.expression.text}}`
          : '';

const BRANCH_LABELS: Record<string, string> = {
    'lwc:if': 'if',
    'lwc:elseif': 'elseif',
    'lwc:else': 'else',
    'if:true': 'if:true',
    'if:false': 'if:false',
};

/** テンプレートのノードを、ワイヤーフレームのノードにする (位置・メタデータの参照など描かないものは持たない) */
const wireframeNodesOf = (nodes: LwcTemplateNodeJson[]): WireframeNode[] =>
    nodes.flatMap((node): WireframeNode[] => {
        switch (node.kind) {
            case 'lwcText':
                return node.text ? [{ type: 'text', text: node.text }] : [];
            case 'lwcIf':
                return [
                    {
                        type: 'if',
                        branches: node.branches.map((branch) => ({
                            label: `${BRANCH_LABELS[branch.directive] ?? branch.directive}${branch.condition ? ` ${valueText(branch.condition)}` : ''}`,
                            children: wireframeNodesOf(branch.children),
                        })),
                    },
                ];
            case 'lwcForEach':
                return [
                    {
                        type: 'for',
                        items: valueText(node.items),
                        ...((node.item ?? node.iteratorName)
                            ? { text: node.item ?? node.iteratorName! }
                            : {}),
                        children: wireframeNodesOf(node.children),
                    },
                ];
            case 'lwcElement': {
                const children = wireframeNodesOf(node.children);
                if (node.elementType === 'slot') {
                    return [
                        {
                            type: 'slot',
                            text: node.slotName ?? '',
                            ...(children.length ? { children } : {}),
                        },
                    ];
                }
                if (node.elementType === 'template') return children;
                const attributes = node.attributes.map((a) => ({
                    name: a.name,
                    value: valueText(a.value),
                }));
                const events = node.events.map((e) => e.event);
                return [
                    {
                        type: node.component ? 'component' : 'element',
                        tag: node.tag,
                        ...(node.component
                            ? { module: node.component.module, source: node.component.source }
                            : {}),
                        ...(attributes.length ? { attributes } : {}),
                        ...(events.length ? { events } : {}),
                        ...(children.length ? { children } : {}),
                    },
                ];
            }
        }
    });

/** ノードの中の、同じ名前空間のコンポーネント (c/accountRow) */
const localModulesOf = (nodes: WireframeNode[]): string[] =>
    nodes.flatMap((node) => [
        ...(node.type === 'component' && node.source === 'local' && node.module
            ? [node.module]
            : []),
        ...localModulesOf(node.children ?? []),
        ...(node.branches ?? []).flatMap((b) => localModulesOf(b.children)),
    ]);

/**
 * lwc.wireframe: テンプレートから描く画面の骨組み (JS は実行しない)。分岐はタブ、繰り返しは 1 件分。
 * components で選んだもの (省略するとすべて) を描き、中で使う同じ名前空間の子コンポーネントも depth 段まで含める
 * (画面で展開して入れ子に描くため)。比べるときは、コンポーネントごとの status だけを付ける (中の差分は付けない)
 */
export const getLwcWireframe = (
    input: SnapshotInput,
    args: LwcFilter & { depth?: number } = {},
): LwcWireframe => {
    const all = compareBundles(input, {}, (b, a) =>
        isSameValue(b.json.templates, a.json.templates),
    );
    const byKey = new Map(all.map((c) => [c.key, c]));
    const componentOf = (compared: Compared<Bundle>) => {
        const bundle = (compared.after ?? compared.before)!;
        const meta = bundle.json.meta ?? undefined;
        return {
            ...(compared.status ? { status: compared.status } : {}),
            component: bundle.key,
            ...(meta?.masterLabel !== undefined ? { label: meta.masterLabel } : {}),
            templates: bundle.json.templates.flatMap((t) =>
                t.template
                    ? [
                          {
                              fileName: t.fileName,
                              main: t.main,
                              nodes: wireframeNodesOf(t.template.children),
                          },
                      ]
                    : [],
            ),
        };
    };
    const roots = all.filter((c) => accepts(args, (c.after ?? c.before)!.json)).map((c) => c.key);
    const included = new Map<string, ReturnType<typeof componentOf>>();
    let frontier = roots;
    for (let level = 0; level <= (args.depth ?? 3) && frontier.length; level++) {
        const next: string[] = [];
        for (const key of frontier) {
            if (included.has(key)) continue;
            const compared = byKey.get(key);
            if (!compared) continue;
            const component = componentOf(compared);
            included.set(key, component);
            next.push(...component.templates.flatMap((t) => localModulesOf(t.nodes)));
        }
        frontier = next;
    }
    return { roots, components: [...included.values()] };
};
