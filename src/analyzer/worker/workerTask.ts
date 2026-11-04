import {
    MetadataParser,
    ObjectParseResult,
    ObjectTranslationParseResult,
    ObjectTranslationParser,
} from '../parser';
import { ApexParser, ApexParseResult, ApexMetaParseResult } from '../parser/Apex/parser';
import { writeSaveDataInfo } from '../parser/commons';

/** 本番用の保存ファイルの拡張子 (ApexParser.saveApexFile / MetadataParser.saveObjectFile が <id>.msgpack で保存する) */
export const savedFileExtension = '.msgpack';

/**
 * タスクの対象。Apex はファイル (.cls / .trigger / .apex / -meta.xml)、Object はオブジェクトのフォルダ、
 * ObjectTranslation は翻訳のフォルダ (<オブジェクト>-<言語>)
 */
export type WorkerTaskType = 'Apex' | 'Object' | 'ObjectTranslation';

/** 対象ごとの解析結果 */
export type WorkerParseResult<K extends WorkerTaskType = WorkerTaskType> = K extends 'Apex'
    ? ApexParseResult | ApexMetaParseResult
    : K extends 'Object'
      ? ObjectParseResult
      : ObjectTranslationParseResult;

/**
 * スレッドとインラインの両方で実行するタスク。worker_threads で受け渡すため plain object にする。
 * 保存・読み込みは本番用 (msgpack) に限定する。
 */
export type WorkerTask<K extends WorkerTaskType = WorkerTaskType> =
    | { command: 'parseAndSave'; type: K; filePath: string; outDir: string }
    | { command: 'parse'; type: K; filePath: string }
    | { command: 'save'; type: K; outDir: string; parsed: WorkerParseResult<K> }
    | { command: 'load'; type: K; outDir: string; id: string };

export type SaveSummary = {
    id: string;
    filePath: string;
    dataType: WorkerParseResult['dataType'];
    syntaxErrorCount: number;
};

/** parseAndSave / save は保存の要約、parse / load は解析結果 (対象の型ごと) */
export type WorkerTaskResult<T extends WorkerTask> = T extends { command: 'parseAndSave' | 'save' }
    ? SaveSummary
    : WorkerParseResult<T['type']>;

const toSummary = (parsed: WorkerParseResult): SaveSummary => ({
    id: parsed.result.id,
    filePath: parsed.filePath,
    dataType: parsed.dataType,
    syntaxErrorCount: parsed.resolvedError.length,
});

/** 対象ごとの解析・保存・読み込み */
const handlers = {
    Apex: {
        parse: (filePath: string) => ApexParser.parseApexFile(filePath),
        save: (outDir: string, parsed: WorkerParseResult) =>
            ApexParser.saveApexFile(outDir, parsed as WorkerParseResult<'Apex'>),
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
} satisfies Record<
    WorkerTaskType,
    {
        parse: (filePath: string) => Promise<WorkerParseResult>;
        save: (outDir: string, parsed: WorkerParseResult) => unknown;
        load: (outDir: string, id: string) => Promise<WorkerParseResult>;
    }
>;

/** 1 件を解析して保存する */
export const parseAndSave = async (
    type: WorkerTaskType,
    filePath: string,
    outDir: string,
): Promise<SaveSummary> => {
    const parsed = await handlers[type].parse(filePath);
    await writeSaveDataInfo(handlers[type].save(outDir, parsed));
    return toSummary(parsed);
};

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
            await writeSaveDataInfo(handler.save(task.outDir, task.parsed));
            return toSummary(task.parsed) as WorkerTaskResult<T>;
        case 'load':
            return (await handler.load(task.outDir, task.id)) as WorkerTaskResult<T>;
    }
};
