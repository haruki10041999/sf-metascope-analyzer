// Apex の解析の単位 (LWC のバンドルに当たる)。
// - クラス: <名前>.cls と <名前>.cls-meta.xml (classes フォルダ)
// - トリガー: <名前>.trigger と <名前>.trigger-meta.xml (triggers フォルダ)
// - 匿名 Apex: <名前>.apex 1 ファイル (メタデータはない)
// 1 単位 = 1 つの解析結果 = 置き場の 1 単位 (id は class_<名前> / trigger_<名前> / anonymous_<名前>)。
// ここはファイルシステムに触らない (読み込みは folder.ts)
import {
    type ConvertKeys,
    type JsonType,
    getApexMetaSuffix,
    makeContentKeyedJson,
    type SourceJson,
    type XmlSourceJson,
} from '../../types';
import type { XmlResolvedError } from '../commons';

import { parseApexMetaSource, type ApexMetaFileJson } from './meta';
import {
    getApexSourceFileType,
    parseApexSource,
    type ApexSourceJson,
    type ApexSourceResolvedError,
} from './source';

export type ApexUnitType = 'class' | 'trigger' | 'anonymous';

/** 保存名・id の接頭辞 (同じ保存先でオブジェクト・LWC と、単位の種類どうしを分ける) */
export const APEX_UNIT_PREFIXES: Readonly<Record<ApexUnitType, string>> = {
    class: 'class_',
    trigger: 'trigger_',
    anonymous: 'anonymous_',
};

/**
 * 単位の JSON (LWC の LwcBundleJson に当たる)。ソース・メタデータのどちらかがなければ、そのプロパティを持たない。
 * 単位の根のノード (apex 9 から)。位置はソース (なければ -meta.xml) のもの、objectKey は中身から作る
 */
export type ApexUnitJson = JsonType<'apexUnit'> & {
    /** クラス名・トリガー名・匿名 Apex のファイル名 (拡張子を除く) */
    name: string;
    unitType: ApexUnitType;
    source?: ApexSourceJson;
    meta?: ApexMetaFileJson;
};

/** 単位の中のすべての診断 (ソースの構文エラーなど・-meta.xml を読めなかった)。filePath (ファイル名) で区別する */
export type ApexUnitResolvedError = ApexSourceResolvedError | XmlResolvedError;

/** 単位の解析結果。LWC の LwcBundleParseResult・オブジェクトの ObjectParseResult と同じ形 */
export type ApexUnitParseResult = {
    /** 単位の主なファイルのパス (ソースがあればソース、なければ -meta.xml) */
    filePath: string;
    resolvedError: ApexUnitResolvedError[];
    dataType: 'apexUnit';
    result: {
        /** <接頭辞><名前> (class_AccountService)。保存名と同じ */
        id: string;
        base: ApexUnitJson;
        /** ソースの位置 (SourceJson) と -meta.xml の位置 (XmlSourceJson。filePath 付き) */
        sourceObject: (SourceJson | XmlSourceJson)[];
    };
};

/** ファイル名が、どの単位のソース・メタデータか。Apex のファイルでなければ undefined */
export const getApexUnitRole = (
    fileName: string,
): { unitType: ApexUnitType; name: string; role: 'source' | 'meta' } | undefined => {
    const metaSuffix = getApexMetaSuffix(fileName);
    if (metaSuffix) {
        return {
            unitType: metaSuffix === '.cls-meta.xml' ? 'class' : 'trigger',
            name: fileName.slice(0, -metaSuffix.length),
            role: 'meta',
        };
    }
    const fileType = getApexSourceFileType(fileName);
    if (!fileType) return undefined;
    return {
        unitType: fileType === 'cls' ? 'class' : fileType,
        name: fileName.slice(0, fileName.lastIndexOf('.')),
        role: 'source',
    };
};

export const getApexUnitId = (unitType: ApexUnitType, name: string) =>
    `${APEX_UNIT_PREFIXES[unitType]}${name}`;

/** 単位のファイル (読み込み済み)。ソース・メタデータのどちらかはある */
export type ApexUnitFiles = {
    unitType: ApexUnitType;
    name: string;
    /** 単位の主なファイルのパス (ApexUnitParseResult の filePath) */
    filePath: string;
    source?: { fileName: string; source: string };
    meta?: { fileName: string; source: string };
};

/** 読み込んだ単位のファイルを解析する */
export const parseApexUnitFiles = async (files: ApexUnitFiles): Promise<ApexUnitParseResult> => {
    const sourceResult = files.source
        ? await parseApexSource(files.source.fileName, files.source.source)
        : undefined;
    const metaResult = files.meta
        ? parseApexMetaSource(files.meta.fileName, files.meta.source)
        : undefined;

    const base = makeContentKeyedJson<ApexUnitJson>(
        'apexUnit',
        (sourceResult?.source ?? metaResult!.meta).sourceKeys.sourceKey,
        {
            name: files.name,
            unitType: files.unitType,
            ...(sourceResult ? { source: sourceResult.source } : {}),
            ...(metaResult ? { meta: metaResult.meta } : {}),
        },
    );
    const sourceObject = [
        ...(sourceResult?.sourceObject ?? []),
        ...(metaResult?.sourceObject ?? []),
    ];
    return {
        filePath: files.filePath,
        resolvedError: [
            ...(sourceResult?.resolvedError ?? []),
            ...(metaResult?.resolvedError ?? []),
        ],
        dataType: 'apexUnit',
        result: {
            id: getApexUnitId(files.unitType, files.name),
            base,
            sourceObject: [...sourceObject, ...aliasSourceObjects(sourceObject, base.sourceKeys)],
        },
    };
};

/**
 * 単位の根 (apexUnit) の位置の一覧。根は位置をソース (なければ -meta.xml) の根から借りるので、
 * 借りた位置を根の objectKey の一覧としても載せる (位置を objectKey と sourceKey の組で引けるように)
 */
const aliasSourceObjects = (
    sourceObject: readonly (SourceJson | XmlSourceJson)[],
    keys: ConvertKeys,
): (SourceJson | XmlSourceJson)[] =>
    sourceObject
        .flatMap((object) => {
            const source = object.source.filter((s) => s.sourceKey === keys.sourceKey);
            return source.length > 0 ? [{ ...object, objectKey: keys.objectKey, source }] : [];
        })
        .slice(0, 1) as (SourceJson | XmlSourceJson)[];
