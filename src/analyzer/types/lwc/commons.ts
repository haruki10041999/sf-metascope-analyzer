// LWC の JSON 生成層で共通の部品 (Apex の types/apex/commons/node.ts に当たる)。
// 入力は IR v2 (lwc_IR) のノード。ソースの文字列はノードの位置 (getSpan) から読み、
// JSON を作る段階でキー (sourceKeys) とソース位置の一覧 (sourceObject) を作る (docs/ir-integration.md 3.2)。
// v2 の木にはエラーのノードがないので、v1 の convertLwcValue のような、部分木のエラーを調べる処理はない
import { type ConvertKeys, type JsonType, makeContentKeyedJson } from '../commons/json';
import type { TypeField } from '../commons/ir';
import { hash } from '../commons/utils';
import { LwcCommonTypeClass } from '../lwc_IR/commonVisitor';

import type { LwcSourceJson } from './bundle';

// union の各要素ごとに Omit する
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

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
     * IR に対応するノードがない JSON (if の節・修飾子の一覧・関数の中身など) を作る (docs/plan.md 4.2)。
     * objectKey はこの JSON 自身の中身から作り (makeContentKeyedJson)、位置は node のものを借りる。
     * 借りた位置は、作った objectKey の一覧として sourceObject に登録する
     */
    derivedJson<T extends JsonType<string>>(
        kind: T['kind'],
        node: LwcNode,
        properties: DistributiveOmit<T, 'kind' | 'sourceKeys'>,
    ): T {
        const base = this.keysOf(node);
        const json = makeContentKeyedJson<T>(kind, base.sourceKey, properties);
        const position = this.sourceObjects
            .get(base.objectKey)
            ?.source.find((s) => s.sourceKey === base.sourceKey);
        if (position) {
            const objectKey = json.sourceKeys.objectKey;
            const existing = this.sourceObjects.get(objectKey);
            if (!existing) {
                this.sourceObjects.set(objectKey, {
                    objectKey,
                    context: this.textOf(node),
                    source: [position],
                });
            } else if (!existing.source.some((s) => s.sourceKey === position.sourceKey)) {
                existing.source.push(position);
            }
        }
        return json;
    }

    /**
     * ファイルの根 (モジュール) の JSON。位置はファイルの先頭 (長さ 0) にする
     * (ファイル全体の位置にすると、ファイル全体のソースを位置の一覧に持ってしまうため)。objectKey は中身から作る
     */
    fileRootJson<T extends JsonType<string>>(
        kind: T['kind'],
        properties: DistributiveOmit<T, 'kind' | 'sourceKeys'>,
    ): T {
        const start = { offset: 0, line: 1, column: 0 };
        const position = { start, end: start, filePath: this.filePath };
        const json = makeContentKeyedJson<T>(kind, `${kind}_${hash(position)}`, properties);
        const { objectKey, sourceKey } = json.sourceKeys;
        const existing = this.sourceObjects.get(objectKey);
        if (!existing) {
            this.sourceObjects.set(objectKey, {
                objectKey,
                context: '',
                source: [{ sourceKey, ...position }],
            });
        } else if (!existing.source.some((s) => s.sourceKey === sourceKey)) {
            existing.source.push({ sourceKey, ...position });
        }
        return json;
    }

    /**
     * 名前を持つ宣言 (クラス・メンバー・関数・型の宣言など) のノードと、名前のノード。
     * 名前のない宣言 (export default class extends ...) は、名前の位置を宣言全体にする (v1 と同じ)
     */
    declarationOf(
        node: LwcNode,
        children: Readonly<{ name: LwcNode | null | undefined }>,
    ): LwcDeclaration {
        return { node, nameNode: children.name ?? node };
    }

    /** keysOf で登録したソース位置 */
    toSourceObjects(): LwcSourceJson[] {
        return [...this.sourceObjects.values()];
    }
}

/** 名前を持つ宣言のノードと名前のノード (LwcJsonContext.declarationOf) */
export type LwcDeclaration = { node: LwcNode; nameNode: LwcNode };

/**
 * 宣言の名前の位置 (Apex の declarationName と同じ。名前そのものは宣言の name にも持つ)。
 * objectKey は中身から作る (名前の IR の objectKey は式の識別子と同じになりうるため。docs/plan.md 4.2)
 */
export type LwcDeclarationNameJson = JsonType<'declarationName'> & { name: string };

/** 名前を持つ宣言の JsonType (名前の位置は nameRef。lwc 4 から) */
export type LwcDeclarationJsonType<TKind extends string> = JsonType<TKind> & {
    /** 名前の位置 */
    nameRef: LwcDeclarationNameJson;
};

/**
 * 名前を持つ宣言の JSON。キーは宣言のノード、名前の位置は nameRef (declarationName) に持つ。
 * 名前のない宣言 (name が null) の nameRef の name は ''
 */
export const makeLwcDeclarationJson = <const TKind extends string, TProperties extends object>(
    context: LwcJsonContext,
    kind: TKind,
    declaration: LwcDeclaration,
    properties: TProperties,
): LwcDeclarationJsonType<TKind> & TProperties => {
    const name = (properties as { name?: unknown }).name;
    return {
        kind,
        sourceKeys: context.keysOf(declaration.node),
        ...properties,
        nameRef: context.derivedJson<LwcDeclarationNameJson>(
            'declarationName',
            declaration.nameNode,
            {
                name: typeof name === 'string' ? name : '',
            },
        ),
    } as LwcDeclarationJsonType<TKind> & TProperties;
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
