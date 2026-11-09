import type { ConvertKeys } from '../../types';

import type { DependencyKind, UnitDefinition, UnitDependencies, UnitReference } from './types';

// 依存関係のグラフ。単位ごとの定義・参照 (units.ts) を集めて作る (保存しない)。方針: docs/analysis-plan.md 3 章
//
// ノードは 3 段: 単位 (AccountService / Invoice__c / 権限セット) → メンバー (メソッド・項目など) → 文・式。
// 辺は参照の場所のいちばん細かいノード (式、なければ文、なければメンバー・単位) から、参照先のノードへ張る。
// 参照先は、定義 (リポジトリにあるもの) と名前で突き合わせ、なければ標準 (standard)・パッケージ (managed)・
// ない (missing)・確かめられない (unknown) のどれかにする。

export type NodeOrigin = 'repository' | 'standard' | 'managed' | 'missing' | 'unknown';

/** ノードの細かさ */
export type NodeLevel = 'unit' | 'member' | 'site';

export type DependencyNode = {
    /** '<種類>:<名前>' (field:Invoice__c.Amount__c)。文・式は 'site:<単位のノード>:<sourceKey>' */
    id: string;
    type: string;
    name: string;
    level: NodeLevel;
    origin: NodeOrigin;
    /** ひとつ上のノード (メンバー → 単位、文・式 → メンバーか単位、式 → 文) */
    parent?: string;
    /** 定義している単位 (単位の種類と id)。リポジトリにあるときだけ */
    unit?: { type: string; id: string };
    sourceKeys?: ConvertKeys;
};

export type DependencyEdge = {
    from: string;
    to: string;
    kind: DependencyKind;
    via: string;
    /** 参照している単位 */
    unit: { type: string; id: string };
};

export type DependencyFinding = {
    code: string;
    severity: 'warning' | 'info';
    /** 参照先 (field:Invoice__c.Missing__c) */
    target: string;
    /** 参照しているノード (いちばん細かいもの) */
    from: string;
    message: string;
};

export type DependencyGraph = {
    nodes: Map<string, DependencyNode>;
    edges: DependencyEdge[];
    findings: DependencyFinding[];
};

/** 単位 1 つの入力 */
export type GraphUnit = { type: string; id: string; dependencies: UnitDependencies };

// ---------------------------------------------------------------------------
// 名前の突き合わせ
// ---------------------------------------------------------------------------

/** 参照の種類 → 定義の種類 (名前が違うもの) */
const TARGET_ALIASES: Record<string, string> = {
    visualforcePage: 'apexPage',
    visualforceComponent: 'apexComponent',
    auraComponent: 'aura',
    component: 'aura',
};

/** よく使う標準オブジェクト (リポジトリになくても「ない」とは言わない。Apex の型がオブジェクトかの判断にも使う) */
const STANDARD_OBJECTS = new Set(
    [
        'Account',
        'Contact',
        'Lead',
        'Opportunity',
        'OpportunityLineItem',
        'Case',
        'User',
        'Task',
        'Event',
        'Campaign',
        'CampaignMember',
        'Contract',
        'Order',
        'OrderItem',
        'Product2',
        'Pricebook2',
        'PricebookEntry',
        'Asset',
        'Quote',
        'QuoteLineItem',
        'Group',
        'GroupMember',
        'Profile',
        'PermissionSet',
        'PermissionSetAssignment',
        'UserRole',
        'RecordType',
        'Attachment',
        'Note',
        'ContentDocument',
        'ContentVersion',
        'ContentDocumentLink',
        'FeedItem',
        'EmailMessage',
        'Organization',
        'BusinessHours',
        'Holiday',
        'Folder',
        'Document',
        'Solution',
        'Idea',
        'Entitlement',
        'ServiceContract',
        'WorkOrder',
        'Individual',
        'AsyncApexJob',
        'CronTrigger',
        'ApexClass',
        'ApexTrigger',
        'StaticResource',
        'SObject',
    ].map((name) => name.toLowerCase()),
);

const CUSTOM_SUFFIX = /__(c|mdt|e|x|b|share|history|feed|r)$/i;
const isNamespaced = (name: string) =>
    /^[A-Za-z][A-Za-z0-9]*__[A-Za-z]/.test(name) && /__.*__/.test(name);
const isCustom = (name: string) => CUSTOM_SUFFIX.test(name);

const nodeId = (type: string, name: string) => `${type}:${name}`;
const keyOf = (type: string, name: string) => `${type}:${name.toLowerCase()}`;

/** 単位の主なノードの種類 (定義がないとき) */
const UNIT_NODE_TYPE: Record<string, string> = { anonymousApex: 'anonymousApex' };

// ---------------------------------------------------------------------------
// グラフを作る
// ---------------------------------------------------------------------------

/** 単位ごとの定義と参照から、依存関係のグラフを作る */
export const buildDependencyGraph = (units: readonly GraphUnit[]): DependencyGraph => {
    const nodes = new Map<string, DependencyNode>();
    /** 定義の名前 (小文字) → ノードの id */
    const defined = new Map<string, string>();
    /** 定義のある種類 (その種類の参照は「ない」と言える) */
    const definedTypes = new Set<string>();
    const edges: DependencyEdge[] = [];
    const findings: DependencyFinding[] = [];

    const addNode = (node: DependencyNode) => {
        const existing = nodes.get(node.id);
        if (!existing || (existing.origin !== 'repository' && node.origin === 'repository')) {
            nodes.set(node.id, node);
        }
        return node.id;
    };

    // 1. 定義 (単位とメンバー)
    const unitNodeOf = new Map<string, string>();
    for (const unit of units) {
        const unitRef = { type: unit.type, id: unit.id };
        const [primary, ...members] = unit.dependencies.definitions;
        const primaryDef: UnitDefinition = primary ?? {
            defType: UNIT_NODE_TYPE[unit.type] ?? unit.type,
            name: unit.id,
        };
        const unitNode = addNode({
            id: nodeId(primaryDef.defType, primaryDef.name),
            type: primaryDef.defType,
            name: primaryDef.name,
            level: 'unit',
            origin: 'repository',
            unit: unitRef,
            ...(primaryDef.sourceKeys ? { sourceKeys: primaryDef.sourceKeys } : {}),
        });
        unitNodeOf.set(`${unit.type}:${unit.id}`, unitNode);
        defined.set(keyOf(primaryDef.defType, primaryDef.name), unitNode);
        definedTypes.add(primaryDef.defType);
        for (const member of members) {
            // メンバーの親: 名前の . の前までが定義されていればそれ (Outer.Inner.method → Outer.Inner)、なければ単位
            const parentName = member.name.includes('.')
                ? member.name.slice(0, member.name.lastIndexOf('.'))
                : undefined;
            const parent =
                (parentName &&
                    [...defined.entries()].find(([key]) =>
                        key.endsWith(`:${parentName.toLowerCase()}`),
                    )?.[1]) ||
                unitNode;
            const id = addNode({
                id: nodeId(member.defType, member.name),
                type: member.defType,
                name: member.name,
                level: 'member',
                origin: 'repository',
                parent: parent === nodeId(member.defType, member.name) ? unitNode : parent,
                unit: unitRef,
                ...(member.sourceKeys ? { sourceKeys: member.sourceKeys } : {}),
            });
            defined.set(keyOf(member.defType, member.name), id);
            definedTypes.add(member.defType);
        }
    }

    const lookup = (type: string, name: string) => defined.get(keyOf(type, name));

    /** Apex の型の名前を、クラスかオブジェクトか標準の型にする */
    const resolveApexType = (
        name: string,
        fromUnitNode?: string,
    ): { type: string; name: string; id?: string } => {
        const cls = lookup('apexClass', name);
        if (cls) return { type: 'apexClass', name: nodes.get(cls)!.name, id: cls };
        // 内側のクラス (同じクラスの中から Inner と書いたもの)
        if (fromUnitNode) {
            const outer = nodes.get(fromUnitNode);
            const inner = outer && lookup('apexClass', `${outer.name}.${name}`);
            if (inner) return { type: 'apexClass', name: nodes.get(inner)!.name, id: inner };
        }
        const object = lookup('object', name);
        if (object) return { type: 'object', name: nodes.get(object)!.name, id: object };
        if (isCustom(name) || STANDARD_OBJECTS.has(name.toLowerCase()))
            return { type: 'object', name };
        return { type: 'apexType', name };
    };

    /** 参照先のノード (なければ作る) */
    const resolveTarget = (reference: UnitReference, fromUnitNode: string): string => {
        let refType = TARGET_ALIASES[reference.refType] ?? reference.refType;
        let target = reference.target;
        if (refType === 'apexType') {
            const resolved = resolveApexType(target, fromUnitNode);
            if (resolved.id) return resolved.id;
            refType = resolved.type;
            target = resolved.name;
        } else if (refType === 'apexTypeMember' || refType === 'apexMethod') {
            const dot = target.lastIndexOf('.');
            const owner = resolveApexType(target.slice(0, dot), fromUnitNode);
            const member = target.slice(dot + 1);
            if (owner.type === 'object') {
                refType = 'field';
                target = `${owner.name}.${member}`;
            } else if (owner.type === 'apexClass') {
                const found =
                    lookup('apexMethod', `${owner.name}.${member}`) ??
                    lookup('apexProperty', `${owner.name}.${member}`);
                if (found) return found;
                // 継承したメンバー・標準のメソッドかもしれないので「ない」とは言わない (@salesforce/apex は除く)
                return addNode({
                    id: nodeId('apexMember', `${owner.name}.${member}`),
                    type: 'apexMember',
                    name: `${owner.name}.${member}`,
                    level: 'member',
                    origin: reference.via === 'import' ? 'missing' : 'unknown',
                    ...(owner.id ? { parent: owner.id } : {}),
                });
            } else {
                // 標準のクラス (System.debug など)
                return addNode({
                    id: nodeId('apexType', owner.name),
                    type: 'apexType',
                    name: owner.name,
                    level: 'unit',
                    origin: isNamespaced(owner.name) ? 'managed' : 'standard',
                });
            }
        }
        const found = lookup(refType, target);
        if (found) return found;

        // リポジトリにないもの
        const origin = originOf(refType, target);
        const parentObject = refType === 'field' ? target.split('.')[0] : undefined;
        const parent = parentObject
            ? (lookup('object', parentObject) ?? addObjectNode(parentObject))
            : undefined;
        return addNode({
            id: nodeId(refType, target),
            type: refType,
            name: target,
            level: refType === 'field' || refType === 'apexMember' ? 'member' : 'unit',
            origin,
            ...(parent ? { parent } : {}),
        });
    };

    const addObjectNode = (name: string): string =>
        addNode({
            id: nodeId('object', name),
            type: 'object',
            name,
            level: 'unit',
            origin: originOf('object', name),
        });

    const originOf = (refType: string, target: string): NodeOrigin => {
        if (refType === 'globalVariable' || refType === 'apexType') return 'standard';
        const [head] = target.split('.');
        if (isNamespaced(head ?? target) || isNamespaced(target.split('.').pop() ?? ''))
            return 'managed';
        if (refType === 'object') {
            if (!isCustom(target)) return 'standard';
            return definedTypes.has('object') ? 'missing' : 'unknown';
        }
        if (refType === 'field') {
            const [object, field = ''] = target.split('.');
            if (!isCustom(field)) return 'standard';
            // オブジェクトが (定義として) リポジトリにあるのに項目がない
            return object && lookup('object', object)
                ? 'missing'
                : definedTypes.has('object') && isCustom(object ?? '')
                  ? 'missing'
                  : 'unknown';
        }
        return definedTypes.has(refType) ? 'missing' : 'unknown';
    };

    // 2. 参照 (文・式のノードと辺)
    for (const unit of units) {
        const unitNode = unitNodeOf.get(`${unit.type}:${unit.id}`)!;
        const unitRef = { type: unit.type, id: unit.id };
        for (const reference of unit.dependencies.references) {
            const { member, statement, expression } = reference.from;
            const memberNode = member
                ? (lookup('apexMethod', member) ??
                  lookup('apexProperty', member) ??
                  lookup('apexClass', member) ??
                  lookup('apexTrigger', member) ??
                  [...defined.values()].find(
                      (id) =>
                          nodes.get(id)!.name.toLowerCase() === member.toLowerCase() &&
                          nodes.get(id)!.unit?.id === unit.id,
                  ))
                : undefined;
            let from = memberNode ?? unitNode;
            if (statement) {
                from = addNode({
                    id: `site:${unitNode}:${statement.sourceKey}`,
                    type: 'statement',
                    name: statement.sourceKey,
                    level: 'site',
                    origin: 'repository',
                    parent: memberNode ?? unitNode,
                    unit: unitRef,
                    sourceKeys: statement,
                });
            }
            if (expression && expression.sourceKey !== statement?.sourceKey) {
                from = addNode({
                    id: `site:${unitNode}:${expression.sourceKey}`,
                    type: 'expression',
                    name: expression.sourceKey,
                    level: 'site',
                    origin: 'repository',
                    parent: from,
                    unit: unitRef,
                    sourceKeys: expression,
                });
            }
            const to = resolveTarget(reference, unitNode);
            edges.push({ from, to, kind: reference.kind, via: reference.via, unit: unitRef });
            const target = nodes.get(to)!;
            if (target.origin === 'missing') {
                findings.push({
                    // 今までの参照の解析と同じ名前 (UNKNOWN_FIELD / UNKNOWN_APEX_CLASS など)
                    code: `UNKNOWN_${target.type.replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase()}`,
                    severity: 'warning',
                    target: to,
                    from,
                    message: `${target.type} ${target.name} is not in the repository (${unit.type} ${unit.id}, ${reference.via})`,
                });
            }
        }
    }

    return { nodes, edges, findings: dedupeFindings(findings) };
};

const dedupeFindings = (findings: DependencyFinding[]) => {
    const seen = new Set<string>();
    return findings.filter((f) => {
        const key = `${f.code}|${f.target}|${f.from}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

// ---------------------------------------------------------------------------
// たどる
// ---------------------------------------------------------------------------

/** ノードを、指定の細かさのノードにする (文・式 → メンバー → 単位) */
export const toLevel = (graph: DependencyGraph, id: string, level: NodeLevel): string => {
    const order: NodeLevel[] = ['unit', 'member', 'site'];
    let current = graph.nodes.get(id);
    while (current && order.indexOf(current.level) > order.indexOf(level) && current.parent) {
        current = graph.nodes.get(current.parent);
    }
    return current?.id ?? id;
};

/** ノードとその下のノード (単位なら、メンバーと文・式も) */
const withDescendants = (graph: DependencyGraph, id: string): Set<string> => {
    const children = new Map<string, string[]>();
    for (const node of graph.nodes.values()) {
        if (node.parent) children.set(node.parent, [...(children.get(node.parent) ?? []), node.id]);
    }
    const found = new Set<string>([id]);
    const stack = [id];
    while (stack.length) {
        for (const child of children.get(stack.pop()!) ?? []) {
            if (!found.has(child)) {
                found.add(child);
                stack.push(child);
            }
        }
    }
    return found;
};

export type TraverseOptions = {
    /** たどる段数 (既定 1) */
    depth?: number;
    /** 結果のノードの細かさ (既定 unit) */
    level?: NodeLevel;
    /** 辺の種類で絞る */
    kinds?: readonly DependencyKind[];
};

const traverse = (
    graph: DependencyGraph,
    start: string,
    direction: 'out' | 'in',
    options: TraverseOptions,
): Map<string, number> => {
    const depth = options.depth ?? 1;
    const level = options.level ?? 'unit';
    const kinds = options.kinds ? new Set(options.kinds) : undefined;
    const result = new Map<string, number>();
    let frontier = new Set([start]);
    for (let step = 1; step <= depth && frontier.size; step++) {
        const next = new Set<string>();
        for (const id of frontier) {
            const sources = withDescendants(graph, id);
            for (const edge of graph.edges) {
                if (kinds && !kinds.has(edge.kind)) continue;
                const [here, there] =
                    direction === 'out' ? [edge.from, edge.to] : [edge.to, edge.from];
                if (!sources.has(here)) continue;
                const found = toLevel(graph, there, level);
                const unitOfFound = toLevel(graph, found, 'unit');
                // 自分の中の参照は除く
                if (unitOfFound === toLevel(graph, start, 'unit') && level === 'unit') continue;
                if (!result.has(found) && found !== start) {
                    result.set(found, step);
                    next.add(found);
                }
            }
        }
        frontier = next;
    }
    return result;
};

/** 依存先 (node が使っているもの)。値は何段目で見つかったか */
export const getDependencies = (
    graph: DependencyGraph,
    node: string,
    options: TraverseOptions = {},
) => traverse(graph, node, 'out', options);

/** 被依存 (node を使っているもの)。単位を渡すと、メンバー (項目など) を使っているものも含む */
export const getDependents = (
    graph: DependencyGraph,
    node: string,
    options: TraverseOptions = {},
) => traverse(graph, node, 'in', options);

/**
 * 変更の影響: 変更した単位 (ノード) から被依存をたどり、変更していないが影響を受ける単位。
 * 値は何段目で見つかったか
 */
export const getImpact = (
    graph: DependencyGraph,
    changed: readonly string[],
    depth = 2,
): Map<string, number> => {
    const changedUnits = new Set(changed.map((id) => toLevel(graph, id, 'unit')));
    const impact = new Map<string, number>();
    for (const id of changed) {
        for (const [found, step] of getDependents(graph, id, { depth, level: 'unit' })) {
            if (changedUnits.has(found)) continue;
            if (!impact.has(found) || impact.get(found)! > step) impact.set(found, step);
        }
    }
    return impact;
};

// ---------------------------------------------------------------------------
// 依存の差分・使われていないもの・循環・順序
// ---------------------------------------------------------------------------

/** 依存 1 つ (メンバーの細かさ。位置が変わっただけでは変わらない) */
export type DependencyKey = { from: string; to: string; kind: DependencyKind };

const memberEdges = (graph: DependencyGraph): Map<string, DependencyKey> =>
    new Map(
        graph.edges.map((edge) => {
            const key = { from: toLevel(graph, edge.from, 'member'), to: edge.to, kind: edge.kind };
            return [`${key.from}|${key.to}|${key.kind}`, key];
        }),
    );

/** before / after の依存の増減 (メンバーの細かさで比べる) */
export const diffDependencies = (
    before: DependencyGraph,
    after: DependencyGraph,
): { added: DependencyKey[]; removed: DependencyKey[] } => {
    const b = memberEdges(before);
    const a = memberEdges(after);
    return {
        added: [...a].filter(([key]) => !b.has(key)).map(([, value]) => value),
        removed: [...b].filter(([key]) => !a.has(key)).map(([, value]) => value),
    };
};

/** 使われていないものの候補にする種類 (入口になるもの (トリガー・権限セット・画面など) は除く) */
const UNUSED_CANDIDATE_TYPES = new Set([
    'field',
    'customLabel',
    'customPermission',
    'staticResource',
    'lwc',
    'apexClass',
]);

/** リポジトリにあって、ほかの単位から使われていないもの (掃除の候補)。カスタム項目だけを見る */
export const getUnused = (graph: DependencyGraph): DependencyNode[] => {
    const used = new Set<string>();
    for (const edge of graph.edges) {
        const fromUnit = toLevel(graph, edge.from, 'unit');
        if (
            toLevel(graph, edge.to, 'unit') !== fromUnit ||
            graph.nodes.get(edge.to)?.level !== 'unit'
        ) {
            used.add(edge.to);
        }
    }
    return [...graph.nodes.values()]
        .filter(
            (node) =>
                node.origin === 'repository' &&
                UNUSED_CANDIDATE_TYPES.has(node.type) &&
                // 項目はカスタム項目だけ、Apex は外側のクラスだけ
                (node.type === 'field'
                    ? isCustom(node.name.split('.').pop() ?? '')
                    : node.type !== 'apexClass' || node.level === 'unit') &&
                !used.has(node.id),
        )
        .sort((a, b) => a.id.localeCompare(b.id));
};

/** 単位の細かさの依存 (自分への依存を除く) */
const unitEdges = (graph: DependencyGraph): Map<string, Set<string>> => {
    const out = new Map<string, Set<string>>();
    for (const edge of graph.edges) {
        const from = toLevel(graph, edge.from, 'unit');
        const to = toLevel(graph, edge.to, 'unit');
        if (from === to || graph.nodes.get(to)?.origin !== 'repository') continue;
        out.set(from, (out.get(from) ?? new Set()).add(to));
    }
    return out;
};

/** 依存の循環 (単位の細かさ。2 つ以上の単位からなる強連結成分) */
export const getCycles = (graph: DependencyGraph): string[][] => {
    const out = unitEdges(graph);
    const index = new Map<string, number>();
    const low = new Map<string, number>();
    const stack: string[] = [];
    const onStack = new Set<string>();
    const cycles: string[][] = [];
    let counter = 0;
    const visit = (v: string) => {
        index.set(v, counter);
        low.set(v, counter++);
        stack.push(v);
        onStack.add(v);
        for (const w of out.get(v) ?? []) {
            if (!index.has(w)) {
                visit(w);
                low.set(v, Math.min(low.get(v)!, low.get(w)!));
            } else if (onStack.has(w)) {
                low.set(v, Math.min(low.get(v)!, index.get(w)!));
            }
        }
        if (low.get(v) === index.get(v)) {
            const component: string[] = [];
            let w: string;
            do {
                w = stack.pop()!;
                onStack.delete(w);
                component.push(w);
            } while (w !== v);
            if (component.length > 1) cycles.push(component.sort());
        }
    };
    const units = [...graph.nodes.values()]
        .filter((n) => n.level === 'unit' && n.origin === 'repository')
        .map((n) => n.id)
        .sort();
    for (const v of units) if (!index.has(v)) visit(v);
    return cycles;
};

/**
 * デプロイの順序: 依存先が先に来る単位の並び (循環しているものは、まとめて 1 段に置く)。
 * 1 段ごとの配列で、同じ段の単位は互いに依存しない
 */
export const getDeploymentOrder = (graph: DependencyGraph): string[][] => {
    const out = unitEdges(graph);
    const units = [...graph.nodes.values()]
        .filter((n) => n.level === 'unit' && n.origin === 'repository')
        .map((n) => n.id);
    // 循環をまとめる
    const groupOf = new Map<string, string>(units.map((u) => [u, u]));
    for (const cycle of getCycles(graph)) for (const u of cycle) groupOf.set(u, cycle[0]!);
    const members = new Map<string, string[]>();
    for (const u of units)
        members.set(groupOf.get(u)!, [...(members.get(groupOf.get(u)!) ?? []), u]);
    const depends = new Map<string, Set<string>>();
    for (const [from, tos] of out) {
        for (const to of tos) {
            const [a, b] = [groupOf.get(from), groupOf.get(to)];
            if (a && b && a !== b) depends.set(a, (depends.get(a) ?? new Set()).add(b));
        }
    }
    const done = new Set<string>();
    const levels: string[][] = [];
    let remaining = [...members.keys()];
    while (remaining.length) {
        const ready = remaining.filter((g) =>
            [...(depends.get(g) ?? [])].every((d) => done.has(d)),
        );
        if (!ready.length) break;
        levels.push(ready.flatMap((g) => members.get(g)!).sort());
        ready.forEach((g) => done.add(g));
        remaining = remaining.filter((g) => !done.has(g));
    }
    return levels;
};

// ---------------------------------------------------------------------------
// 書き出し
// ---------------------------------------------------------------------------

const mermaidId = (id: string) => `n_${id.replace(/[^A-Za-z0-9_]/g, '_')}`;

/** 単位の細かさの図 (Mermaid の flowchart)。nodes を渡すと、そのノードの間だけ */
export const toMermaid = (graph: DependencyGraph, nodes?: ReadonlySet<string>): string => {
    const lines = ['flowchart LR'];
    const seen = new Set<string>();
    const declare = (id: string) => {
        if (seen.has(id)) return;
        seen.add(id);
        const node = graph.nodes.get(id)!;
        const label = `${node.type}: ${node.name}`.replace(/"/g, "'");
        lines.push(
            `    ${mermaidId(id)}["${label}"]${node.origin === 'missing' ? ':::missing' : ''}`,
        );
    };
    for (const [from, tos] of unitEdgesAll(graph)) {
        for (const to of tos) {
            if (nodes && !(nodes.has(from) && nodes.has(to))) continue;
            declare(from);
            declare(to);
            lines.push(`    ${mermaidId(from)} --> ${mermaidId(to)}`);
        }
    }
    lines.push('    classDef missing stroke:#d33,stroke-dasharray: 4 2');
    return lines.join('\n');
};

/** 単位の細かさの図 (Graphviz の DOT) */
export const toDot = (graph: DependencyGraph, nodes?: ReadonlySet<string>): string => {
    const lines = ['digraph dependencies {', '    rankdir=LR;'];
    for (const [from, tos] of unitEdgesAll(graph)) {
        for (const to of tos) {
            if (nodes && !(nodes.has(from) && nodes.has(to))) continue;
            lines.push(`    ${JSON.stringify(from)} -> ${JSON.stringify(to)};`);
        }
    }
    lines.push('}');
    return lines.join('\n');
};

/** 単位の細かさの依存 (リポジトリにないものへの依存も含む。標準のものは除く) */
const unitEdgesAll = (graph: DependencyGraph): Map<string, Set<string>> => {
    const out = new Map<string, Set<string>>();
    for (const edge of graph.edges) {
        const from = toLevel(graph, edge.from, 'unit');
        const to = toLevel(graph, edge.to, 'unit');
        const origin = graph.nodes.get(to)?.origin;
        if (from === to || origin === 'standard' || origin === 'unknown') continue;
        out.set(from, (out.get(from) ?? new Set()).add(to));
    }
    return new Map([...out].sort(([a], [b]) => a.localeCompare(b)));
};

/** 単位の種類 → メタデータ API の型の名前 (package.xml) */
const METADATA_TYPE_NAMES: Record<string, string> = {
    apexClass: 'ApexClass',
    apexTrigger: 'ApexTrigger',
    lwc: 'LightningComponentBundle',
    aura: 'AuraDefinitionBundle',
    object: 'CustomObject',
    field: 'CustomField',
    objectTranslation: 'CustomObjectTranslation',
    permissionSet: 'PermissionSet',
    mutingPermissionSet: 'MutingPermissionSet',
    permissionSetGroup: 'PermissionSetGroup',
    profile: 'Profile',
    customLabels: 'CustomLabels',
    customLabel: 'CustomLabel',
    flow: 'Flow',
    layout: 'Layout',
    flexiPage: 'FlexiPage',
    customMetadata: 'CustomMetadata',
    customTab: 'CustomTab',
    customApplication: 'CustomApplication',
    globalValueSet: 'GlobalValueSet',
    standardValueSet: 'StandardValueSet',
    customPermission: 'CustomPermission',
    quickAction: 'QuickAction',
    sharingRules: 'SharingRules',
    staticResource: 'StaticResource',
    report: 'Report',
    dashboard: 'Dashboard',
    translations: 'Translations',
    namedCredential: 'NamedCredential',
    remoteSiteSetting: 'RemoteSiteSetting',
    workflow: 'Workflow',
    approvalProcess: 'ApprovalProcess',
    queue: 'Queue',
    group: 'Group',
    role: 'Role',
    apexPage: 'ApexPage',
    apexComponent: 'ApexComponent',
    emailTemplate: 'EmailTemplate',
};

/** ノード (単位・項目など) の package.xml。種類ごとに名前の順。apiVersion は sfdx-project.json の sourceApiVersion など */
export const toPackageXml = (
    graph: DependencyGraph,
    ids: readonly string[],
    apiVersion = '62.0',
): string => {
    const byType = new Map<string, Set<string>>();
    for (const id of ids) {
        const node = graph.nodes.get(id);
        const typeName = node && METADATA_TYPE_NAMES[node.type];
        if (!node || !typeName) continue;
        byType.set(typeName, (byType.get(typeName) ?? new Set()).add(node.name));
    }
    const types = [...byType]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(
            ([name, members]) =>
                `    <types>\n${[...members]
                    .sort()
                    .map((member) => `        <members>${member}</members>`)
                    .join('\n')}\n        <name>${name}</name>\n    </types>`,
        );
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<Package xmlns="http://soap.sforce.com/2006/04/metadata">',
        ...types,
        `    <version>${apiVersion}</version>`,
        '</Package>',
        '',
    ].join('\n');
};
