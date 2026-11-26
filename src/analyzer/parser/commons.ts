import { readFile as readFileCallback } from 'node:fs';
import fs from 'node:fs/promises';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { IrErrorLike } from '../types/commons/ir';

import {
    ConvertKeys,
    ParsedXmlFile,
    SourcePosition,
    XmlReadProblem,
    XmlSyntaxError,
    parseXml,
    SourceSpan,
    hash,
} from '../types';

// Apex / メタデータ / LWC の parser で共通の、ファイルの読み込みと解析結果の保存

/** 保存するデータの種類 (保存先・保存名を分ける) */
export type SaveDataType = 'Apex' | 'Object' | 'ObjectTranslation' | 'Lwc' | 'Metadata';

/** 保存するデータ。outputPath に data を書く (書き込みは writeSaveDataInfo。開発者でのデータ確認用の JSON) */
export type SaveDataInfo = {
    type: SaveDataType;
    outputPath: URL;
    data: unknown;
};

/**
 * 保存データの版。置き場・入れ物のレイアウトを変えたら 1 つ上げる。
 * 版の違う保存データは読まない (UnitStore は「保存データなし」として扱い、解析し直して保存し直す)。
 * 1: 版なし (〜 2026/11/05)
 * 2: 版を入れた。オブジェクトの保存名を object_<API 名> にした。メタデータの JSON のキーを並べ替えて作る
 * 3: Apex を IR v2 から作る。キーの値が変わった (docs/ir-integration.md)
 * 4: LWC も IR v2 から作る (キーの値が変わった)。JSON から ErrorJson をなくした (読めなかったものは resolvedError だけに出る)
 * 5: オブジェクトに customSettingsType・customSettingsVisibility を足した。メッセージチャネルなど 4 つの単位の種類を足した
 * 6: Flow の references の種類・Aura の messageChannels・オブジェクトの eventType / publishBehavior を足した。単位の種類を 12 足した (docs/json-gaps.md 7 章)
 * 7: LWC の JS / TS の JSON を作り直した (文・式を構造で持ち、ソースの文字列と calls / events をなくした。docs/lwc-json-types.md)
 * 8: 保存の置き場を <savingRoot>/store (目録・ソース・解析結果) にした (unit/store.ts。docs/save-format-plan.md の S1〜S2)。
 *    JSON の形の版を系統ごとに分けた (unitType.ts の UNIT_FORMAT_VERSIONS)。
 *    以降、これは入れ物・置き場所・保存名の版 (レイアウトの版)。JSON の形を変えたときは系統の版を上げる
 * 9: 保存の置き場を SQLite (<savingRoot>/store/metascope.db。unit/storeSqlite.ts) にした。前の msgpack のファイルは消す
 *    (docs/implementation-roadmap.md 5 章の Q1)
 * 10: 置き場を小さくした。span のファイルのパスを、単位のファイルの番号 (unit_file.file_no) にした。
 *    定義・参照 (derived) を圧縮した BLOB にした (NPSP で 450 MB → docs/implementation-roadmap.md 8 章の M3)
 * 11: node 表の structure_keys の列をなくした (JSON はすべて JsonType になり、StructureJsonType がなくなった。docs/plan.md 4.3 の 6)
 * 12: 定義・参照の行の表 (symbol・reference) を足し、node の索引を (kind, unit_id)・(unit_id, parent_id) にした (docs/plan.md 6.2)
 * 13: reference 表に参照の確かさ (resolution) の列を足した
 */
export const SAVE_FORMAT_VERSION = 13;

/** 末尾が '/' でないと相対 URL が親ディレクトリ基準で解決されるため、必ず付ける */
const toDirectoryUrl = (baseDir: string) => pathToFileURL(path.join(baseDir, path.sep));

/** 開発者でのデータ確認用: data を <baseDir>/<id>.json に保存するデータ */
export const makeJsonSaveData = (
    type: SaveDataType,
    baseDir: string,
    id: string,
    data: unknown,
): SaveDataInfo => ({
    type,
    outputPath: new URL(`./${id}.json`, toDirectoryUrl(baseDir)),
    data: `${JSON.stringify(data, null, 2)}\n`,
});

/** 保存処理が作ったデータをそのまま書き込む (バイナリ・文字列以外は整形した JSON にする) */
export const writeSaveDataInfo = async (saveDataInfo: SaveDataInfo[]): Promise<void> => {
    for (const { outputPath, data } of saveDataInfo) {
        const outputFile = fileURLToPath(outputPath);
        await mkdir(path.dirname(outputFile), { recursive: true });
        if (data instanceof Uint8Array) {
            await writeFile(outputFile, data);
        } else if (typeof data === 'string') {
            await writeFile(outputFile, data, 'utf8');
        } else {
            await writeFile(outputFile, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
        }
    }
};

/** ソースを読む。改行コード (CRLF / LF) で offset が変わり sourceKey も変わってしまうので、LF にそろえる */
export const readSource = (filePath: string): Promise<string> =>
    // コールバックの fs.readFile を使う。fs.promises.readFile は小さいファイルをたくさん同時に読むと
    // とても遅い (NPSP の 1.3 万ファイルで 71 秒、コールバックなら 0.35 秒。docs/implementation-roadmap.md 8 章の M4)
    new Promise((resolve, reject) =>
        readFileCallback(filePath, 'utf-8', (error, text) =>
            error ? reject(error) : resolve(text.replace(/\r\n?/g, '\n')),
        ),
    );

// ---------------------------------------------------------------------------
// XML (*-meta.xml)
// ---------------------------------------------------------------------------

/**
 * XML ファイルを読む。filePath は結果に残すパス (実行環境に依らない相対パス)、name はファイル名から接尾辞を除いたもの。
 * 構文エラーのときは root を持たず、error に理由と位置を持つ
 */
export const readXmlFile = async (
    absolutePath: string,
    filePath: string,
    name: string,
): Promise<ParsedXmlFile> => parseXmlSource(filePath, await readSource(absolutePath), name);

/** 読み込み済みのソースを XML として読む (readXmlFile のファイルを読まない版。LWC のバンドルはフォルダごとに読むので使う) */
export const parseXmlSource = (filePath: string, source: string, name: string): ParsedXmlFile => {
    try {
        return { filePath, source, name, root: parseXml(source) };
    } catch (error) {
        if (error instanceof XmlSyntaxError) {
            return {
                filePath,
                source,
                name,
                error: { message: error.reason, position: error.position },
            };
        }
        throw error;
    }
};

/** syntax: 構文エラー (リスナー) / analyzer: IR を作れなかった (このアナライザの未対応・例外)。LWC の LwcErrorPhase と同じ */
export type ApexErrorPhase = 'syntax' | 'analyzer';

export type ApexResolvedError = {
    phase: ApexErrorPhase;
    code: string;
    contextType: string;
    context: string;
    errorMessage: string;
};

export const toApexResolvedError = (
    target: IrErrorLike,
    phase: ApexErrorPhase = 'syntax',
): { sourceKeys: ConvertKeys } & ApexResolvedError & SourceSpan => {
    const resolvedErrorType: ApexResolvedError = {
        phase,
        code: target.getCode(),
        contextType: target.getContextType(),
        context: target.getContext(),
        errorMessage: target.getParseErrorMessage(),
    };

    const sourceSpan = target.getSpan()!;
    const sourceKeys: ConvertKeys = {
        objectKey: `error_${hash(resolvedErrorType)}`,
        sourceKey: `error_${hash(sourceSpan)}`,
    };

    return {
        sourceKeys: sourceKeys,
        ...resolvedErrorType,
        ...sourceSpan,
    };
};

/** 読めなかった XML ファイル。Apex の resolvedError と同じ形に、ファイルのパスを足す */
export type XmlResolvedError = {
    sourceKeys: ConvertKeys;
    code: XmlReadProblem['code'];
    contextType: string;
    context: string;
    errorMessage: string;
    filePath: string;
    start: SourcePosition;
    end: SourcePosition;
};

/**
 * 読めなかった XML ファイルの問題を resolvedError にする。
 * キーは、以前 JSON に置いていたエラーのノードと同じ作り方 (内容と、ファイルと位置から作る)
 */
export const toXmlResolvedError = (problem: XmlReadProblem): XmlResolvedError => ({
    sourceKeys: {
        objectKey: `error_${hash({ kindType: problem.kindType, message: problem.message })}`,
        sourceKey: `error_${hash({ filePath: problem.file.filePath, position: problem.position })}`,
    },
    code: problem.code,
    contextType: problem.kindType,
    context: problem.file.source.split('\n')[problem.position.line - 1] ?? '',
    errorMessage: problem.message,
    filePath: problem.file.filePath,
    start: problem.position,
    end: problem.position,
});
