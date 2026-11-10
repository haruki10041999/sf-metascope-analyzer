import type { SourcePosition } from './source';
import { ConvertKeys, JsonType } from './json';
import { hash, isRecord, sortKeys } from './utils';

// 位置の範囲 (start / end) を持つ木から、kind / sourceKeys 付きの JSON を直接作る部品。
// 中間表現を作らない言語 (XML のメタデータ・LWC の HTML / CSS) で共通。方針: docs/lwc-implementation.md
// キーの作り方は Apex / LWC の JS と同じ:
// - objectKey: `${kind}_${hash(内容)}`。内容は sourceKeys を除いたもの (子の内容を含む)。位置が変わっても変わらない
// - sourceKey: `${kind}_${hash(ファイルと開始・終了位置)}`。位置が変わると変わる

/** 読み込み中の 1 ファイル。filePath は解析の単位 (オブジェクト・バンドル) のフォルダの親からの相対パス (区切りは /) */
export type SourceFile = {
    filePath: string;
    source: string;
};

/** 位置の範囲。end は範囲の次の位置 */
export type Span = {
    start: SourcePosition;
    end: SourcePosition;
};

/** ソース位置。1 つの解析の単位は複数のファイルからなるので、Apex の SourceInfo にファイルのパスを足す */
export type SpanSourceInfo = Span & {
    context: string;
    filePath: string;
};

/** Apex の SourceJson と同じ形 (source の要素に filePath を足したもの)。LWC の LwcSourceJson とも同じ */
export type SpanSourceJson = {
    objectKey: string;
    context: string;
    source: ({ sourceKey: string } & Omit<SpanSourceInfo, 'context'>)[];
};

/** 1 つの解析の単位を読む間に集めるソース位置 */
export class SpanSourceRegistry {
    private readonly sourceObjects = new Map<string, SpanSourceJson>();

    register(keys: ConvertKeys, info: SpanSourceInfo): void {
        const { context, ...content } = info;
        const sourceObject = this.sourceObjects.get(keys.objectKey);
        if (!sourceObject) {
            this.sourceObjects.set(keys.objectKey, {
                objectKey: keys.objectKey,
                context,
                source: [{ sourceKey: keys.sourceKey, ...content }],
            });
        } else if (!sourceObject.source.some((s) => s.sourceKey === keys.sourceKey)) {
            sourceObject.source.push({ sourceKey: keys.sourceKey, ...content });
        }
    }

    toSourceObjects(): SpanSourceJson[] {
        return [...this.sourceObjects.values()];
    }
}

/** objectKey の計算用に、子孫の sourceKeys を除く */
export const stripSourceKeys = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(stripSourceKeys);
    }
    if (isRecord(value)) {
        return Object.fromEntries(
            Object.entries(value)
                .filter(([key]) => key !== 'sourceKeys')
                .map(([key, child]) => [key, stripSourceKeys(child)]),
        );
    }
    return value;
};

/** ファイルの先頭 (要素がないときの位置) */
export const FILE_START: SourcePosition = { offset: 0, line: 1, column: 0 };

/**
 * kind / sourceKeys を付けた JSON を作り、ソース位置を登録する。
 * span が undefined のときは、ファイルの先頭を位置にする。
 * objectKey はキーの順序に依らない形 (sortKeys してから hash。配列は書いた順のまま) で、Apex・LWC・メタデータで同じ
 */
export const makeSpanJson = <T extends JsonType<string>>(
    kind: T['kind'],
    properties: Omit<T, 'kind' | 'sourceKeys'>,
    span: Span | undefined,
    file: SourceFile,
    registry: SpanSourceRegistry,
): T => {
    const start = span?.start ?? FILE_START;
    const end = span?.end ?? FILE_START;
    const content = stripSourceKeys(properties);
    const sourceKeys: ConvertKeys = {
        objectKey: `${kind}_${hash(sortKeys(content))}`,
        sourceKey: `${kind}_${hash({ filePath: file.filePath, start, end })}`,
    };
    registry.register(sourceKeys, {
        context: file.source.slice(start.offset, end.offset),
        filePath: file.filePath,
        start,
        end,
    });
    return { kind, sourceKeys, ...properties } as unknown as T;
};

/** ソース位置を引く。見つからなければ例外 */
export const findSpanSourceInfo = (
    sourceObject: SpanSourceJson[],
    keys: ConvertKeys,
): SpanSourceInfo => {
    const object = sourceObject.find((o) => o.objectKey === keys.objectKey);
    const source = object?.source.find((s) => s.sourceKey === keys.sourceKey);
    if (!object || !source) {
        throw new Error('sourceInfo cannot be found');
    }
    const { sourceKey: _sourceKey, ...content } = source;
    return { context: object.context, ...content };
};
