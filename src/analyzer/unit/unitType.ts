import path from 'node:path';

import type { SaveDataInfo } from '../parser/commons';
import { ApexParser } from '../parser/Apex/parser';
import {
    APEX_UNIT_PREFIXES,
    type ApexUnitParseResult,
    type ApexUnitType,
    getApexUnitRole,
    parseApexUnitFiles,
} from '../parser/Apex/unit';
import { type LwcBundleEntry, makeLwcBundleFolder } from '../parser/Lwc/folder';
import { parseLwcBundleFolder } from '../parser/Lwc/bundle';
import { LWC_SAVE_PREFIX, LwcParser, type LwcBundleParseResult } from '../parser/Lwc/parser';
import { type AnyMetadataFolderParser, METADATA_FOLDER_PARSERS } from '../parser/Metadata/folders';
import type { MetadataFileParseResult } from '../parser/Metadata/folder';
import { assembleDecomposed, decomposedSuffixOf } from '../parser/Metadata/decomposed';
import {
    MetadataParser,
    OBJECT_SAVE_PREFIX,
    type ObjectParseResult,
} from '../parser/Metadata/parser';
import {
    OBJECT_TRANSLATION_SAVE_PREFIX,
    ObjectTranslationParser,
    type ObjectTranslationParseResult,
} from '../parser/Metadata/objectTranslation';
import type { SourceText } from '../types';
import { makeApexUnitDiffs } from '../processor/Apex/diff/unit';
import { makeLwcBundleDiffs } from '../processor/Lwc/diff/bundle';
import { METADATA_UNIT_DIFFS } from '../processor/Metadata/diff/metadataFile';
import {
    makeObjectTranslationUnitDiffs,
    makeObjectUnitDiffs,
} from '../processor/Metadata/diff/unit';
import type { IdParseResult, IdUnitDiff } from '../processor/commons/diff/unit';

// 単位の種類 (UnitType)。種類ごとの違い (どのファイルが単位か・parse・保存・Diff) を 1 つの定義にまとめ、
// 一覧 (UNIT_TYPES) から Repository・worker・Diff が引く。方針: docs/analysis-plan.md 2 章
//
// 単位の場所 (location) はリポジトリからの相対パス (区切りは /)。
// - ファイルが単位のもの (Apex・権限セットなど): 単位のファイルのパス (Apex はソースのパス。-meta.xml だけでも同じ)
// - フォルダが単位のもの (LWC・オブジェクト・翻訳・Aura): フォルダのパス
// parseUnit に渡すファイル (SourceText) の filePath は、単位の場所の親フォルダからの相対パス
// (ソース位置・resolvedError に残るパスで、今までの parser と同じ)。結果の filePath はリポジトリからの相対パスで、
// Repository がリポジトリのルートを付ける

/** 単位の解析結果 (どの種類も同じ形) */
export type UnitParseResult = IdParseResult;

/** 単位の差分 (どの種類も同じ形) */
export type UnitDiff = IdUnitDiff<UnitParseResult, unknown>;

export type UnitType<R extends UnitParseResult = UnitParseResult> = {
    /** 種類 ('apexClass' / 'lwc' / 'object' / 'permissionSet' など) */
    readonly type: string;
    /** 保存名の接頭辞 (<接頭辞><名前>) */
    readonly prefix: string;
    /** ファイル (リポジトリからの相対パス) が属する単位の場所。この種類のファイルでなければ undefined */
    locate(filePath: string): string | undefined;
    /** 単位として読むか (ファイルの一覧 files に、単位の主なファイルがあるか) */
    exists(location: string, files: ReadonlySet<string>): boolean;
    /** 単位のファイル (files はリポジトリのすべてのファイル) */
    filesOf(location: string, files: readonly string[]): string[];
    /** 読み込み済みのファイルを解析する (ファイルを読まない) */
    parseUnit(location: string, files: SourceText[]): R | Promise<R>;
    /** 解析結果の id から、単位の名前 (クラス名・バンドル名・API 名・権限セット名など) */
    name(result: R): string;
    /** 保存 (本番用。<baseDir>/<保存名>.msgpack) */
    save(baseDir: string, result: R): SaveDataInfo[];
    /** 保存したものを読む。id は保存名 */
    load(baseDir: string, saveId: string): Promise<R>;
    /** 解析結果の保存名 */
    saveIdOf(result: R): string;
    /** before / after の単位を id で対応付けた差分 */
    diffs(before: R[], after: R[]): IdUnitDiff<R, unknown>[];
};

/** どの種類も入る型 (種類ごとの型の共用体にすると TS2590 になるため) */
export type AnyUnitType = UnitType<UnitParseResult>;

const parentOf = (location: string) => path.posix.dirname(location);
const baseOf = (location: string) => path.posix.basename(location);

/** 親フォルダからの相対パスにした SourceText */
const relativeTo = (location: string, files: SourceText[]): SourceText[] => {
    const parent = parentOf(location);
    return files.map((file) => ({
        ...file,
        filePath: parent === '.' ? file.filePath : file.filePath.slice(parent.length + 1),
    }));
};

/** パスの中の、名前が folder のフォルダの直下の名前の位置 (lwc/<名前>/... の <名前> の位置)。なければ -1 */
const indexUnder = (parts: string[], folder: string): number => {
    const index = parts.lastIndexOf(folder, parts.length - 2);
    return index >= 0 && index + 1 < parts.length - 1 ? index + 1 : -1;
};

/** フォルダが単位の種類の、単位の場所 (<...>/<folder>/<名前>) */
const locateFolderUnit = (filePath: string, folder: string): string | undefined => {
    const parts = filePath.split('/');
    const index = indexUnder(parts, folder);
    return index < 0 ? undefined : parts.slice(0, index + 1).join('/');
};

const filesUnder = (location: string, files: readonly string[]) =>
    files.filter((file) => file.startsWith(`${location}/`));

const stripPrefix = (prefix: string, id: string) =>
    id.startsWith(prefix) ? id.slice(prefix.length) : id;

// ---------------------------------------------------------------------------
// Apex (クラス・トリガー・匿名 Apex)
// ---------------------------------------------------------------------------

const APEX_SOURCE_EXTENSIONS: Readonly<Record<ApexUnitType, string>> = {
    class: '.cls',
    trigger: '.trigger',
    anonymous: '.apex',
};

const apexUnitType = (type: string, unitType: ApexUnitType): UnitType<ApexUnitParseResult> => {
    const prefix = APEX_UNIT_PREFIXES[unitType];
    const extension = APEX_SOURCE_EXTENSIONS[unitType];
    return {
        type,
        prefix,
        locate: (filePath) => {
            if (filePath.split('/').includes('node_modules')) return undefined;
            const role = getApexUnitRole(baseOf(filePath));
            if (!role || role.unitType !== unitType) return undefined;
            return path.posix.join(parentOf(filePath), `${role.name}${extension}`);
        },
        exists: () => true,
        filesOf: (location, files) =>
            files.filter((file) => file === location || file === `${location}-meta.xml`),
        parseUnit: (location, files) => {
            const fileName = baseOf(location);
            const name = fileName.slice(0, -extension.length);
            const sourceFile = files.find((file) => file.fileName === fileName);
            const metaFile = files.find((file) => file.fileName === `${fileName}-meta.xml`);
            const main = sourceFile ?? metaFile;
            return parseApexUnitFiles({
                unitType,
                name,
                filePath: main ? path.posix.join(parentOf(location), main.fileName) : location,
                ...(sourceFile
                    ? { source: { fileName: sourceFile.fileName, source: sourceFile.source } }
                    : {}),
                ...(metaFile
                    ? { meta: { fileName: metaFile.fileName, source: metaFile.source } }
                    : {}),
            });
        },
        name: (result) => stripPrefix(prefix, result.result.id),
        save: (baseDir, result) => ApexParser.saveApexUnit(baseDir, result),
        load: (baseDir, saveId) => ApexParser.readApexMsgPack(baseDir, saveId),
        saveIdOf: (result) => result.result.id,
        diffs: (before, after) => makeApexUnitDiffs(before, after),
    };
};

// ---------------------------------------------------------------------------
// LWC (バンドル)
// ---------------------------------------------------------------------------

const lwcUnitType: UnitType<LwcBundleParseResult> = {
    type: 'lwc',
    prefix: LWC_SAVE_PREFIX,
    locate: (filePath) => locateFolderUnit(filePath, 'lwc'),
    exists: () => true,
    filesOf: filesUnder,
    parseUnit: (location, files) => {
        const name = baseOf(location);
        // 直下のファイルと、直下のフォルダ (__tests__/ など。中は読まない)
        const entries = new Map<string, LwcBundleEntry>();
        for (const file of relativeTo(location, files)) {
            const [, child, ...rest] = file.filePath.split('/');
            if (!child) continue;
            entries.set(
                child,
                rest.length
                    ? { name: child, isDirectory: true }
                    : { name: child, isDirectory: false, source: file.source },
            );
        }
        return parseLwcBundleFolder(makeLwcBundleFolder(name, location, [...entries.values()]));
    },
    name: (result) => result.result.id,
    save: (baseDir, result) => LwcParser.saveLwcBundle(baseDir, result),
    load: (baseDir, saveId) => LwcParser.readLwcMsgPack(baseDir, saveId),
    saveIdOf: (result) => `${LWC_SAVE_PREFIX}${result.result.id}`,
    diffs: (before, after) => makeLwcBundleDiffs(before, after),
};

// ---------------------------------------------------------------------------
// オブジェクト・翻訳
// ---------------------------------------------------------------------------

const OBJECT_MDAPI_SUFFIX = '.object';

const objectUnitType: UnitType<ObjectParseResult> = {
    type: 'object',
    prefix: OBJECT_SAVE_PREFIX,
    locate: (filePath) => {
        // メタデータ API の形式: objects/<API 名>.object (1 ファイルの中に項目などを書く)
        const parts = filePath.split('/');
        if (parts[parts.length - 2] === 'objects' && filePath.endsWith(OBJECT_MDAPI_SUFFIX)) {
            return filePath;
        }
        return locateFolderUnit(filePath, 'objects');
    },
    exists: () => true,
    filesOf: (location, files) =>
        location.endsWith(OBJECT_MDAPI_SUFFIX)
            ? files.filter((file) => file === location)
            : filesUnder(location, files),
    parseUnit: (location, files) => ({
        ...MetadataParser.parseObjectSource(
            baseOf(location).replace(/.object$/, ''),
            relativeTo(location, files),
        ),
        filePath: location,
    }),
    name: (result) => result.result.id,
    save: (baseDir, result) => MetadataParser.saveObjectFile(baseDir, result),
    load: (baseDir, saveId) => MetadataParser.readObjectMsgPack(baseDir, saveId),
    saveIdOf: (result) => `${OBJECT_SAVE_PREFIX}${result.result.id}`,
    diffs: (before, after) => makeObjectUnitDiffs(before, after),
};

const objectTranslationUnitType: UnitType<ObjectTranslationParseResult> = {
    type: 'objectTranslation',
    prefix: OBJECT_TRANSLATION_SAVE_PREFIX,
    locate: (filePath) => locateFolderUnit(filePath, 'objectTranslations'),
    exists: () => true,
    filesOf: filesUnder,
    parseUnit: (location, files) => ({
        ...ObjectTranslationParser.parseObjectTranslationSource(
            baseOf(location),
            relativeTo(location, files),
        ),
        filePath: location,
    }),
    name: (result) => result.result.id,
    save: (baseDir, result) => ObjectTranslationParser.saveObjectTranslationFile(baseDir, result),
    load: (baseDir, saveId) =>
        ObjectTranslationParser.readObjectTranslationMsgPack(baseDir, saveId),
    saveIdOf: (result) => `${OBJECT_TRANSLATION_SAVE_PREFIX}${result.result.id}`,
    diffs: (before, after) => makeObjectTranslationUnitDiffs(before, after),
};

// ---------------------------------------------------------------------------
// フォルダ単位のメタデータ (権限・ラベル・Flow・画面・B / C の種類)
// ---------------------------------------------------------------------------

/**
 * フォルダ単位のメタデータの種類 (MetadataFolderParser の設定から作る)。
 * file: <folder>/<名前><suffix>、nested: <folder>/<サブフォルダ>/<名前><suffix>、bundle: <folder>/<名前>/ が単位
 */
export const metadataFolderUnitType = (
    parser: AnyMetadataFolderParser,
): UnitType<MetadataFileParseResult> => {
    const { type, folder, suffix, layout = 'file', companions = [], bundleMain = [] } = parser.spec;
    const depth = layout === 'nested' ? 2 : 1;
    /**
     * メタデータ API の形式 (src/workflows/X.workflow など) の接尾辞。sfdx の接尾辞から -meta.xml を除いたもの。
     * 中身 (ルート要素) は sfdx の形式と同じ
     */
    const mdapiSuffix = suffix.replace(/-meta.xml$/, '');
    const isMdapi = (fileName: string) =>
        mdapiSuffix !== suffix && fileName.endsWith(mdapiSuffix) && !fileName.endsWith(suffix);
    /** 単位のファイル名から、名前 (接尾辞を除いたもの) */
    const baseNameOf = (fileName: string) =>
        fileName.slice(0, -(isMdapi(fileName) ? mdapiSuffix : suffix).length);

    /**
     * file・nested: ファイル名 → 単位のファイル名 (companions は単位のファイル名にする)。
     * メタデータ API の形式のファイルは、そのファイルが単位
     */
    const mainFileName = (fileName: string): string | undefined => {
        if (fileName.endsWith(suffix)) return fileName;
        const companion = companions.find((c) => fileName.endsWith(c));
        if (companion) return `${fileName.slice(0, -companion.length)}${suffix}`;
        return isMdapi(fileName) ? fileName : undefined;
    };

    /**
     * 分解された形式の単位の場所。folder: <folder>/<名前> (フォルダ)、all: <folder>/<名前> (CustomLabels。ファイルはない)
     */
    const decomposed = parser.spec.decomposed;
    const locateDecomposed = (filePath: string): string | undefined => {
        if (!decomposed || layout === 'bundle') return undefined;
        const parts = filePath.split('/');
        const fileName = parts[parts.length - 1]!;
        if (decomposed.unit === 'folder') {
            const index = parts.lastIndexOf(folder, parts.length - 3);
            if (index < 0 || !fileName.endsWith('-meta.xml')) return undefined;
            return parts.slice(0, index + 2).join('/');
        }
        if (parts[parts.length - 2] !== folder || fileName.endsWith(suffix)) return undefined;
        if (!decomposedSuffixOf(decomposed, fileName)) return undefined;
        return [...parts.slice(0, -1), decomposed.name ?? type].join('/');
    };
    const isDecomposed = (location: string) =>
        decomposed !== undefined &&
        layout !== 'bundle' &&
        !location.endsWith(suffix) &&
        !isMdapi(baseOf(location));

    /** 分解された形式の単位を組み立てて解析する */
    const parseDecomposed = (location: string, files: SourceText[]) => {
        const name = decomposed!.unit === 'all' ? (decomposed!.name ?? type) : baseOf(location);
        // 結果に残るパスは <folder>/<...> (1 つの XML のときと同じく、種類のフォルダから)
        const relative = relativeTo(location, files)
            .map((file) => ({ ...file, filePath: `${folder}/${file.filePath}` }))
            .sort((a, b) => a.filePath.localeCompare(b.filePath));
        const main = relative.find((file) => file.fileName === `${name}${suffix}`);
        const assembled = assembleDecomposed(
            decomposed!,
            name,
            `${folder}/${name}`,
            main,
            relative,
        );
        return {
            ...parser.parseXmlFile(assembled.filePath, assembled, { name }),
            filePath: location,
        };
    };

    return {
        type,
        prefix: parser.prefix,
        locate: (filePath) => {
            const parts = filePath.split('/');
            const index = parts.lastIndexOf(folder, parts.length - 2);
            if (index < 0) return undefined;
            if (layout === 'bundle') {
                return index + 2 < parts.length ? parts.slice(0, index + 2).join('/') : undefined;
            }
            if (parts.length - 1 - index !== depth) return locateDecomposed(filePath);
            const main = mainFileName(parts[parts.length - 1]!);
            return main ? [...parts.slice(0, -1), main].join('/') : locateDecomposed(filePath);
        },
        exists: (location, files) =>
            layout === 'bundle' ||
            isDecomposed(location) ||
            // メタデータ API の形式のファイルは、同じ名前の sfdx のファイル (-meta.xml) があれば、その付属のファイル
            (files.has(location) &&
                !(isMdapi(baseOf(location)) && files.has(`${location}-meta.xml`))),
        filesOf: (location, files) => {
            if (isDecomposed(location)) {
                if (decomposed!.unit === 'folder') {
                    return filesUnder(location, files).filter((file) => file.endsWith('-meta.xml'));
                }
                const parent = parentOf(location);
                return files.filter(
                    (file) =>
                        parentOf(file) === parent &&
                        !file.endsWith(suffix) &&
                        decomposedSuffixOf(decomposed!, baseOf(file)) !== undefined,
                );
            }
            if (layout === 'bundle') {
                // 直下のファイルだけ
                return files.filter(
                    (file) =>
                        file.startsWith(`${location}/`) &&
                        !file.slice(location.length + 1).includes('/'),
                );
            }
            const base = `${parentOf(location)}/${baseNameOf(baseOf(location))}`;
            return files.filter(
                (file) => file === location || companions.some((c) => file === `${base}${c}`),
            );
        },
        parseUnit: (location, files) => {
            if (isDecomposed(location)) return parseDecomposed(location, files);
            const relative = relativeTo(location, files);
            if (layout === 'bundle') {
                const name = baseOf(location);
                const main = bundleMain
                    .map((ext) => `${name}.${ext}`)
                    .find((fileName) => relative.some((file) => file.fileName === fileName));
                const mainFile = relative.find((file) => file.fileName === main);
                const result = parser.parseSource(
                    `${folder}/${name}/${main ?? name}`,
                    mainFile?.source ?? '',
                    {
                        // 結果に残るパスは <フォルダ>/<バンドル名>/<ファイル名>
                        extras: relative
                            .filter((file) => file !== mainFile)
                            .map((file) => ({
                                ...file,
                                filePath: `${folder}/${name}/${file.fileName}`,
                            })),
                        name,
                    },
                );
                return { ...result, filePath: location };
            }
            const fileName = baseOf(location);
            const mainFile = relative.find((file) => file.fileName === fileName);
            const base = baseNameOf(fileName);
            const group = layout === 'nested' ? baseOf(parentOf(location)) : undefined;
            const relativeFolder = group ? `${folder}/${group}` : folder;
            const result = parser.parseSource(
                `${relativeFolder}/${fileName}`,
                mainFile?.source ?? '',
                {
                    // companions は、結果に残るパスを <フォルダ>/<ファイル名> にそろえる
                    extras: relative
                        .filter((file) => file !== mainFile)
                        .map((file) => ({
                            ...file,
                            filePath: `${relativeFolder}/${file.fileName}`,
                        })),
                    name: group ? `${group}/${base}` : base,
                },
            );
            return { ...result, filePath: location };
        },
        name: (result) => stripPrefix(parser.prefix, result.result.id),
        save: (baseDir, result) => parser.save(baseDir, result as never),
        load: (baseDir, saveId) => parser.read(baseDir, saveId),
        saveIdOf: (result) => result.result.id,
        diffs: (before, after) => {
            const make = METADATA_UNIT_DIFFS[type];
            if (!make) throw new Error(`No unit diff for ${type}`);
            return make(before, after) as IdUnitDiff<MetadataFileParseResult, unknown>[];
        },
    };
};

// ---------------------------------------------------------------------------
// 一覧
// ---------------------------------------------------------------------------

/** すべての単位の種類。Repository・worker・Diff はここから引く */
export const UNIT_TYPES: readonly AnyUnitType[] = [
    apexUnitType('apexClass', 'class'),
    apexUnitType('apexTrigger', 'trigger'),
    apexUnitType('anonymousApex', 'anonymous'),
    lwcUnitType,
    objectUnitType,
    objectTranslationUnitType,
    ...METADATA_FOLDER_PARSERS.map(metadataFolderUnitType),
] as AnyUnitType[];

/** 種類の名前から */
export const findUnitType = (type: string): AnyUnitType | undefined =>
    UNIT_TYPES.find((unitType) => unitType.type === type);

/** 保存名から (接頭辞が長いものを先に見る。object_ と objectTranslation_ など) */
export const findUnitTypeBySaveId = (saveId: string): AnyUnitType | undefined =>
    [...UNIT_TYPES]
        .sort((a, b) => b.prefix.length - a.prefix.length)
        .find((unitType) => saveId.startsWith(unitType.prefix));

/** 単位の名前 (種類ごとの id の付け方の違いを吸収する)。type は単位の種類 */
export const unitName = (type: string, result: UnitParseResult): string => {
    const unitType = findUnitType(type);
    if (!unitType) throw new Error(`Unknown unit type: ${type}`);
    return unitType.name(result);
};
