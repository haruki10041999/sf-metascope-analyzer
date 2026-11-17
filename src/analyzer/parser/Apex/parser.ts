// Apex の parser の入口。LWC の LwcParser・オブジェクトの MetadataParser と同じく、
// 探す (searchApexUnits)・読む (parseApexUnit / parseApexUnits) を持つ。保存は UnitStore (unit/store.ts。SQLite) が行う。
// 解析の単位はクラス (.cls + .cls-meta.xml)・トリガー (.trigger + .trigger-meta.xml)・匿名 Apex (.apex) で、
// 1 単位 = 1 つの解析結果 = 置き場の 1 単位 (id は class_<名前> / trigger_<名前> / anonymous_<名前>)。
// フォルダの読み込みは folder.ts、単位の解析は unit.ts (ファイルシステムに触らない)
import fs from 'node:fs/promises';

import { makeJsonSaveData, type SaveDataInfo } from '../commons';

import { getApexUnitPath, locateApexUnit, readApexUnit, searchApexUnits } from './folder';
import { APEX_UNIT_PREFIXES, parseApexUnitFiles, type ApexUnitParseResult } from './unit';

/** Apex の保存名 (class_ / trigger_ / anonymous_ で始まる) か */
export const isApexSaveId = (id: string): boolean =>
    Object.values(APEX_UNIT_PREFIXES).some((prefix) => id.startsWith(prefix));

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

    // 開発者でのデータ確認用
    static saveApexUnitForDeveloper(baseDir: string, target: ApexUnitParseResult): SaveDataInfo[] {
        return [makeJsonSaveData('Apex', baseDir, target.result.id, target)];
    }
}
