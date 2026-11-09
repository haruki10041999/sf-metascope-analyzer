// JSON 層が IR v2 (apex_IR_v2) のノードを読むときの道具 (docs/ir-v2-integration.md 3.1)。
// v2 の木にはエラーのノードがないので、v1 の convertValue / excludeError のような、部分木のエラーを調べる処理はない
import { ApexCommonTypeClass } from '../../apex_IR_v2/commonVisitor';
import { ConvertKeys, JsonType, makeJsonType } from '../../commons/json';
import type { TypeField } from '../../commons/ir';

export type ApexNode = ApexCommonTypeClass<string, TypeField<string>>;

/** ノードのキー (JSON の sourceKeys) */
export const keysOf = (node: ApexNode): ConvertKeys => {
    const { objectKey, sourceKey } = node.getSourceKeys();
    return { objectKey, sourceKey };
};

/** 子ノード (1 つ・配列) のキー。null は持たない */
const childKeysOf = (
    child: ApexNode | readonly ApexNode[] | null | undefined,
): ConvertKeys | ConvertKeys[] | null => {
    if (child === null || child === undefined) return null;
    if (Array.isArray(child)) return (child as readonly ApexNode[]).map(keysOf);
    return keysOf(child as ApexNode);
};

/**
 * StructureJson の sourceKeys。base はノード自身のキー、ほかは { JSON 側の名前: 子ノード }。
 * 子ノードが null のものは持たない (v1 の convertValue の record と同じ)
 */
export const structureKeysOf = <
    TRecord extends Record<string, ConvertKeys | ConvertKeys[]> = Record<
        string,
        ConvertKeys | ConvertKeys[]
    >,
>(
    node: ApexNode,
    children: Readonly<Record<string, ApexNode | readonly ApexNode[] | null | undefined>> = {},
): { base: ConvertKeys } & TRecord => {
    const sourceKeys: Record<string, ConvertKeys | ConvertKeys[]> = { base: keysOf(node) };
    for (const [name, child] of Object.entries(children)) {
        const keys = childKeysOf(child);
        if (keys !== null) {
            sourceKeys[name] = keys;
        }
    }
    return sourceKeys as { base: ConvertKeys } & TRecord;
};

// union の各要素ごとに Omit する
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** ノードのキーを持つ JsonType を作る (makeJsonType の、キーをノードから取る形) */
export const makeNodeJson = <T extends JsonType<string>>(
    kind: T['kind'],
    node: ApexNode,
    properties: DistributiveOmit<T, 'kind' | 'sourceKeys'> = {} as DistributiveOmit<
        T,
        'kind' | 'sourceKeys'
    >,
): T => makeJsonType<string, T>(kind, keysOf(node), properties);
