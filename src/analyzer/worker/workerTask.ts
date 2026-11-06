import {
    MetadataFileParseResult,
    MetadataParser,
    ObjectParseResult,
    ObjectTranslationParseResult,
    ObjectTranslationParser,
    findParserByFolder,
    findParserBySaveId,
} from '../parser';
import { ApexParser } from '../parser/Apex/parser';
import type { ApexUnitParseResult } from '../parser/Apex/unit';
import { LwcParser, type LwcBundleParseResult } from '../parser/Lwc/parser';
import { writeSaveDataInfo } from '../parser/commons';

/**
 * タスクの対象。Apex は単位 (クラス・トリガー・匿名 Apex。単位のどれかのファイルのパス)、Object はオブジェクトのフォルダ、
 * ObjectTranslation は翻訳のフォルダ (<オブジェクト>-<言語>)、Lwc はバンドルのフォルダ (lwc/<名前>/)。
 * どれも 1 単位 (Apex のクラスはソースと -meta.xml、LWC はフォルダ) = 1 件 = 1 つの保存ファイル。
 * MetadataFolder は種類のフォルダ (permissionsets/ など。種類はフォルダ名で決める) で、中のファイルごとに
 * 1 件 = 1 つの保存ファイル (docs/metadata-implementation.md 10 章)
 */
export type WorkerTaskType = 'Apex' | 'Object' | 'ObjectTranslation' | 'Lwc' | 'MetadataFolder';

/** 対象ごとの 1 件の解析結果 (保存・読み込みの単位) */
export type WorkerParseResult<K extends WorkerTaskType = WorkerTaskType> = K extends 'Apex'
    ? ApexUnitParseResult
    : K extends 'Object'
      ? ObjectParseResult
      : K extends 'ObjectTranslation'
        ? ObjectTranslationParseResult
        : K extends 'Lwc'
          ? LwcBundleParseResult
          : MetadataFileParseResult;

/** 1 タスクの解析結果。MetadataFolder はフォルダの中のファイルごとの結果の並び */
export type WorkerTaskParseResult<K extends WorkerTaskType = WorkerTaskType> =
    K extends 'MetadataFolder' ? MetadataFileParseResult[] : WorkerParseResult<K>;

/** 1 タスクの保存の要約。MetadataFolder はファイルごと */
export type WorkerSaveResult<K extends WorkerTaskType = WorkerTaskType> = K extends 'MetadataFolder'
    ? SaveSummary[]
    : SaveSummary;

/**
 * スレッドとインラインの両方で実行するタスク。worker_threads で受け渡すため plain object にする。
 * 保存・読み込みは本番用 (msgpack) に限定する。
 */
export type WorkerTask<K extends WorkerTaskType = WorkerTaskType> =
    | { command: 'parseAndSave'; type: K; filePath: string; outDir: string }
    | { command: 'parse'; type: K; filePath: string }
    | { command: 'save'; type: K; outDir: string; parsed: WorkerTaskParseResult<K> }
    | { command: 'load'; type: K; outDir: string; id: string };

export type SaveSummary = {
    id: string;
    filePath: string;
    dataType: WorkerParseResult['dataType'];
    syntaxErrorCount: number;
};

/** parseAndSave / save は保存の要約、parse は 1 タスクの解析結果、load は 1 件の解析結果 (対象の型ごと) */
export type WorkerTaskResult<T extends WorkerTask> = T extends { command: 'parseAndSave' | 'save' }
    ? WorkerSaveResult<T['type']>
    : T extends { command: 'parse' }
      ? WorkerTaskParseResult<T['type']>
      : WorkerParseResult<T['type']>;

const toSummary = (parsed: WorkerParseResult): SaveSummary => ({
    id: parsed.result.id,
    filePath: parsed.filePath,
    dataType: parsed.dataType,
    syntaxErrorCount: parsed.resolvedError.length,
});

const folderParser = (directory: string) => {
    const parser = findParserByFolder(directory);
    if (!parser) throw new Error(`Unknown metadata folder: ${directory}`);
    return parser;
};

const savedParser = (id: string) => {
    const parser = findParserBySaveId(id);
    if (!parser) throw new Error(`Unknown saved metadata id: ${id}`);
    return parser;
};

/** 対象ごとの解析・保存・読み込み */
const handlers = {
    Apex: {
        parse: (filePath: string) => ApexParser.parseApexUnit(filePath),
        save: (outDir: string, parsed: WorkerParseResult) =>
            ApexParser.saveApexUnit(outDir, parsed as WorkerParseResult<'Apex'>),
        load: (outDir: string, id: string) => ApexParser.readApexMsgPack(outDir, id),
    },
    Object: {
        parse: (filePath: string) => MetadataParser.parseObject(filePath),
        save: (outDir: string, parsed: WorkerParseResult) =>
            MetadataParser.saveObjectFile(outDir, parsed as WorkerParseResult<'Object'>),
        load: (outDir: string, id: string) => MetadataParser.readObjectMsgPack(outDir, id),
    },
    ObjectTranslation: {
        parse: (filePath: string) => ObjectTranslationParser.parseObjectTranslation(filePath),
        save: (outDir: string, parsed: WorkerParseResult) =>
            ObjectTranslationParser.saveObjectTranslationFile(
                outDir,
                parsed as WorkerParseResult<'ObjectTranslation'>,
            ),
        load: (outDir: string, id: string) =>
            ObjectTranslationParser.readObjectTranslationMsgPack(outDir, id),
    },
    Lwc: {
        parse: (bundleDir: string) => LwcParser.parseLwcBundle(bundleDir),
        save: (outDir: string, parsed: WorkerParseResult) =>
            LwcParser.saveLwcBundle(outDir, parsed as WorkerParseResult<'Lwc'>),
        load: (outDir: string, id: string) => LwcParser.readLwcMsgPack(outDir, id),
    },
    MetadataFolder: {
        parse: (directory: string) => folderParser(directory).parseFolder(directory),
        save: (outDir: string, parsed: WorkerParseResult) =>
            savedParser(parsed.result.id).save(
                outDir,
                parsed as Parameters<ReturnType<typeof savedParser>['save']>[1],
            ),
        load: (outDir: string, id: string) => savedParser(id).read(outDir, id),
    },
} satisfies Record<
    WorkerTaskType,
    {
        parse: (filePath: string) => Promise<WorkerParseResult | WorkerParseResult[]>;
        save: (outDir: string, parsed: WorkerParseResult) => unknown;
        load: (outDir: string, id: string) => Promise<WorkerParseResult>;
    }
>;

/** 1 タスクの解析結果を保存し、要約を返す (MetadataFolder はファイルごと) */
const saveParsed = async (
    type: WorkerTaskType,
    outDir: string,
    parsed: WorkerParseResult | WorkerParseResult[],
): Promise<SaveSummary | SaveSummary[]> => {
    const items = Array.isArray(parsed) ? parsed : [parsed];
    for (const item of items) {
        await writeSaveDataInfo(
            handlers[type].save(outDir, item) as Parameters<typeof writeSaveDataInfo>[0],
        );
    }
    return Array.isArray(parsed) ? parsed.map(toSummary) : toSummary(parsed);
};

/** 1 タスクを解析して保存する */
export const parseAndSave = async (
    type: WorkerTaskType,
    filePath: string,
    outDir: string,
): Promise<SaveSummary | SaveSummary[]> =>
    saveParsed(type, outDir, await handlers[type].parse(filePath));

export const runWorkerTask = async <T extends WorkerTask>(
    task: T,
): Promise<WorkerTaskResult<T>> => {
    const handler = handlers[task.type];
    switch (task.command) {
        case 'parseAndSave':
            return (await parseAndSave(
                task.type,
                task.filePath,
                task.outDir,
            )) as WorkerTaskResult<T>;
        case 'parse':
            return (await handler.parse(task.filePath)) as WorkerTaskResult<T>;
        case 'save':
            return (await saveParsed(
                task.type,
                task.outDir,
                task.parsed as WorkerParseResult | WorkerParseResult[],
            )) as WorkerTaskResult<T>;
        case 'load':
            return (await handler.load(task.outDir, task.id)) as WorkerTaskResult<T>;
    }
};
