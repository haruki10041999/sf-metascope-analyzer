// Apex のファイルを、フォルダごとに単位 (クラス・トリガー・匿名 Apex) にまとめる (unit.ts)。
// classes フォルダの Foo.cls と Foo.cls-meta.xml は 1 つのクラス、triggers フォルダの Bar.trigger と
// Bar.trigger-meta.xml は 1 つのトリガー、.apex は 1 ファイルで 1 つの匿名 Apex
import fs from 'node:fs/promises';
import path from 'node:path';

import { readSource } from '../commons';

import { getApexUnitId, getApexUnitRole, type ApexUnitFiles, type ApexUnitType } from './unit';

/** 単位の場所 (読み込む前)。ソース・メタデータのどちらかはある */
export type ApexUnitLocation = {
    unitType: ApexUnitType;
    name: string;
    directory: string;
    sourceFileName?: string;
    metaFileName?: string;
};

/** 単位の主なファイルのパス (ソースがあればソース、なければ -meta.xml)。ApexParser.parseApexUnit に渡すパス */
export const getApexUnitPath = (location: ApexUnitLocation): string =>
    path.join(location.directory, location.sourceFileName ?? location.metaFileName!);

/** 1 つのフォルダのファイル名を、単位にまとめる */
const groupFiles = (directory: string, fileNames: string[]): ApexUnitLocation[] => {
    const units = new Map<string, ApexUnitLocation>();
    for (const fileName of fileNames) {
        const role = getApexUnitRole(fileName);
        if (!role) continue;
        const key = getApexUnitId(role.unitType, role.name);
        const unit = units.get(key) ?? { unitType: role.unitType, name: role.name, directory };
        if (role.role === 'source') unit.sourceFileName = fileName;
        else unit.metaFileName = fileName;
        units.set(key, unit);
    }
    return [...units.values()];
};

const byId = (a: ApexUnitLocation, b: ApexUnitLocation) =>
    getApexUnitId(a.unitType, a.name).localeCompare(getApexUnitId(b.unitType, b.name)) ||
    a.directory.localeCompare(b.directory);

/**
 * rootDir 配下の単位の一覧。フォルダごとにファイルをまとめる (classes / triggers / 匿名 Apex のフォルダ)。
 * node_modules の中は見ない
 */
export const searchApexUnits = async (rootDir: string): Promise<ApexUnitLocation[]> => {
    const entries = await fs.readdir(rootDir, { recursive: true, withFileTypes: true });
    const byDirectory = new Map<string, string[]>();
    for (const entry of entries) {
        if (!entry.isFile() || entry.parentPath.split(path.sep).includes('node_modules')) continue;
        byDirectory.set(entry.parentPath, [
            ...(byDirectory.get(entry.parentPath) ?? []),
            entry.name,
        ]);
    }
    return [...byDirectory]
        .flatMap(([directory, names]) => groupFiles(directory, names))
        .sort(byId);
};

/** 単位のどれかのファイル (ソースか -meta.xml) のパスから、その単位の場所を決める (同じフォルダのもう片方も探す) */
export const locateApexUnit = async (filePath: string): Promise<ApexUnitLocation> => {
    const role = getApexUnitRole(path.basename(filePath));
    if (!role) {
        throw new Error(`not an Apex file: ${filePath}`);
    }
    const directory = path.dirname(filePath);
    const names = (await fs.readdir(directory, { withFileTypes: true }))
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name);
    const unit = groupFiles(directory, names).find(
        (u) => u.unitType === role.unitType && u.name === role.name,
    );
    if (!unit) {
        throw new Error(`Apex file not found: ${filePath}`);
    }
    return unit;
};

/** 単位のファイルを読む */
export const readApexUnit = async (location: ApexUnitLocation): Promise<ApexUnitFiles> => {
    const read = async (fileName: string | undefined) =>
        fileName
            ? { fileName, source: await readSource(path.join(location.directory, fileName)) }
            : undefined;
    const [source, meta] = await Promise.all([
        read(location.sourceFileName),
        read(location.metaFileName),
    ]);
    return {
        unitType: location.unitType,
        name: location.name,
        filePath: getApexUnitPath(location),
        ...(source ? { source } : {}),
        ...(meta ? { meta } : {}),
    };
};
