// JSON 層が IR v2 (apex_IR) のノードを読むときの道具 (docs/ir-integration.md 3.1)。
// v2 の木にはエラーのノードがないので、v1 の convertValue / excludeError のような、部分木のエラーを調べる処理はない
import { ApexCommonTypeClass } from '../../apex_IR/commonVisitor';
import { ConvertKeys, JsonType, makeContentKeyedJson, makeJsonType } from '../../commons/json';
import type { TypeField } from '../../commons/ir';

export type ApexNode = ApexCommonTypeClass<string, TypeField<string>>;

/** ノードのキー (JSON の sourceKeys) */
export const keysOf = (node: ApexNode): ConvertKeys => {
    const { objectKey, sourceKey } = node.getSourceKeys();
    return { objectKey, sourceKey };
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

/**
 * IR に対応するノードがない JSON (DISTANCE の引数・FORMULA の左辺・FIND の検索語・修飾子の一覧など) の
 * JsonType を作る (docs/plan.md 4.2)。
 * - sourceKey: いちばん近い IR のノード (node) のもの。位置はそのノードの位置になる
 *   (位置の一覧は、絞り込むときに sourceKey で元のノードの位置を借りる。commons/source.ts)
 * - objectKey: このノード自身の中身から作る (`<kind>_<hash>`)。借りたノードの objectKey からは作らない。
 *   借りたノード (修飾子なら持ち主のメソッド) の中身が変わっても、このノードの中身が同じなら同じキーにするため
 */
export const makeDerivedNodeJson = <T extends JsonType<string>>(
    kind: T['kind'],
    node: ApexNode,
    properties: DistributiveOmit<T, 'kind' | 'sourceKeys'> = {} as DistributiveOmit<
        T,
        'kind' | 'sourceKeys'
    >,
): T => makeContentKeyedJson<T>(kind, keysOf(node).sourceKey, properties);
