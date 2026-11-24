import { type JsonType, isJsonType } from '../../types';

// Apex / LWC / メタデータで共通の、JSON の木の走査 (docs/plan.md 5.1)。
// すべての子はノード (JsonType) なので (P1)、子の列挙では配列と値の木 (kind のないオブジェクト) の中だけを辿ればよい。
// 系統ごとのノードの共用体 (ApexNodeJson・LwcNodeJson・MetadataNodeJson) を N に渡すと、kind ごとのハンドラーで型が絞られる

type AnyNode = JsonType<string>;

/** 子のノード。値の木・辞書・配列の中も辿り、最初に出会ったノードで止まる (ノードの中は孫として扱う) */
export const childNodesOf = (node: AnyNode): AnyNode[] => {
    const children: AnyNode[] = [];
    const collect = (value: unknown): void => {
        if (Array.isArray(value)) {
            for (const item of value) collect(item);
            return;
        }
        if (value === null || typeof value !== 'object') return;
        if (isJsonType(value)) {
            children.push(value);
            return;
        }
        for (const item of Object.values(value)) collect(item);
    };
    for (const [key, value] of Object.entries(node)) {
        if (key !== 'sourceKeys') collect(value);
    }
    return children;
};

/** 走査の文脈 */
export type WalkContext<N extends AnyNode, S> = {
    /** 親の連鎖 (根から直接の親まで) */
    readonly parents: readonly N[];
    /** 直接の親 (根では undefined) */
    readonly parent: N | undefined;
    /** 呼び出し側の文脈 (ループの中・try・テストなど)。enter が返した値が子に引き継がれる */
    readonly state: S;
};

/**
 * enter の戻り値。
 * - 'skip': 子を辿らない (leave は呼ぶ)
 * - { state }: 子の文脈を変える (兄弟には引き継がない)
 */
export type WalkEnterResult<S> = void | 'skip' | { state: S };

/** ハンドラー。node は絞った型 (T)、文脈の親はどの kind でもありうるので共用体のまま (N) */
type Handler<N extends AnyNode, S, R, T extends AnyNode = N> = (
    node: T,
    context: WalkContext<N, S>,
) => R;

/**
 * kind ごとのハンドラーの表。
 * kind が Object の組み込みのプロパティと同じ名前 (Apex の constructor) のときは、
 * オブジェクトのリテラルが持つ組み込みの値も型の上で許す (実行時は表自身のプロパティだけを引く)
 */
export type WalkHandlerTable<N extends AnyNode, S, R> = {
    [K in N['kind']]?:
        | Handler<N, S, R, Extract<N, { kind: K }>>
        | (K extends keyof typeof Object.prototype ? (typeof Object.prototype)[K] : never);
};

/** 表自身が持つハンドラー (Object の組み込みのプロパティは引かない) */
const handlerOf = <H>(table: object | undefined, kind: string): H | undefined =>
    table && Object.hasOwn(table, kind) ? (table as Record<string, H>)[kind] : undefined;

export type WalkHandlers<N extends AnyNode, S> = {
    /** ノードに入るとき (kind ごと)。any より後に呼ぶ */
    enter?: WalkHandlerTable<N, S, WalkEnterResult<S>>;
    /** ノードから出るとき (kind ごと)。any より先に呼ぶ */
    leave?: WalkHandlerTable<N, S, void>;
    /** すべてのノードに入るとき */
    enterAny?: Handler<N, S, WalkEnterResult<S>>;
    /** すべてのノードから出るとき */
    leaveAny?: Handler<N, S, void>;
};

/**
 * 木を深さ優先で辿る。子の順は childNodesOf (プロパティの順)。
 * enterAny と kind ごとの enter のどちらかが 'skip' を返すと子を辿らない。
 * 両方が state を返したときは kind ごとの enter の値を使う
 */
export function walkJson<N extends AnyNode>(root: N, handlers: WalkHandlers<N, undefined>): void;
export function walkJson<N extends AnyNode, S>(
    root: N,
    handlers: WalkHandlers<N, S>,
    state: S,
): void;
export function walkJson<N extends AnyNode, S>(
    root: N,
    handlers: WalkHandlers<N, S>,
    state?: S,
): void {
    const parents: N[] = [];

    const visit = (node: N, current: S): void => {
        const context: WalkContext<N, S> = {
            parents: [...parents],
            parent: parents[parents.length - 1],
            state: current,
        };
        let skip = false;
        let next = current;
        for (const result of [
            handlers.enterAny?.(node, context),
            handlerOf<Handler<N, S, WalkEnterResult<S>>>(handlers.enter, node.kind)?.(
                node,
                context,
            ),
        ]) {
            if (result === 'skip') skip = true;
            else if (result) next = result.state;
        }
        if (!skip) {
            parents.push(node);
            for (const child of childNodesOf(node)) visit(child as N, next);
            parents.pop();
        }
        handlerOf<Handler<N, S, void>>(handlers.leave, node.kind)?.(node, context);
        handlers.leaveAny?.(node, context);
    };

    visit(root, state as S);
}
