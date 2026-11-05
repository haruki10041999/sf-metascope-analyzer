import fs from 'node:fs/promises';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { Packr } from 'msgpackr';

import {
    ConvertKeys,
    ParsedXmlFile,
    SourcePosition,
    XmlReadProblem,
    XmlSyntaxError,
    parseXml,
    SourceSpan,
    ApexErrorTypeClass,
    hash,
} from '../types';

// Apex / メタデータ / LWC の parser で共通の、ファイルの読み込みと解析結果の保存

/** 保存するデータ。outputPath に data を書く (書き込みは writeSaveDataInfo) */
/** 保存するデータの種類 (保存先・保存名を分ける) */
export type SaveDataType = 'Apex' | 'Object' | 'ObjectTranslation' | 'Lwc';

export type SaveDataInfo = {
    type: SaveDataType;
    outputPath: URL;
    data: unknown;
};

// 本番保存用。records (同じキー構成をまとめる msgpackr 独自拡張) を使い、サイズと読み込み速度を優先する。
// structures (構造定義の共有) は使わないため、1 ファイル単体で読み込める。
// records を使うので msgpackr 以外の MessagePack 実装では読めない点に注意。
const packr = new Packr({ useRecords: true });

/** 末尾が '/' でないと相対 URL が親ディレクトリ基準で解決されるため、必ず付ける */
const toDirectoryUrl = (baseDir: string) => pathToFileURL(path.join(baseDir, path.sep));

/** 本番用: data を msgpackr で <baseDir>/<id>.msgpack に保存するデータ */
export const makeMsgPackSaveData = (
    type: SaveDataType,
    baseDir: string,
    id: string,
    data: unknown,
): SaveDataInfo => ({
    type,
    outputPath: new URL(`./${id}.msgpack`, toDirectoryUrl(baseDir)),
    data: packr.pack(data),
});

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

/** makeMsgPackSaveData で保存した <baseDir>/<id>.msgpack を読み込む。label はエラーメッセージ用 */
export const readMsgPack = async <T>(baseDir: string, id: string, label: string): Promise<T> => {
    const inputFile = path.join(baseDir, `${id}.msgpack`);
    const content = await fs.readFile(inputFile).catch(() => {
        throw new Error(`Saved ${label} file not found: ${inputFile}`);
    });
    return packr.unpack(content) as T;
};

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
export const readSource = async (filePath: string): Promise<string> =>
    (await fs.readFile(filePath, 'utf-8')).replace(/\r\n?/g, '\n');

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
    target: ApexErrorTypeClass,
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

export const toXmlResolvedError = (problem: XmlReadProblem): XmlResolvedError => ({
    sourceKeys: problem.error.sourceKeys,
    code: problem.code,
    contextType: problem.kindType,
    context: problem.file.source.split('\n')[problem.position.line - 1] ?? '',
    errorMessage: problem.message,
    filePath: problem.file.filePath,
    start: problem.position,
    end: problem.position,
});
