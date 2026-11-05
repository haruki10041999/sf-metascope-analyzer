// LWC の JSON 生成層で共通の部品 (Apex の types/apex/commons に当たる)。
// 入力は converter の出力 (LwcXxxType。sourceInfo を持ったまま)。ソースの文字列は sourceInfo から読み、
// JSON を作る段階で sourceInfo を sourceKeys と sourceObject に分ける (Apex は makeConvertType で先に分ける)
import type { ErrorType } from '../commons/converter';
import { makeErrorJson, type ConvertKeys, type ErrorJson } from '../commons/json';
import { hash, isRecord, sortKeys } from '../commons/utils';

import type { LwcAnyNodeType, LwcSourceInfo } from './converter';
import type { LwcSourceJson } from './bundle';

/** converter の出力の、任意のノード (IR を作れなかったノード ErrorType を含む) */
// sourceInfo は、実行時はどれも LwcSourceInfo (ファイルのパスを持つ)
export type LwcConvertNode = LwcAnyNodeType | ErrorType;

const isConvertNode = (value: unknown): value is LwcConvertNode =>
    isRecord(value) && typeof value.type === 'string' && isRecord(value.sourceInfo);

/** ノードの内容 (sourceInfo を除き、子も同じく除いたもの)。objectKey の元。Apex の makeConvertType と同じ */
const contentOf = (value: unknown, cache: WeakMap<object, unknown>): unknown => {
    if (Array.isArray(value)) {
        return value.map((item) => contentOf(item, cache));
    }
    if (!isRecord(value)) {
        return value;
    }
    const cached = cache.get(value);
    if (cached !== undefined) {
        return cached;
    }
    const content = Object.fromEntries(
        Object.entries(value)
            .filter(([key]) => key !== 'sourceInfo')
            .map(([key, child]) => [key, contentOf(child, cache)]),
    );
    cache.set(value, content);
    return content;
};

/**
 * JSON を作るときの情報。ファイルごとに 1 つ作る。
 * keysOf でノードの sourceKeys を作り、そのノードのソース位置を sourceObject に登録する
 * (JSON で使ったノードの位置だけが残るので、Apex の regenerateSourceObjects に当たる処理は要らない)
 */
export class LwcJsonContext {
    readonly filePath: string;
    private contents = new WeakMap<object, unknown>();
    private keys = new WeakMap<object, ConvertKeys>();
    private sourceObjects = new Map<string, LwcSourceJson>();

    constructor(filePath: string) {
        this.filePath = filePath;
    }

    /** ノードのソースの文字列 */
    textOf(node: LwcConvertNode): string {
        return node.sourceInfo.context;
    }

    /**
     * ノードの sourceKeys。objectKey は内容 (位置を除く) のハッシュ、sourceKey は位置 (ファイルのパスを含む) のハッシュ。
     * Apex の makeConvertType と同じ作り方 (キーの順序に依らない)
     */
    keysOf(node: LwcConvertNode): ConvertKeys {
        const cached = this.keys.get(node);
        if (cached) {
            return cached;
        }
        const { context, ...position } = node.sourceInfo as LwcSourceInfo;
        const keys: ConvertKeys = {
            objectKey: `${node.type}_${hash(sortKeys(contentOf(node, this.contents)))}`,
            sourceKey: `${node.type}_${hash(position)}`,
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

    /** keysOf で登録したソース位置 */
    toSourceObjects(): LwcSourceJson[] {
        return [...this.sourceObjects.values()];
    }
}

/** 部分木のすべてのノード (前順で、自身を含む)。enter が false を返したノードの中には入らない */
export const walkNodes = (root: unknown, enter: (node: LwcConvertNode) => boolean | void): void => {
    const walk = (value: unknown): void => {
        if (Array.isArray(value)) {
            value.forEach(walk);
            return;
        }
        if (!isRecord(value)) {
            return;
        }
        if (isConvertNode(value) && enter(value) === false) {
            return;
        }
        for (const [key, child] of Object.entries(value)) {
            if (key !== 'sourceInfo') {
                walk(child);
            }
        }
    };
    walk(root);
};

/** 部分木に IR を作れなかったノードがあるか */
export const containsErrorNode = (value: unknown): boolean => {
    let found = false;
    walkNodes(value, (node) => {
        if (node.type === 'error') {
            found = true;
        }
        return !found;
    });
    return found;
};

export type LwcConvertValueOptions<TKey extends string = string> = {
    /**
     * エラーの検査の対象から外すプロパティ。外したプロパティは子の変換関数がエラーを処理する。
     * 'children' はノード自身だけを検査する (子はすべて対象外)。Apex の ConvertValueOptions と同じ
     */
    exclude?: readonly string[] | 'children';
    /** StructureJson の sourceKeys に集める子ノード。{ JSON 側の名前: 変換元のプロパティ名 } */
    record?: Readonly<Record<TKey, string>>;
};

/**
 * 境界ノードを変換する (Apex の convertValue と同じ)。検査範囲 (既定は部分木全体) に IR を作れなかったノードがあれば
 * ErrorJson を返す。process には、ノードと sourceKeys ({ base, ...record }) を渡す
 */
export const convertLwcValue = <TNode extends LwcConvertNode, TResult, TKey extends string = never>(
    target: TNode,
    kind: string,
    context: LwcJsonContext,
    process: (
        node: TNode,
        sourceKeys: { base: ConvertKeys } & Record<TKey, ConvertKeys>,
    ) => TResult,
    options: LwcConvertValueOptions<TKey> = {},
): TResult | ErrorJson => {
    const base = context.keysOf(target);
    const exclude = options.exclude;
    const checked = Object.entries(target).filter(([key, value]) => {
        if (key === 'sourceInfo') return false;
        if (exclude === 'children') return value === null || typeof value !== 'object';
        return !exclude?.includes(key);
    });
    if (target.type === 'error' || checked.some(([, value]) => containsErrorNode(value))) {
        return makeErrorJson(base, kind);
    }
    // record の子がない (名前のないクラスなど) ときは、ノード全体の位置にする
    const sourceKeys: Record<string, ConvertKeys> = { base };
    for (const [name, property] of Object.entries<string>(options.record ?? {})) {
        const child = (target as Record<string, unknown>)[property];
        sourceKeys[name] = isConvertNode(child) ? context.keysOf(child) : base;
    }
    return process(target, sourceKeys as { base: ConvertKeys } & Record<TKey, ConvertKeys>);
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
export const unwrapExpression = (node: LwcConvertNode): LwcConvertNode => {
    let current = node;
    while (WRAPPER_TYPES.has(current.type) && 'expression' in current) {
        current = current.expression as LwcConvertNode;
    }
    return current;
};

/** 名前 (Identifier / PrivateName / 文字列のキー)。それ以外 (計算されたキーなど) はソースの文字列 */
export const nameOf = (node: LwcConvertNode, context: LwcJsonContext): string => {
    switch (node.type) {
        case 'identifier':
        case 'jSXIdentifier':
            return node.name;
        case 'privateName':
            return `#${node.id.type === 'identifier' ? node.id.name : context.textOf(node.id)}`;
        case 'stringLiteral':
            return node.value;
        default:
            return context.textOf(node);
    }
};

/** IR を作れなかったノード (または kind の JSON を作れなかったところ) の ErrorJson */
export const makeLwcErrorJson = (
    node: LwcConvertNode,
    kind: string,
    context: LwcJsonContext,
): ErrorJson => makeErrorJson(context.keysOf(node), kind);
