// LWC の JSON 生成層で共通の部品 (Apex の types/apex/commons/node.ts に当たる)。
// 入力は IR v2 (lwc_IR) のノード。ソースの文字列はノードの位置 (getSpan) から読み、
// JSON を作る段階でキー (sourceKeys) とソース位置の一覧 (sourceObject) を作る (docs/ir-integration.md 3.2)。
// v2 の木にはエラーのノードがないので、v1 の convertLwcValue のような、部分木のエラーを調べる処理はない
import type { ConvertKeys } from '../commons/json';
import type { TypeField } from '../commons/ir';
import { hash } from '../commons/utils';
import { LwcCommonTypeClass } from '../lwc_IR/commonVisitor';

import type { LwcSourceJson } from './bundle';

/** IR v2 の、任意のノード */
export type LwcNode = LwcCommonTypeClass<string, TypeField<string>>;

export const isLwcNode = (value: unknown): value is LwcNode => value instanceof LwcCommonTypeClass;

/**
 * JSON を作るときの情報。ファイルごとに 1 つ作る。
 * keysOf でノードの sourceKeys を作り、そのノードのソース位置を sourceObject に登録する
 * (JSON で使ったノードの位置だけが残るので、Apex の regenerateSourceObjects に当たる処理は要らない)
 */
export class LwcJsonContext {
    readonly filePath: string;
    private keys = new WeakMap<object, ConvertKeys>();
    private sourceObjects = new Map<string, LwcSourceJson>();

    constructor(filePath: string) {
        this.filePath = filePath;
    }

    /** ノードのソースの文字列 */
    textOf(node: LwcNode): string {
        return node.getSpan().context;
    }

    /**
     * ノードの sourceKeys。objectKey は IR のキー (内容のハッシュ。位置に依らない)。
     * sourceKey は位置とファイルのパスのハッシュ (バンドルの中の別のファイルの同じ位置と区別するため、パスを含める)
     */
    keysOf(node: LwcNode): ConvertKeys {
        const cached = this.keys.get(node);
        if (cached) {
            return cached;
        }
        const { context, start, end } = node.getSpan();
        const position = { start, end, filePath: this.filePath };
        const keys: ConvertKeys = {
            objectKey: node.getSourceKeys().objectKey,
            sourceKey: `${node.kind}_${hash(position)}`,
        };
        this.keys.set(node, keys);

        const sourceObject = this.sourceObjects.get(keys.objectKey);
        const source = { sourceKey: keys.sourceKey, ...position };
        if (!sourceObject) {
            this.sourceObjects.set(keys.objectKey, {
                objectKey: keys.objectKey,
                context,
                source: [source],
            });
        } else if (!sourceObject.source.some((s) => s.sourceKey === keys.sourceKey)) {
            sourceObject.source.push(source);
        }
        return keys;
    }

    /**
     * StructureJson の sourceKeys。base はノード自身、ほかは { JSON 側の名前: 子ノード }。
     * 子ノードがない (名前のないクラスなど) ときは、ノード全体の位置にする (v1 と同じ)
     */
    structureKeysOf<TKey extends string>(
        node: LwcNode,
        children: Readonly<Record<TKey, LwcNode | null | undefined>>,
    ): { base: ConvertKeys } & Record<TKey, ConvertKeys> {
        const base = this.keysOf(node);
        const sourceKeys: Record<string, ConvertKeys> = { base };
        for (const [name, child] of Object.entries<LwcNode | null | undefined>(children)) {
            sourceKeys[name] = child ? this.keysOf(child) : base;
        }
        return sourceKeys as { base: ConvertKeys } & Record<TKey, ConvertKeys>;
    }

    /** keysOf で登録したソース位置 */
    toSourceObjects(): LwcSourceJson[] {
        return [...this.sourceObjects.values()];
    }
}

/** 部分木のすべてのノード (前順で、自身を含む)。enter が false を返したノードの中には入らない */
export const walkNodes = (root: LwcNode, enter: (node: LwcNode) => boolean | void): void => {
    const walk = (node: LwcNode): void => {
        if (enter(node) === false) {
            return;
        }
        node.getChildNodes().forEach((child) => walk(child as LwcNode));
    };
    walk(root);
};

/** 式を包むノード (括弧・TS の型アサーション x as T / x! / <T>x / x satisfies T・Flow の型キャスト) */
const WRAPPER_TYPES = new Set([
    'parenthesizedExpression',
    'tSAsExpression',
    'tSSatisfiesExpression',
    'tSNonNullExpression',
    'tSTypeAssertion',
    'tSInstantiationExpression',
    'typeCastExpression',
]);

/** 式を包むノードを外した、中の式 */
export const unwrapExpression = (node: LwcNode): LwcNode => {
    let current = node;
    while (WRAPPER_TYPES.has(current.kind)) {
        const inner = (current.getFields() as { expression?: unknown }).expression;
        if (!isLwcNode(inner)) break;
        current = inner;
    }
    return current;
};

/** 名前 (Identifier / PrivateName / 文字列のキー)。それ以外 (計算されたキーなど) はソースの文字列 */
export const nameOf = (node: LwcNode, context: LwcJsonContext): string => {
    const fields = node.getFields() as Record<string, unknown>;
    switch (node.kind) {
        case 'identifier':
        case 'jSXIdentifier':
            return fields.name as string;
        case 'privateName': {
            const id = fields.id as LwcNode;
            return `#${id.kind === 'identifier' ? (id.getFields() as unknown as { name: string }).name : context.textOf(id)}`;
        }
        case 'stringLiteral':
            return fields.value as string;
        default:
            return context.textOf(node);
    }
};
