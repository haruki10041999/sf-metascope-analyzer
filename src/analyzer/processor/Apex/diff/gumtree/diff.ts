import {
    JsonNode,
    Match,
    OptionalDiff,
    ValueDiff,
    lcs,
    makeOptionalDiff,
    makeValueDiff,
    toBody,
} from '../commons';
import { Mappings } from './matcher';
import { DiffFieldValue, DiffNodeValue, GumTreeNode, preOrder } from './tree';

// 方針: docs/apex-gumtree-diff.md 5 章

/** 移動元。移動したノードは移動先に 1 回だけ出し、移動元をここに持つ */
export type MovedFrom = {
    parent: string;
    index: number;
    parentSourceKeys?: JsonNode['sourceKeys'];
};

export type GumTreeFieldDiff<T extends DiffFieldValue = DiffFieldValue> = OptionalDiff<
    T,
    ValueDiff<T>
>;

type PrimitiveKeys<T> = T extends object
    ? {
          [K in keyof T]-?: Exclude<T[K], undefined> extends DiffFieldValue ? K : never;
      }[keyof T]
    : never;

export type GumTreeFields<T> = T extends object
    ? Partial<{
          [K in PrimitiveKeys<T>]: GumTreeFieldDiff<
              Exclude<T[K & keyof T], undefined> & DiffFieldValue
          >;
      }> &
          Record<string, GumTreeFieldDiff>
    : Record<string, GumTreeFieldDiff>;

type DiffValue<T> = T extends JsonNode ? Omit<T, 'kind' | 'sourceKeys'> : T;

export type GumTreeDiff<TValue extends DiffNodeValue = DiffNodeValue> = {
    label: string;
    role: string;
    sourceKeys: { before?: JsonNode['sourceKeys']; after?: JsonNode['sourceKeys'] };
    index: { before?: number; after?: number };
} & (
    | { status: 'unchanged'; match: Match; value: DiffValue<TValue> }
    | { status: 'moved'; match: Match; value: DiffValue<TValue>; from: MovedFrom }
    | {
          status: 'changed';
          match: Match;
          moved?: MovedFrom;
          fields: GumTreeFields<TValue>;
          children: GumTreeDiff[];
      }
    | { status: 'removed'; value: DiffValue<TValue> }
    // 移動してきた子孫を含む追加は、children に子の差分を持つ
    | { status: 'added'; value: DiffValue<TValue>; children?: GumTreeDiff[] }
);

export type GumTreeDiffOf<TValue extends DiffNodeValue> = GumTreeDiff<TValue>[];

const makeSourceKeys = (before: GumTreeNode | undefined, after: GumTreeNode | undefined) => ({
    ...(before?.source ? { before: before.source.sourceKeys } : {}),
    ...(after?.source ? { after: after.source.sourceKeys } : {}),
});

const getValue = <TValue extends DiffNodeValue>(node: GumTreeNode): DiffValue<TValue> =>
    (node.source ? toBody(node.source) : node.raw) as DiffValue<TValue>;

const getMovedFrom = (node: GumTreeNode): MovedFrom => {
    const parent = node.parent!;
    return {
        parent: parent.label,
        index: parent.children.indexOf(node),
        ...(parent.source ? { parentSourceKeys: parent.source.sourceKeys } : {}),
    };
};

const makeFields = (before: GumTreeNode, after: GumTreeNode): Record<string, GumTreeFieldDiff> => {
    const keys = [...new Set([...Object.keys(before.values), ...Object.keys(after.values)])];
    return Object.fromEntries(
        keys.map((key) => [
            key,
            makeOptionalDiff(before.values[key], after.values[key], makeValueDiff),
        ]),
    );
};

/** GumTree の対応から、根 (block) の子の差分を作る */
export const makeGumTreeDiff = <TValue extends DiffNodeValue = DiffNodeValue>(
    root1: GumTreeNode,
    root2: GumTreeNode,
    mappings: Mappings,
): GumTreeDiff<TValue>[] => {
    const { src, dst } = mappings;

    /** 対応付いた組の部分木が、すべて同じ位置どうしで対応しているか */
    const isIdentical = (t1: GumTreeNode, t2: GumTreeNode) => {
        if (t1.hash !== t2.hash) {
            return false;
        }
        const nodes2 = preOrder(t2);
        return preOrder(t1).every((n1, index) => src.get(n1) === nodes2[index]);
    };

    const hasMappedDescendant = (node: GumTreeNode) =>
        preOrder(node).some((n) => n !== node && dst.has(n));

    const makeMappedDiff = (
        t1: GumTreeNode,
        t2: GumTreeNode,
        index: { before: number; after: number },
        from: MovedFrom | undefined,
    ): GumTreeDiff<TValue> => {
        const base = {
            label: t2.label,
            role: t2.role,
            sourceKeys: makeSourceKeys(t1, t2),
            index,
        };
        const match = mappings.match.get(t1) ?? 'identical';

        if (isIdentical(t1, t2)) {
            return from
                ? { ...base, status: 'moved', match, value: getValue(t2), from }
                : { ...base, status: 'unchanged', match, value: getValue(t2) };
        }

        return {
            ...base,
            status: 'changed',
            match,
            ...(from ? { moved: from } : {}),
            fields: makeFields(t1, t2) as GumTreeFields<TValue>,
            children: makeChildrenDiff(t1, t2),
        };
    };

    const makeAddedDiff = (t2: GumTreeNode, index: number): GumTreeDiff<TValue> => {
        const base = {
            label: t2.label,
            role: t2.role,
            sourceKeys: makeSourceKeys(undefined, t2),
            index: { after: index },
        };
        if (!hasMappedDescendant(t2)) {
            return { ...base, status: 'added', value: getValue(t2) };
        }
        return {
            ...base,
            status: 'added',
            value: getValue(t2),
            children: t2.children.map((c2, i) => {
                const c1 = dst.get(c2);
                return c1
                    ? makeMappedDiff(
                          c1,
                          c2,
                          { before: c1.parent!.children.indexOf(c1), after: i },
                          getMovedFrom(c1),
                      )
                    : makeAddedDiff(c2, i);
            }),
        };
    };

    const makeRemovedDiff = (t1: GumTreeNode, index: number): GumTreeDiff<TValue> => ({
        label: t1.label,
        role: t1.role,
        sourceKeys: makeSourceKeys(t1, undefined),
        index: { before: index },
        status: 'removed',
        value: getValue(t1),
    });

    /**
     * 子の差分。after の順に並べ、removed は before で直前にあった兄弟 (同じ親の中で対応しているもの) の後ろに置く。
     * 同じ親の中で対応した子は、順序のある親なら LCS に入らなかったものを moved にする。
     */
    const makeChildrenDiff = (t1: GumTreeNode, t2: GumTreeNode): GumTreeDiff[] => {
        const inPlace1 = t1.children.filter((c1) => src.get(c1)?.parent === t2);
        const inPlace2 = t2.children.filter((c2) => dst.get(c2)?.parent === t1);
        const beforeOrder = inPlace1.map((c) => String(c.id));
        const afterOrder = inPlace2.map((c) => String(dst.get(c)!.id));
        const kept = new Set(
            t1.ordered ? lcs(beforeOrder, afterOrder).map(([i]) => beforeOrder[i]!) : beforeOrder,
        );

        const entries: { key: [number, number, number]; diff: GumTreeDiff }[] = [];

        t2.children.forEach((c2, j) => {
            const c1 = dst.get(c2);
            if (!c1) {
                entries.push({ key: [j, 0, 0], diff: makeAddedDiff(c2, j) });
                return;
            }
            const index = { before: c1.parent!.children.indexOf(c1), after: j };
            const from = c1.parent === t1 && kept.has(String(c1.id)) ? undefined : getMovedFrom(c1);
            entries.push({ key: [j, 0, 0], diff: makeMappedDiff(c1, c2, index, from) });
        });

        t1.children.forEach((c1, i) => {
            if (src.has(c1)) {
                // 同じ親の中で対応したもの、または移動先に出すもの
                return;
            }
            let anchor = -1;
            for (let k = i - 1; k >= 0; k--) {
                const partner = src.get(t1.children[k]!);
                if (partner && partner.parent === t2) {
                    anchor = t2.children.indexOf(partner);
                    break;
                }
            }
            entries.push({ key: [anchor, 1, i], diff: makeRemovedDiff(c1, i) });
        });

        return entries
            .sort((a, b) => a.key[0] - b.key[0] || a.key[1] - b.key[1] || a.key[2] - b.key[2])
            .map((e) => e.diff);
    };

    return makeChildrenDiff(root1, root2) as GumTreeDiff<TValue>[];
};
