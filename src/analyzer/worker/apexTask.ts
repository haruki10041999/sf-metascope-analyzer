import { mkdir, writeFile } from 'node:fs/promises';
import path from 'path';
import { fileURLToPath } from 'node:url';

import { ApexParser, FileStructureType, SaveDataInfo } from '../parser/Apex/parser';

/** 本番用の保存ファイルの拡張子 (ApexParser.saveApexFile が <id>.msgpack で保存する) */
export const savedApexFileExtension = '.msgpack';

/**
 * スレッドとインラインの両方で実行するタスク。worker_threads で受け渡すため plain object にする。
 * 保存・読み込みは本番用 (ApexParser.saveApexFile / readApexMsgPack) に限定する。
 */
export type ApexTask =
    | { type: 'parseAndSave'; filePath: string; outDir: string }
    | { type: 'parse'; filePath: string }
    | { type: 'save'; outDir: string; parsed: FileStructureType }
    | { type: 'load'; outDir: string; id: string };

export type ApexSaveSummary = {
    id: string;
    filePath: string;
    dataType: FileStructureType['dataType'];
    syntaxErrorCount: number;
};

export type ApexTaskResult<T extends ApexTask> = T extends { type: 'parseAndSave' }
    ? ApexSaveSummary
    : FileStructureType;

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

export const parseAndSave = async (filePath: string, outDir: string): Promise<ApexSaveSummary> => {
    const parsed = await ApexParser.parseApexClass(filePath);
    await writeSaveDataInfo(ApexParser.saveApexFile(outDir, parsed));

    return {
        id: parsed.result.id,
        filePath: parsed.filePath,
        dataType: parsed.dataType,
        syntaxErrorCount: parsed.resolvedError.length,
    };
};

export const runApexTask = async <T extends ApexTask>(task: T): Promise<ApexTaskResult<T>> => {
    switch (task.type) {
        case 'parseAndSave':
            return (await parseAndSave(task.filePath, task.outDir)) as ApexTaskResult<T>;
        case 'load':
            return (await ApexParser.readApexMsgPack(task.outDir, task.id)) as ApexTaskResult<T>;
        case 'parse':
            return (await ApexParser.parseApexClass(task.filePath)) as ApexTaskResult<T>;
        case 'save':
            await writeSaveDataInfo(ApexParser.saveApexFile(task.outDir, task.parsed));
            return {
                id: task.parsed.result.id,
                filePath: task.parsed.filePath,
                dataType: task.parsed.dataType,
                syntaxErrorCount: task.parsed.resolvedError.length,
            } as ApexTaskResult<T>;
    }
};

