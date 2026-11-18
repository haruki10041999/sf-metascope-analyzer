import type { ApexUnitParseResult } from '../parser/Apex/unit';
import { unitInfoOf } from './apex';
import { sourceTextsOf } from './apexFlow';
import type { CallSequence, CallSequenceMessage, MetadataSnapshot, SnapshotInput } from './types';

// apex.callFlow: メソッド (・トリガー) から、呼び出しをクラスをまたいでたどったシーケンス図 (docs/todo.md 3.2.1 の 5)。
// 呼び出し・SOQL / SOSL・DML・非同期の開始・外部の呼び出し・イベントの発行を、ソースの順に並べる。
// リポジトリにあるクラスのメソッドを呼べば、その中を depth 段までたどる (再帰はたどらない)。
// SOQL・DML は Database へのメッセージにする。標準のメソッドの呼び出し (String.valueOf・List.add など) は出さない

export type ApexCallFlowFilter = {
    classes?: string[];
    /** 起点のメソッド (name か Owner.name。トリガーはトリガーの名前) */
    members?: string[];
    /** たどる段数 (既定 3) */
    depth?: number;
};

/** 1 つの図のメッセージの上限 (超えたら切って truncated を付ける) */
const MAX_MESSAGES = 300;

/** メンバーの中の出来事 (ソースの順に並べるため offset を持つ) */
type Item = {
    offset: number;
    line?: number;
    kind: CallSequenceMessage['kind'];
    /** 呼び出し先の参加者 (クラス・Database など) */
    to: string;
    label: string;
    inLoop: boolean;
    /** たどる先のメンバー (リポジトリのメソッドを呼ぶとき) */
    target?: string;
};

type MemberIndex = {
    /** Owner.method → 出来事 (ソースの順) */
    items: Map<string, Item[]>;
    /** 起点にできるメンバー (クラスの名前・持ち主・名前) */
    members: { unit: string; owner: string; name: string; key: string }[];
};

/** スナップショットごとの索引 (provider を呼ぶたびに作り直さない) */
const indexes = new WeakMap<object, MemberIndex>();

const indexOf = (snapshot: MetadataSnapshot): MemberIndex => {
    const cached = indexes.get(snapshot);
    if (cached) return cached;
    const units = (snapshot.apex ?? []).filter(
        (r) => r.dataType === 'apexUnit' && r.result.base,
    ) as ApexUnitParseResult[];
    /** リポジトリにある型 (クラスと内側のクラス。小文字) → 正しい書き方 */
    const types = new Map<string, string>();
    const members = new Set<string>();
    const index: MemberIndex = { items: new Map(), members: [] };
    const infos = units.map((result) => ({ result, info: unitInfoOf(result) }));
    for (const { result, info } of infos) {
        const unit = result.result.base.name;
        types.set(unit.toLowerCase(), unit);
        const contexts = [
            ...info.calls.map((c) => c.context.member),
            ...info.dml.map((d) => d.context.member),
            ...info.queries.map((q) => q.context.member),
        ];
        for (const member of contexts) {
            if (!member) continue;
            members.add(member.toLowerCase());
            const owner = member.slice(0, member.lastIndexOf('.'));
            if (owner) types.set(owner.toLowerCase(), owner);
        }
    }
    const resolveType = (owner: string, from: string): string | undefined => {
        // 内側のクラスは、外側のクラスの中から短い名前で呼べる (Handler → AccountService.Handler)
        const outer = from.split('.')[0]!;
        return types.get(`${outer}.${owner}`.toLowerCase()) ?? types.get(owner.toLowerCase());
    };
    for (const { result, info } of infos) {
        const unit = result.result.base.name;
        const sources = sourceTextsOf(result);
        const where = (keys: { sourceKey?: string }) => {
            const source = keys.sourceKey ? sources.get(keys.sourceKey) : undefined;
            return source ? { offset: source.offset, line: source.line } : { offset: 0 };
        };
        const push = (member: string | undefined, item: Item) => {
            // トリガーの本体はトリガーの名前
            const key = member ?? unit;
            if (!index.items.has(key)) index.items.set(key, []);
            index.items.get(key)!.push(item);
        };
        for (const call of info.calls) {
            const from = call.context.member ?? unit;
            const inLoop = call.context.loopDepth > 0;
            const base = { ...where(call.sourceKeys), inLoop };
            switch (call.callType) {
                case 'method': {
                    if (!call.owner) break;
                    const owner = resolveType(call.owner, from);
                    // リポジトリにないクラス (標準のクラス・SObject の変数) の呼び出しは出さない
                    if (!owner) break;
                    const target = `${owner}.${call.method}`;
                    push(call.context.member, {
                        ...base,
                        kind: 'call',
                        to: owner,
                        label: `${call.method}()`,
                        ...(members.has(target.toLowerCase()) ? { target } : {}),
                    });
                    break;
                }
                case 'async':
                    push(call.context.member, {
                        ...base,
                        kind: 'async',
                        to: call.owner ?? 'System',
                        label: `${call.method}()`,
                    });
                    break;
                case 'callout':
                    push(call.context.member, {
                        ...base,
                        kind: 'callout',
                        to: 'Http',
                        label: 'send()',
                    });
                    break;
                case 'publish':
                    push(call.context.member, {
                        ...base,
                        kind: 'publish',
                        to: 'EventBus',
                        label: 'publish()',
                    });
                    break;
                default:
                    // DML・動的なクエリは dml・queries の方で出す。assert・debug・this(...) は出さない
                    break;
            }
        }
        for (const dml of info.dml) {
            push(dml.context.member, {
                ...where(dml.sourceKeys),
                inLoop: dml.context.loopDepth > 0,
                kind: 'dml',
                to: 'Database',
                label: `${dml.operation}${dml.object ? ` ${dml.object}` : ''}`,
            });
        }
        for (const query of info.queries) {
            push(query.context.member, {
                ...where(query.sourceKeys),
                inLoop: query.context.loopDepth > 0,
                kind: 'query',
                to: 'Database',
                label: `${query.language === 'sosl' ? 'FIND' : query.language === 'dynamic' ? 'query' : 'SELECT'}${query.objects.length ? ` ${query.objects.join(', ')}` : ''}`,
            });
        }
        // 起点にできるメンバー (呼び出し・SOQL・DML のあるメソッドとトリガー)
        index.members.push(
            ...[
                ...new Set(
                    [...info.calls, ...info.dml, ...info.queries].map(
                        (x) => x.context.member ?? unit,
                    ),
                ),
            ].map((key) => ({
                unit,
                owner:
                    key === unit && !key.includes('.') ? unit : key.slice(0, key.lastIndexOf('.')),
                name: key.includes('.') ? key.slice(key.lastIndexOf('.') + 1) : key,
                key,
            })),
        );
    }
    for (const items of index.items.values()) items.sort((a, b) => a.offset - b.offset);
    indexes.set(snapshot, index);
    return index;
};

/**
 * apex.callFlow: 起点のメソッドから呼び出しをたどったシーケンス図 (起点ごとに 1 つ)。
 * classes・members で起点を絞る (既定はすべてのメソッド)
 */
export const getApexCallFlows = (
    input: SnapshotInput,
    filter: ApexCallFlowFilter = {},
): CallSequence[] => {
    const index = indexOf(input.after);
    const depth = filter.depth ?? 3;
    const starts = index.members
        .filter((m) => !filter.classes || filter.classes.includes(m.unit))
        .filter(
            (m) =>
                !filter.members ||
                filter.members.includes(m.name) ||
                filter.members.includes(m.key),
        )
        .sort((a, b) => a.key.localeCompare(b.key));
    // メッセージのない起点 (this(...) だけのコンストラクターなど) は出さない
    return starts.flatMap((start): CallSequence[] => {
        const participants: string[] = [start.owner];
        const messages: CallSequenceMessage[] = [];
        let truncated = false;
        const participant = (name: string) => {
            if (!participants.includes(name)) participants.push(name);
            return name;
        };
        const walk = (key: string, from: string, level: number, stack: string[]) => {
            for (const item of index.items.get(key) ?? []) {
                if (messages.length >= MAX_MESSAGES) {
                    truncated = true;
                    return;
                }
                const recursive = item.target !== undefined && stack.includes(item.target);
                messages.push({
                    from,
                    to: participant(item.to),
                    label: recursive ? `${item.label} (再帰)` : item.label,
                    kind: item.kind,
                    depth: level,
                    ...(item.line !== undefined ? { line: item.line } : {}),
                    ...(item.inLoop ? { inLoop: true } : {}),
                });
                if (item.target && !recursive && level < depth) {
                    walk(item.target, item.to, level + 1, [...stack, item.target]);
                }
            }
        };
        walk(start.key, start.owner, 1, [start.key]);
        if (messages.length === 0) return [];
        return [
            {
                start: start.key,
                unit: start.unit,
                participants,
                messages,
                ...(truncated ? { truncated: true } : {}),
            },
        ];
    });
};
