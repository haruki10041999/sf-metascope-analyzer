import { SourceDistance, compareSourceDistance } from '../../source';

import { Match, lcs } from '../commons';
import { GumTreeNode, descendants, postOrder, preOrder } from './tree';

// 方針: docs/apex-gumtree-diff.md 2 章

export type MatchOptions = {
    /** Top-down で対応付ける部分木の最小の高さ */
    minHeight?: number;
    /** Bottom-up で対応付ける dice 係数の下限 */
    minDice?: number;
    /** Top-down で同形の候補が複数あるときに使う、ソース位置の距離 */
    distance?:
        ((before: GumTreeNode, after: GumTreeNode) => SourceDistance | undefined) | undefined;
};

export const DEFAULT_MIN_HEIGHT = 2;
export const DEFAULT_MIN_DICE = 0.5;

/** before (src) と after (dst) のノードの対応 */
export type Mappings = {
    src: Map<GumTreeNode, GumTreeNode>;
    dst: Map<GumTreeNode, GumTreeNode>;
    match: Map<GumTreeNode, Match>;
};

/**
 * GumTree で 2 つの木のノードを対応付ける。根同士は宣言の対応で決まっているので最初に対応付ける。
 * 1. Top-down: 高さの大きい順に同形 (hash が同じ) の部分木を対応付ける
 * 2. Bottom-up: 対応のない内側のノードを、対応済みの子孫を多く共有する同じラベルのノードと対応付ける
 * 3. Recovery: 対応付いた組の中で、まだ対応のない子同士を対応付ける
 * 4. 残った実ノードのうち、同じ内容が両方の木に 1 つずつしかないものを対応付ける (移動した小さな部分木)
 */
export const matchTrees = (
    root1: GumTreeNode,
    root2: GumTreeNode,
    options: MatchOptions = {},
): Mappings => {
    const { minHeight = DEFAULT_MIN_HEIGHT, minDice = DEFAULT_MIN_DICE, distance } = options;
    const mappings: Mappings = { src: new Map(), dst: new Map(), match: new Map() };
    const { src, dst } = mappings;

    const descendantsCache = new Map<GumTreeNode, GumTreeNode[]>();
    const getDescendants = (node: GumTreeNode) => {
        let cached = descendantsCache.get(node);
        if (!cached) {
            cached = descendants(node);
            descendantsCache.set(node, cached);
        }
        return cached;
    };

    const add = (t1: GumTreeNode, t2: GumTreeNode, match: Match) => {
        src.set(t1, t2);
        dst.set(t2, t1);
        mappings.match.set(t1, match);
    };

    /** 同じ形の部分木を前順で対応付ける。すでに対応のあるノードは飛ばす */
    const addRecursively = (t1: GumTreeNode, t2: GumTreeNode, match: Match) => {
        const nodes1 = preOrder(t1);
        const nodes2 = preOrder(t2);
        nodes1.forEach((n1, index) => {
            const n2 = nodes2[index];
            if (n2 && !src.has(n1) && !dst.has(n2)) {
                add(n1, n2, match);
            }
        });
    };

    const dice = (t1: GumTreeNode | undefined, t2: GumTreeNode | undefined): number => {
        if (!t1 || !t2) {
            return 0;
        }
        const d1 = getDescendants(t1);
        const d2 = new Set(getDescendants(t2));
        const total = d1.length + d2.size;
        if (total === 0) {
            return 0;
        }
        const common = d1.filter((d) => {
            const partner = src.get(d);
            return partner !== undefined && d2.has(partner);
        }).length;
        return (2 * common) / total;
    };

    // -----------------------------------------------------------------------
    // 1. Top-down
    // -----------------------------------------------------------------------

    const topDown = () => {
        let list1 = [...root1.children];
        let list2 = [...root2.children];
        const candidates: [GumTreeNode, GumTreeNode][] = [];

        const peekMax = (list: GumTreeNode[]) => Math.max(0, ...list.map((n) => n.height));
        const pop = (list: GumTreeNode[], height: number) => ({
            popped: list.filter((n) => n.height === height),
            rest: list.filter((n) => n.height !== height),
        });

        for (;;) {
            const h1 = peekMax(list1);
            const h2 = peekMax(list2);
            if (Math.min(h1, h2) < minHeight) {
                break;
            }

            if (h1 !== h2) {
                // 高いほうだけを開く
                if (h1 > h2) {
                    const { popped, rest } = pop(list1, h1);
                    list1 = [...rest, ...popped.flatMap((n) => n.children)];
                } else {
                    const { popped, rest } = pop(list2, h2);
                    list2 = [...rest, ...popped.flatMap((n) => n.children)];
                }
                continue;
            }

            const { popped: nodes1, rest: rest1 } = pop(list1, h1);
            const { popped: nodes2, rest: rest2 } = pop(list2, h2);
            const count1 = countBy(nodes1, (n) => n.hash);
            const count2 = countBy(nodes2, (n) => n.hash);
            const used1 = new Set<GumTreeNode>();
            const used2 = new Set<GumTreeNode>();

            nodes1.forEach((t1) => {
                const sameHash = nodes2.filter((t2) => t2.hash === t1.hash);
                if (sameHash.length === 0) {
                    return;
                }
                used1.add(t1);
                sameHash.forEach((t2) => used2.add(t2));
                if (count1.get(t1.hash) === 1 && count2.get(t1.hash) === 1) {
                    addRecursively(t1, sameHash[0]!, 'identical');
                } else {
                    sameHash.forEach((t2) => candidates.push([t1, t2]));
                }
            });

            list1 = [...rest1, ...nodes1.filter((n) => !used1.has(n)).flatMap((n) => n.children)];
            list2 = [...rest2, ...nodes2.filter((n) => !used2.has(n)).flatMap((n) => n.children)];
        }

        // 同形の候補が複数あるもの: 親同士の dice → ソース位置の距離 → 出現順 で選ぶ
        const scored = candidates.map(([t1, t2]) => ({
            t1,
            t2,
            dice: dice(t1.parent, t2.parent),
            distance: distance?.(t1, t2),
        }));
        scored.sort(
            (a, b) =>
                b.dice - a.dice ||
                (a.distance && b.distance ? compareSourceDistance(a.distance, b.distance) : 0) ||
                Math.abs(a.t1.id - a.t2.id) - Math.abs(b.t1.id - b.t2.id) ||
                a.t1.id - b.t1.id,
        );
        scored.forEach(({ t1, t2 }) => {
            if (!src.has(t1) && !dst.has(t2)) {
                addRecursively(t1, t2, 'identical');
            }
        });
    };

    // -----------------------------------------------------------------------
    // 3. Recovery (simple)
    // -----------------------------------------------------------------------

    /** まだ対応のない子同士を、キーが同じもので組にする。順序のない親では位置を見ずに組にする */
    const matchChildren = (
        s: GumTreeNode,
        d: GumTreeNode,
        getKey: (node: GumTreeNode) => string,
        onMatch: (t1: GumTreeNode, t2: GumTreeNode) => void,
    ) => {
        const unmatched1 = s.children.filter((c) => !src.has(c));
        const unmatched2 = d.children.filter((c) => !dst.has(c));

        if (s.ordered && d.ordered) {
            lcs(unmatched1.map(getKey), unmatched2.map(getKey)).forEach(([i, j]) =>
                onMatch(unmatched1[i]!, unmatched2[j]!),
            );
            return;
        }

        unmatched1.forEach((t1) => {
            const t2 = unmatched2.find((n) => !dst.has(n) && getKey(n) === getKey(t1));
            if (t2) {
                onMatch(t1, t2);
            }
        });
    };

    const recovery = (s: GumTreeNode, d: GumTreeNode) => {
        // a. 同形の子
        matchChildren(
            s,
            d,
            (n) => n.hash,
            (t1, t2) => addRecursively(t1, t2, 'identical'),
        );
        // b. 値だけが違う、形が同じ子。中は位置で対応付けず、下の再帰で同形のものから対応付ける
        matchChildren(
            s,
            d,
            (n) => n.structureHash,
            (t1, t2) => add(t1, t2, 'recovery'),
        );
        // c. ラベルが両側で 1 つずつしかない子
        const unmatched1 = s.children.filter((c) => !src.has(c));
        const unmatched2 = d.children.filter((c) => !dst.has(c));
        const labels1 = countBy(unmatched1, (n) => n.label);
        const labels2 = countBy(unmatched2, (n) => n.label);
        unmatched1.forEach((t1) => {
            if (labels1.get(t1.label) !== 1 || labels2.get(t1.label) !== 1) {
                return;
            }
            const t2 = unmatched2.find((n) => n.label === t1.label)!;
            add(t1, t2, 'recovery');
        });
        // d. 残りは、順序のある並びならラベルの LCS で組にする
        if (s.ordered && d.ordered) {
            matchChildren(
                s,
                d,
                (n) => n.label,
                (t1, t2) => add(t1, t2, 'recovery'),
            );
        }
        // 対応付いた子の組で中身が違うものに入る
        s.children.forEach((c1) => {
            const c2 = src.get(c1);
            if (c2 && c2.parent === d && c1.hash !== c2.hash) {
                recovery(c1, c2);
            }
        });
    };

    // -----------------------------------------------------------------------
    // 2. Bottom-up
    // -----------------------------------------------------------------------

    const getCandidates = (t1: GumTreeNode): GumTreeNode[] => {
        const candidates = new Set<GumTreeNode>();
        getDescendants(t1).forEach((d) => {
            let ancestor = src.get(d)?.parent;
            while (ancestor && ancestor !== root2) {
                if (ancestor.label === t1.label && !dst.has(ancestor)) {
                    candidates.add(ancestor);
                }
                ancestor = ancestor.parent;
            }
        });
        return [...candidates];
    };

    const bottomUp = () => {
        postOrder(root1).forEach((t1) => {
            if (t1 === root1 || src.has(t1) || t1.children.length === 0) {
                return;
            }

            let best: GumTreeNode | undefined;
            let bestDice = -1;
            getCandidates(t1).forEach((candidate) => {
                const score = dice(t1, candidate);
                if (score >= minDice && score > bestDice) {
                    best = candidate;
                    bestDice = score;
                }
            });

            if (best) {
                add(t1, best, t1.hash === best.hash ? 'identical' : 'similar');
                recovery(t1, best);
            }
        });
    };

    // -----------------------------------------------------------------------
    // 4. 一意な実ノード
    // -----------------------------------------------------------------------

    /**
     * まだ対応のない実ノード (JsonType / StructureJsonType) のうち、同じ hash が両方の木に 1 つずつしかないものを対応付ける。
     * minHeight 未満の小さな部分木 (`Trigger.isBefore` など) が別の式の中へ移動したものを拾うため
     */
    const matchUniqueNodes = () => {
        const nodes1 = preOrder(root1).filter((n) => n.source);
        const nodes2 = preOrder(root2).filter((n) => n.source);
        const count1 = countBy(nodes1, (n) => n.hash);
        const count2 = countBy(nodes2, (n) => n.hash);
        const unmatched2 = new Map(
            nodes2.filter((n) => !dst.has(n) && count2.get(n.hash) === 1).map((n) => [n.hash, n]),
        );

        nodes1.forEach((t1) => {
            const t2 = unmatched2.get(t1.hash);
            if (t2 && !src.has(t1) && !dst.has(t2) && count1.get(t1.hash) === 1) {
                addRecursively(t1, t2, 'identical');
            }
        });
    };

    add(root1, root2, 'slot');
    topDown();
    bottomUp();
    recovery(root1, root2);
    matchUniqueNodes();

    return mappings;
};

const countBy = <T>(items: T[], getKey: (item: T) => string): Map<string, number> => {
    const counts = new Map<string, number>();
    items.forEach((item) => {
        const key = getKey(item);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
};
