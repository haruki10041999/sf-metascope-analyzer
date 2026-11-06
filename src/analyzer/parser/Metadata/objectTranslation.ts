import fs from 'node:fs/promises';
import path from 'path';

import {
    CustomObjectTranslationJson,
    ErrorJson,
    FIELD_TRANSLATION_SUFFIX,
    SourceText,
    OBJECT_TRANSLATION_SUFFIX,
    XmlSourceJson,
    XmlSourceRegistry,
    makeCustomObjectTranslationJson,
} from '../../types';
import {
    SaveDataInfo,
    XmlResolvedError,
    makeJsonSaveData,
    makeMsgPackSaveData,
    parseXmlSource,
    readMsgPack,
    readSavedMsgPacks,
    readSource,
    toXmlResolvedError,
} from '../commons';

// 方針: docs/object-translation.md

/** オブジェクトの翻訳 1 つ (<オブジェクト>-<言語> のフォルダ単位) の解析結果。オブジェクトの解析結果と同じ形 */
export type ObjectTranslationFileStructureType = {
    /** 翻訳のフォルダのパス */
    filePath: string;
    resolvedError: XmlResolvedError[];
    dataType: 'objectTranslation';
    result: {
        /** フォルダ名 (<オブジェクト>-<言語>) */
        id: string;
        base: CustomObjectTranslationJson;
        sourceObject: XmlSourceJson[];
    };
};

/** objectTranslation-meta.xml が読めなかったとき */
export type ErrorObjectTranslationFileStructureType = {
    filePath: string;
    resolvedError: XmlResolvedError[];
    dataType: 'error';
    result: {
        id: string;
        base: ErrorJson;
        sourceObject: XmlSourceJson[];
    };
};

export type ObjectTranslationParseResult =
    ObjectTranslationFileStructureType | ErrorObjectTranslationFileStructureType;

/**
 * 保存名の接頭辞。オブジェクト (<API 名>.msgpack) と同じフォルダに保存しても分けられるようにする
 * (Apex の単位の class_ / trigger_ / anonymous_ と同じ)
 */
export const OBJECT_TRANSLATION_SAVE_PREFIX = 'objectTranslation_';

/** 翻訳の保存名 (objectTranslation_<オブジェクト>-<言語>) か */
export const isObjectTranslationSaveId = (id: string): boolean =>
    id.startsWith(OBJECT_TRANSLATION_SAVE_PREFIX);

const toPosix = (p: string) => p.split(path.sep).join('/');

const isDirectory = async (p: string) =>
    fs
        .stat(p)
        .then((stat) => stat.isDirectory())
        .catch(() => false);

/** 項目の翻訳のファイル。sfdx ではフォルダの直下に置く (fields フォルダに置いたものも読む) */
const listFieldFiles = async (
    directory: string,
): Promise<{ absolute: string; relative: string }[]> => {
    const files: { absolute: string; relative: string }[] = [];
    for (const sub of ['', 'fields']) {
        const folder = path.join(directory, sub);
        if (!(await isDirectory(folder))) continue;
        (await fs.readdir(folder))
            .filter((name) => name.endsWith(FIELD_TRANSLATION_SUFFIX))
            .sort()
            .forEach((name) =>
                files.push({ absolute: path.join(folder, name), relative: path.join(sub, name) }),
            );
    }
    return files;
};

export class ObjectTranslationParser {
    /** rootDir の下の objectTranslations フォルダにある、翻訳のフォルダ (<オブジェクト>-<言語>/) を探す */
    static async searchObjectTranslationDirectories(rootDir: string): Promise<string[]> {
        if (!(await isDirectory(rootDir))) {
            return [];
        }
        // objectTranslations フォルダそのものを渡されたときは、直下だけを見る
        if (path.basename(rootDir) === 'objectTranslations') {
            return (await fs.readdir(rootDir, { withFileTypes: true }))
                .filter((entry) => entry.isDirectory())
                .map((entry) => path.join(rootDir, entry.name))
                .sort();
        }
        const entries = await fs.readdir(rootDir, { recursive: true, withFileTypes: true });
        return entries
            .filter(
                (entry) =>
                    entry.isDirectory() && path.basename(entry.parentPath) === 'objectTranslations',
            )
            .map((entry) => path.join(entry.parentPath, entry.name))
            .sort();
    }

    /** 翻訳のフォルダ (objectTranslations/<オブジェクト>-<言語>/) を読み、CustomObjectTranslationJson にする */
    static async parseObjectTranslation(directory: string): Promise<ObjectTranslationParseResult> {
        const name = path.basename(directory);
        const relative = (p: string) => toPosix(path.join(name, p));

        const files: SourceText[] = [];
        const objectPath = path.join(directory, `${name}${OBJECT_TRANSLATION_SUFFIX}`);
        if (await fs.stat(objectPath).catch(() => undefined)) {
            files.push({
                fileName: `${name}${OBJECT_TRANSLATION_SUFFIX}`,
                filePath: relative(`${name}${OBJECT_TRANSLATION_SUFFIX}`),
                source: await readSource(objectPath),
            });
        }
        for (const { absolute, relative: p } of await listFieldFiles(directory)) {
            files.push({
                fileName: path.basename(p),
                filePath: relative(p),
                source: await readSource(absolute),
            });
        }
        return {
            ...ObjectTranslationParser.parseObjectTranslationSource(name, files),
            filePath: directory,
        };
    }

    /**
     * 読み込み済みのファイルから翻訳を解析する (ファイルを読まない入口。git の before 側などに使う)。
     * name は <オブジェクト>-<言語>。files の filePath は <name>/<name>.objectTranslation-meta.xml と、
     * <name>/<項目>.fieldTranslation-meta.xml (fields/ の下でもよい)。結果の filePath は name
     */
    static parseObjectTranslationSource(
        name: string,
        files: SourceText[],
    ): ObjectTranslationParseResult {
        const directory = name;
        const lf = (source: string) => source.replace(/\r\n?/g, '\n');
        const objectText = files.find(
            (file) => file.filePath === `${name}/${name}${OBJECT_TRANSLATION_SUFFIX}`,
        );
        const objectFile = objectText
            ? parseXmlSource(objectText.filePath, lf(objectText.source), name)
            : undefined;
        const fieldFiles = files
            .filter((file) => file.fileName.endsWith(FIELD_TRANSLATION_SUFFIX))
            .sort((a, b) => a.filePath.localeCompare(b.filePath))
            .map((file) =>
                parseXmlSource(
                    file.filePath,
                    lf(file.source),
                    file.fileName.slice(0, -FIELD_TRANSLATION_SUFFIX.length),
                ),
            );

        const registry = new XmlSourceRegistry();
        const { translation, problems } = makeCustomObjectTranslationJson(
            { name, ...(objectFile ? { objectFile } : {}), fieldFiles },
            registry,
        );
        const resolvedError = problems.map(toXmlResolvedError);
        const sourceObject = registry.toSourceObjects();

        // objectTranslation-meta.xml 自体が読めなければ、翻訳全体をエラーにする (オブジェクトと同じ)
        const objectProblem = problems.find((problem) => problem.kindType === 'objectTranslation');
        if (objectProblem) {
            return {
                filePath: directory,
                resolvedError,
                dataType: 'error',
                result: { id: name, base: objectProblem.error, sourceObject },
            };
        }
        return {
            filePath: directory,
            resolvedError,
            dataType: 'objectTranslation',
            result: { id: name, base: translation, sourceObject },
        };
    }

    /** rootDir の下のすべての翻訳を読む (フォルダ名の順) */
    static async parseObjectTranslations(rootDir: string): Promise<ObjectTranslationParseResult[]> {
        const directories =
            await ObjectTranslationParser.searchObjectTranslationDirectories(rootDir);
        return Promise.all(
            directories.map((directory) =>
                ObjectTranslationParser.parseObjectTranslation(directory),
            ),
        );
    }

    // 本番用: msgpackr で <baseDir>/objectTranslation_<オブジェクト>-<言語>.msgpack に保存する
    static saveObjectTranslationFile(
        baseDir: string,
        target: ObjectTranslationParseResult,
    ): SaveDataInfo[] {
        return [
            makeMsgPackSaveData(
                'ObjectTranslation',
                baseDir,
                `${OBJECT_TRANSLATION_SAVE_PREFIX}${target.result.id}`,
                target,
            ),
        ];
    }

    // 開発者でのデータ確認用
    static saveObjectTranslationFileForDeveloper(
        baseDir: string,
        target: ObjectTranslationParseResult,
    ): SaveDataInfo[] {
        return [makeJsonSaveData('ObjectTranslation', baseDir, target.result.id, target)];
    }

    /** saveObjectTranslationFile で保存したものを読み込む。id は保存名 (接頭辞付き) でも、フォルダ名でもよい */
    static async readObjectTranslationMsgPack(
        baseDir: string,
        id: string,
    ): Promise<ObjectTranslationParseResult> {
        const saveId = id.startsWith(OBJECT_TRANSLATION_SAVE_PREFIX)
            ? id
            : `${OBJECT_TRANSLATION_SAVE_PREFIX}${id}`;
        return readMsgPack<ObjectTranslationParseResult>(baseDir, saveId, 'object translation');
    }

    /** baseDir に保存したすべての翻訳を読む。baseDir がなければ空 */
    static async readSavedObjectTranslations(
        baseDir: string,
    ): Promise<ObjectTranslationParseResult[]> {
        return readSavedMsgPacks(baseDir, isObjectTranslationSaveId, (id) =>
            ObjectTranslationParser.readObjectTranslationMsgPack(baseDir, id),
        );
    }
}
