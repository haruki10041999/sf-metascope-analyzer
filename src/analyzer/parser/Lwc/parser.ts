// LWC の parser の入口 (docs/lwc-implementation.md)。Apex の ApexParser・オブジェクトの MetadataParser と同じく、
// 探す (searchBundleDirectories)・読む (parseLwcBundle)・保存 (saveLwcBundle)・保存済みの読み込み (readLwcMsgPack) を持つ。
// 1 バンドル (lwc/<名前>/ のフォルダ) = 1 つの解析結果 = 1 つの保存ファイル (lwc_<名前>.msgpack)。
// フォルダの読み込みは folder.ts、解析は bundle.ts (ファイルシステムに触らない)
import fs from 'node:fs/promises';
import path from 'node:path';

import {
    makeJsonSaveData,
    makeMsgPackSaveData,
    readMsgPack,
    readSavedMsgPacks,
    type SaveDataInfo,
} from '../commons';

import {
    makeErrorBundleResult,
    parseLwcBundleFolder,
    type LwcBundleParseResult,
    type LwcParseOptions,
} from './bundle';
import { readLwcBundleFolder, type LwcBundleFolder } from './folder';

export type {
    ErrorLwcBundleStructureType,
    LwcBundleParseResult,
    LwcBundleStructureType,
    LwcParseOptions,
} from './bundle';

/** 保存名の接頭辞 (Apex の class_ / trigger_ / anonymous_、翻訳の objectTranslation_ と同じく、同じ保存先で種類を分ける) */
export const LWC_SAVE_PREFIX = 'lwc_';

/** LWC の保存名 (lwc_<バンドル名>) か */
export const isLwcSaveId = (id: string): boolean => id.startsWith(LWC_SAVE_PREFIX);

const LWC_FOLDER = 'lwc';

const isDirectory = (p: string) =>
    fs.stat(p).then(
        (stat) => stat.isDirectory(),
        () => false,
    );

export class LwcParser {
    /**
     * rootDir 配下のバンドルのフォルダ (lwc/<名前>/) の一覧。lwc フォルダそのものを渡したときは直下だけを見る。
     * node_modules の中は見ない
     */
    static async searchBundleDirectories(rootDir: string): Promise<string[]> {
        if (!(await isDirectory(rootDir))) {
            return [];
        }
        if (path.basename(rootDir) === LWC_FOLDER) {
            return (await fs.readdir(rootDir, { withFileTypes: true }))
                .filter((entry) => entry.isDirectory())
                .map((entry) => path.join(rootDir, entry.name))
                .sort();
        }
        const entries = await fs.readdir(rootDir, { recursive: true, withFileTypes: true });
        return entries
            .filter(
                (entry) =>
                    entry.isDirectory() &&
                    path.basename(entry.parentPath) === LWC_FOLDER &&
                    !entry.parentPath.split(path.sep).includes('node_modules'),
            )
            .map((entry) => path.join(entry.parentPath, entry.name))
            .sort();
    }

    /**
     * バンドル (lwc/<名前>/ のフォルダ) を読む。フォルダを 1 回読んで (folder.ts)、中のファイルをまとめて解析する (bundle.ts)。
     * フォルダが読めない・メインのモジュール (<名前>.ts / .js) がないときは dataType: 'error'
     */
    static async parseLwcBundle(
        bundleDir: string,
        options: LwcParseOptions = {},
    ): Promise<LwcBundleParseResult> {
        let folder: LwcBundleFolder;
        try {
            folder = await readLwcBundleFolder(bundleDir);
        } catch {
            return makeErrorBundleResult(
                bundleDir,
                path.basename(bundleDir),
                'bundle folder cannot be read',
            );
        }
        return parseLwcBundleFolder(folder, options);
    }

    /** rootDir 配下のすべてのバンドルを読む */
    static async parseLwcBundles(
        rootDir: string,
        options: LwcParseOptions = {},
    ): Promise<LwcBundleParseResult[]> {
        const directories = await LwcParser.searchBundleDirectories(rootDir);
        return Promise.all(directories.map((dir) => LwcParser.parseLwcBundle(dir, options)));
    }

    // 本番用: 解析結果を msgpackr で <baseDir>/lwc_<バンドル名>.msgpack に保存する (Apex の saveApexUnit と同じ)
    static saveLwcBundle(baseDir: string, target: LwcBundleParseResult): SaveDataInfo[] {
        return [
            makeMsgPackSaveData('Lwc', baseDir, `${LWC_SAVE_PREFIX}${target.result.id}`, target),
        ];
    }

    // 開発者でのデータ確認用
    static saveLwcBundleForDeveloper(
        baseDir: string,
        target: LwcBundleParseResult,
    ): SaveDataInfo[] {
        return [makeJsonSaveData('Lwc', baseDir, `${LWC_SAVE_PREFIX}${target.result.id}`, target)];
    }

    // 本番用: saveLwcBundle で保存した <baseDir>/<id>.msgpack を読み込む (id は lwc_<バンドル名>)
    static async readLwcMsgPack(baseDir: string, id: string): Promise<LwcBundleParseResult> {
        return readMsgPack<LwcBundleParseResult>(baseDir, id, 'Lwc');
    }

    /** baseDir に保存したすべてのバンドルを読む (lwc_ で始まるものだけ)。baseDir がなければ空 */
    static async readSavedBundles(baseDir: string): Promise<LwcBundleParseResult[]> {
        return readSavedMsgPacks(baseDir, isLwcSaveId, (id) => LwcParser.readLwcMsgPack(baseDir, id));
    }
}
