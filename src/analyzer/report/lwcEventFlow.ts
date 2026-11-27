import type { LwcBundleParseResult } from '../parser/Lwc/parser';
import { analyzeLwcModuleCalls } from '../processor/Lwc/calls';
import type {
    EventFlow,
    EventFlowEdge,
    EventFlowNode,
    MetadataSnapshot,
    SnapshotInput,
} from './types';
import type { JsonRecord } from '../processor/commons/json';
import { jsonNodesIn, walkJson } from '../processor/commons/node';
import type { LwcNodeJson } from '../types';

// lwc.eventFlow: 利用者の操作から処理までの流れ (docs/todo.md 3.2.1 の 5)。
// テンプレートのイベント (<lightning-button onclick={handleSave}>)・@wire・表示のとき (connectedCallback など) を起点に、
// ハンドラー → 自分のメソッド (this.x()) → Apex の呼び出し・refreshApex・イベントの発行・トースト・画面の遷移・メッセージチャネル、とつなぐ。
// 子コンポーネントが発行したイベントは、親のテンプレートの on<イベント> につなぐ (depth 段の子まで)

export type LwcEventFlowFilter = {
    /** 起点のコンポーネント (accountList か c/accountList) */
    components?: string[];
    /** 子コンポーネントをたどる段数 (既定 1。0 は起点だけ) */
    depth?: number;
};

type Bundle = Extract<LwcBundleParseResult, { dataType: 'lwcBundle' }>;
type Json = JsonRecord;

/** 表示のときに呼ばれるメソッド (起点にする) */
const LIFECYCLE = new Map([
    ['constructor', '作ったとき'],
    ['connectedCallback', '表示したとき'],
    ['renderedCallback', '描いたとき'],
    ['disconnectedCallback', '外したとき'],
    ['errorCallback', '子でエラーが起きたとき'],
]);

/** 値 (ノード・ノードの並び) の中のすべての、その種類のノード (共通の走査 walkJson で辿る) */
const nodesOfKind = <K extends LwcNodeJson['kind']>(
    value: unknown,
    kind: K,
): Extract<LwcNodeJson, { kind: K }>[] => {
    const out: Extract<LwcNodeJson, { kind: K }>[] = [];
    for (const root of jsonNodesIn(value) as LwcNodeJson[]) {
        walkJson<LwcNodeJson>(root, {
            enterAny: (node) => {
                if (node.kind === kind) out.push(node as Extract<LwcNodeJson, { kind: K }>);
            },
        });
    }
    return out;
};

/** 本体の中の this.x() の x (自分のメソッドの呼び出し) */
const thisCallsIn = (content: unknown): string[] =>
    nodesOfKind(content, 'jsCall').flatMap(({ callee }) =>
        callee.kind === 'jsMemberAccess' && callee.object.kind === 'jsThis' && callee.member
            ? [callee.member]
            : [],
    );

/** 式の中の this.x (呼ばずに渡した自分のメンバー) の x */
const thisReferencesIn = (value: unknown): string[] =>
    nodesOfKind(value, 'jsMemberAccess').flatMap((access) =>
        access.object.kind === 'jsThis' && access.member ? [access.member] : [],
    );

const literal = (value: unknown) => (typeof value === 'string' ? value : undefined);

/** バンドル 1 つの、図の材料 */
type BundleFlow = {
    name: string;
    /** メンバー → 本体の呼び出しとイベント、自分のメソッドの呼び出し */
    members: Map<
        string,
        { calls: ReturnType<typeof analyzeLwcModuleCalls>[number]; thisCalls: string[] }[]
    >;
    /** テンプレートのイベント */
    actions: { tag: string; event: string; handler: string; child?: string }[];
    /** @wire (アダプターと、受け取るメンバー) */
    wires: { member: string; adapter: string; apex?: string; isMethod: boolean }[];
    children: string[];
};

const flowOfBundle = (bundle: Bundle): BundleFlow => {
    const base = bundle.result.base;
    const members: BundleFlow['members'] = new Map();
    const wires: BundleFlow['wires'] = [];
    for (const { main, module } of base.modules) {
        if (!main || !module) continue;
        for (const calls of analyzeLwcModuleCalls(module)) {
            if (calls.ownerKind !== 'lwcComponent' || !calls.member) continue;
            if (!members.has(calls.member)) members.set(calls.member, []);
            members.get(calls.member)!.push({ calls, thisCalls: thisCallsIn(calls.content) });
        }
        for (const member of module.component?.block ?? []) {
            if (member.kind !== 'lwcField' && member.kind !== 'lwcMethod') continue;
            for (const decorator of member.modifier.decorator ?? []) {
                if (decorator.name !== 'wire' || !decorator.wire) continue;
                const adapter = decorator.wire.adapter as Json;
                wires.push({
                    member: member.name,
                    adapter: literal(adapter.name) ?? 'wire',
                    ...(decorator.wire.apex
                        ? {
                              apex: `${decorator.wire.apex.className}.${decorator.wire.apex.methodName}`,
                          }
                        : {}),
                    isMethod: member.kind === 'lwcMethod',
                });
            }
        }
    }
    const actions: BundleFlow['actions'] = [];
    const children = new Set<string>();
    for (const template of base.templates) {
        for (const element of nodesOfKind(template.template, 'lwcElement')) {
            const component = element.component as { name: string; source: string } | undefined;
            if (component?.source === 'local') children.add(component.name);
            for (const handler of (element.events ?? []) as Json[]) {
                const value = handler.handler as Json;
                const expression = value.expression as
                    { path?: string[]; local: boolean } | undefined;
                if (value.type !== 'expression' || !expression?.path || expression.local) continue;
                actions.push({
                    tag: String(element.tag),
                    event: String(handler.event),
                    handler: expression.path[0]!,
                    ...(component?.source === 'local' ? { child: component.name } : {}),
                });
            }
        }
    }
    return { name: base.name, members, actions, wires, children: [...children].sort() };
};

const flows = new WeakMap<object, Map<string, BundleFlow>>();

const bundleFlowsOf = (snapshot: MetadataSnapshot): Map<string, BundleFlow> => {
    let map = flows.get(snapshot);
    if (map) return map;
    map = new Map();
    for (const result of snapshot.lwc ?? []) {
        if (result.dataType !== 'lwcBundle' || !result.result?.base) continue;
        const bundle = result as Bundle;
        map.set(bundle.result.base.name, flowOfBundle(bundle));
    }
    flows.set(snapshot, map);
    return map;
};

/**
 * lwc.eventFlow: 起点のコンポーネント (と depth 段の子) の、利用者の操作・@wire・表示のときから処理までの流れ (1 つの図)
 */
export const getLwcEventFlow = (
    input: SnapshotInput,
    filter: LwcEventFlowFilter = {},
): EventFlow => {
    const bundles = bundleFlowsOf(input.after);
    const starts = (filter.components ?? [...bundles.keys()]).map((name) =>
        name.replace(/^c\//, ''),
    );
    const depth = filter.depth ?? 1;
    // 図に入れるコンポーネント (起点と、depth 段の子)
    const included = new Set<string>();
    let frontier = starts.filter((name) => bundles.has(name));
    for (let level = 0; frontier.length; level++) {
        for (const name of frontier) included.add(name);
        if (level >= depth) break;
        frontier = frontier
            .flatMap((name) => bundles.get(name)!.children)
            .filter((name) => bundles.has(name) && !included.has(name));
    }

    const nodes = new Map<string, EventFlowNode>();
    const edges: EventFlowEdge[] = [];
    const edgeKeys = new Set<string>();
    const node = (id: string, properties: Omit<EventFlowNode, 'id'>) => {
        if (!nodes.has(id)) nodes.set(id, { id, ...properties });
        return id;
    };
    const edge = (from: string, to: string, kind: EventFlowEdge['kind'], label?: string) => {
        const key = `${from}|${to}|${kind}|${label ?? ''}`;
        if (edgeKeys.has(key)) return;
        edgeKeys.add(key);
        edges.push({ from, to, kind, ...(label ? { label } : {}) });
    };

    for (const name of included) {
        const flow = bundles.get(name)!;
        const handlerId = (member: string) =>
            node(`${name}:handler:${member}`, {
                kind: 'handler',
                label: `${member}()`,
                component: name,
            });
        /** ハンドラーから先 (自分のメソッド・Apex・イベントなど) をたどる */
        const visited = new Set<string>();
        const follow = (member: string) => {
            if (visited.has(member)) return;
            visited.add(member);
            const from = handlerId(member);
            for (const { calls, thisCalls } of flow.members.get(member) ?? []) {
                for (const callee of thisCalls) {
                    if (!flow.members.has(callee) || callee === member) continue;
                    edge(from, handlerId(callee), 'flow');
                    follow(callee);
                }
                for (const call of calls.calls) {
                    switch (call.callType) {
                        case 'apex': {
                            const apex = call.apex
                                ? `${call.apex.className}.${call.apex.methodName}`
                                : call.target;
                            edge(
                                from,
                                node(`apex:${apex}`, { kind: 'apex', label: apex }),
                                'data',
                                '呼び出し',
                            );
                            break;
                        }
                        case 'refreshApex':
                            edge(
                                from,
                                node(`${name}:refresh`, {
                                    kind: 'refresh',
                                    label: 'refreshApex',
                                    component: name,
                                }),
                                'data',
                            );
                            break;
                        case 'navigate': {
                            const pageType = call.navigation?.pageType;
                            edge(
                                from,
                                node(`${name}:navigate:${pageType ?? ''}`, {
                                    kind: 'navigate',
                                    label: `画面の遷移${pageType ? ` (${pageType})` : ''}`,
                                    component: name,
                                }),
                                'flow',
                            );
                            break;
                        }
                        case 'messageService':
                            if (call.target === 'publish') {
                                edge(
                                    from,
                                    node(`${name}:message`, {
                                        kind: 'message',
                                        label: 'メッセージの発行 (publish)',
                                        component: name,
                                    }),
                                    'event',
                                );
                            }
                            break;
                        case 'listener': {
                            // addEventListener('resize', this.handleReload) の this.handleReload を、イベントの線でつなぐ
                            if (call.listener !== 'add') break;
                            for (const callee of thisReferencesIn(call.args)) {
                                if (!flow.members.has(callee)) continue;
                                edge(
                                    from,
                                    handlerId(callee),
                                    'event',
                                    call.target
                                        ? `${call.target} (addEventListener)`
                                        : 'addEventListener',
                                );
                                follow(callee);
                            }
                            break;
                        }
                        default:
                            break;
                    }
                }
                for (const event of calls.events) {
                    if (!event.dispatched) continue;
                    if (event.eventClass === 'ShowToastEvent') {
                        const title = literal(event.toast?.title);
                        edge(
                            from,
                            node(`${name}:toast:${title ?? ''}`, {
                                kind: 'toast',
                                label: `トースト${title ? `: ${title}` : ''}`,
                                component: name,
                            }),
                            'flow',
                        );
                    } else {
                        edge(
                            from,
                            node(`${name}:event:${event.name}`, {
                                kind: 'event',
                                label: `イベント ${event.name}`,
                                component: name,
                            }),
                            'event',
                            '発行',
                        );
                    }
                }
            }
        };
        // 起点: テンプレートのイベント
        for (const action of flow.actions) {
            const id = node(`${name}:action:${action.tag}:${action.event}:${action.handler}`, {
                kind: 'action',
                label: `<${action.tag}> ${action.event}`,
                component: name,
            });
            edge(id, handlerId(action.handler), 'flow');
            follow(action.handler);
            // 子が発行するイベント → 親のテンプレートの on<イベント>
            if (action.child && included.has(action.child)) {
                edge(
                    node(`${action.child}:event:${action.event}`, {
                        kind: 'event',
                        label: `イベント ${action.event}`,
                        component: action.child,
                    }),
                    id,
                    'event',
                    '親へ',
                );
            }
        }
        // 起点: @wire (Apex のアダプターなら Apex の箱から)
        for (const wire of flow.wires) {
            const id = node(`${name}:wire:${wire.member}`, {
                kind: 'wire',
                label: `@wire ${wire.adapter} → ${wire.member}`,
                component: name,
            });
            if (wire.apex)
                edge(
                    node(`apex:${wire.apex}`, { kind: 'apex', label: wire.apex }),
                    id,
                    'data',
                    '@wire',
                );
            if (wire.isMethod) {
                edge(id, handlerId(wire.member), 'data', 'データ');
                follow(wire.member);
            }
        }
        // 起点: 表示のとき (connectedCallback など)
        for (const [member, label] of LIFECYCLE) {
            if (!flow.members.has(member)) continue;
            const id = node(`${name}:lifecycle:${member}`, {
                kind: 'lifecycle',
                label: `${label} (${member})`,
                component: name,
            });
            edge(id, handlerId(member), 'flow');
            follow(member);
        }
    }
    return {
        components: [...included],
        nodes: [...nodes.values()],
        edges,
    };
};
