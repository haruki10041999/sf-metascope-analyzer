// Apex の parser の入口。LWC の LwcParser・オブジェクトの MetadataParser と同じく、
// 探す (searchApexUnits)・読む (parseApexUnit / parseApexUnits)・保存 (saveApexUnit)・保存済みの読み込み (readApexMsgPack) を持つ。
// 解析の単位はクラス (.cls + .cls-meta.xml)・トリガー (.trigger + .trigger-meta.xml)・匿名 Apex (.apex) で、
// 1 単位 = 1 つの解析結果 = 1 つの保存ファイル (class_<名前> / trigger_<名前> / anonymous_<名前>)。
// フォルダの読み込みは folder.ts、単位の解析は unit.ts (ファイルシステムに触らない)
import fs from 'node:fs/promises';

import { makeJsonSaveData, makeMsgPackSaveData, readMsgPack, type SaveDataInfo } from '../commons';

import { getApexUnitPath, locateApexUnit, readApexUnit, searchApexUnits } from './folder';
import { APEX_UNIT_PREFIXES, parseApexUnitFiles, type ApexUnitParseResult } from './unit';

const SAVED_EXTENSION = '.msgpack';

export class ApexParser {
    /**
     * rootDir 配下の単位の、主なファイルのパスの一覧 (parseApexUnit に渡すパス)。
     * フォルダごとに、ソースと -meta.xml を 1 つの単位にまとめる
     */
    static async searchApexUnits(rootDir: string): Promise<string[]> {
        return (await searchApexUnits(rootDir)).map(getApexUnitPath);
    }

    /**
     * 単位を 1 つ読む。filePath は単位のどれかのファイル (Foo.cls でも Foo.cls-meta.xml でもよい)。
     * 同じフォルダのもう片方のファイルも読んで、1 つの解析結果にする
     */
    static async parseApexUnit(filePath: string): Promise<ApexUnitParseResult> {
        return parseApexUnitFiles(await readApexUnit(await locateApexUnit(filePath)));
    }

    /** rootDir 配下のすべての単位を読む */
    static async parseApexUnits(rootDir: string): Promise<ApexUnitParseResult[]> {
        const locations = await searchApexUnits(rootDir);
        return Promise.all(
            locations.map(async (location) => parseApexUnitFiles(await readApexUnit(location))),
        );
    }

    // 本番用: 解析結果を msgpackr で <baseDir>/<id>.msgpack に保存する (id は class_<名前> など)
    static saveApexUnit(baseDir: string, target: ApexUnitParseResult): SaveDataInfo[] {
        return [makeMsgPackSaveData('Apex', baseDir, target.result.id, target)];
    }

    // 開発者でのデータ確認用
    static saveApexUnitForDevelopper(baseDir: string, target: ApexUnitParseResult): SaveDataInfo[] {
        return [makeJsonSaveData('Apex', baseDir, target.result.id, target)];
    }

    // 本番用: saveApexUnit で保存した <baseDir>/<id>.msgpack を読み込む
    static async readApexMsgPack(baseDir: string, id: string): Promise<ApexUnitParseResult> {
        return readMsgPack<ApexUnitParseResult>(baseDir, id, 'Apex');
    }

    /** baseDir に保存したすべての単位を読む (class_ / trigger_ / anonymous_ で始まるもの)。baseDir がなければ空 */
    static async readSavedApexUnits(baseDir: string): Promise<ApexUnitParseResult[]> {
        const prefixes = Object.values(APEX_UNIT_PREFIXES);
        const names = await fs.readdir(baseDir).catch(() => [] as string[]);
        return Promise.all(
            names
                .filter(
                    (name) =>
                        prefixes.some((prefix) => name.startsWith(prefix)) &&
                        name.endsWith(SAVED_EXTENSION),
                )
                .sort()
                .map((name) =>
                    ApexParser.readApexMsgPack(baseDir, name.slice(0, -SAVED_EXTENSION.length)),
                ),
        );
    }
}
