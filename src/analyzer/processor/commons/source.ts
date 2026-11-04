import { ConvertKeys, JsonType, SourceSpan, StructureJsonType, isJsonType } from '../../types';

// Apex / メタデータ / LWC で共通の、JSON ノードのキーとソース位置の扱い

/** sourceKeys の形 (JsonType は ConvertKeys、StructureJsonType は { base, ... }) を問わない JSON ノード */
export type KeyedJson =
    JsonType<string> | StructureJsonType<string, Record<string, ConvertKeys | ConvertKeys[]>>;

/** ソース位置の一覧。Apex の SourceJson、XML の XmlSourceJson のどちらもこの形 */
export type SourceObject = {
    objectKey: string;
    context: string;
    source: ({ sourceKey: string } & Omit<SourceSpan, 'context'>)[];
};

/** ノードを識別するキー。StructureJsonType は base のキー */
export const makeConvertKeys = (target: KeyedJson): ConvertKeys => {
    if (isJsonType(target)) {
        return target.sourceKeys;
    }

    return target.sourceKeys.base;
};

/** ノードのソース位置 (sourceObject は before / after それぞれの解析結果のもの) */
export const findNodeSourceInfo = <T extends KeyedJson>(
    sourceInfo: SourceObject[],
    baseJson: T,
): { sourceKeys: ConvertKeys } & SourceSpan => {
    const baseConvertKeys = makeConvertKeys(baseJson);
    const si = sourceInfo.find((si) => si.objectKey === baseConvertKeys.objectKey);
    const s = si?.source.find((s) => s.sourceKey === baseConvertKeys.sourceKey);

    if (si && s) {
        const { sourceKey, ...rest } = s;
        return {
            sourceKeys: { objectKey: si.objectKey, sourceKey: sourceKey },
            context: si.context,
            ...rest,
        };
    }

    throw new Error(
        `target is not found:${JSON.stringify({ kind: baseJson.kind, sourcekeys: baseJson.sourceKeys })}`,
    );
};

export type SourceDistance = {
    start: number;
    end: number;
    range: number;
    center: number;
};

/** 2 つのソース位置の距離 (before / after は別ファイルなので近似。対応付けの推定にだけ使う) */
export const getSourceDistance = (
    a: { sourceKeys: ConvertKeys } & SourceSpan,
    b: { sourceKeys: ConvertKeys } & SourceSpan,
): SourceDistance => {
    const start = Math.abs(a.start.offset - b.start.offset);
    const end = Math.abs(a.end.offset - b.end.offset);

    const range =
        a.end.offset < b.start.offset
            ? b.start.offset - a.end.offset
            : b.end.offset < a.start.offset
              ? a.start.offset - b.end.offset
              : 0;

    const center = Math.abs(
        (a.start.offset + a.end.offset) / 2 - (b.start.offset + b.end.offset) / 2,
    );

    return {
        start,
        end,
        range,
        center,
    };
};

// 範囲の隙間 → 中心 → 始点 → 終点 の順で比較し、小さいほど近い
export const compareSourceDistance = (a: SourceDistance, b: SourceDistance): number => {
    return a.range - b.range || a.center - b.center || a.start - b.start || a.end - b.end;
};

export const findNearestIndex = <T>(
    base: { sourceKeys: ConvertKeys } & SourceSpan,
    candidates: T[],
    getSourceInfo: (candidate: T) => { sourceKeys: ConvertKeys } & SourceSpan,
): number => {
    let nearestIndex = -1;
    let nearestDistance: SourceDistance | undefined;

    candidates.forEach((candidate, index) => {
        const distance = getSourceDistance(base, getSourceInfo(candidate));

        if (!nearestDistance || compareSourceDistance(distance, nearestDistance) < 0) {
            nearestIndex = index;
            nearestDistance = distance;
        }
    });

    return nearestIndex;
};
