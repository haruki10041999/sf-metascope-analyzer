import fs from 'node:fs/promises';
import path from 'path';

import {
    CustomObjectJson,
    ErrorJson,
    OBJECT_MEMBERS,
    OBJECT_SUFFIX,
    ObjectMemberKey,
    ParsedXmlFile,
    SourceText,
    XmlSourceJson,
    XmlSourceRegistry,
    makeCustomObjectJson,
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

/** オブジェクトの保存名の接頭辞 (object_<API 名>) */
export const OBJECT_SAVE_PREFIX = 'object_';

/** オブジェクトの保存名 (object_<API 名>) か */
export const isObjectSaveId = (id: string): boolean => id.startsWith(OBJECT_SAVE_PREFIX);

const objectSaveIdOf = (id: string) => (isObjectSaveId(id) ? id : `${OBJECT_SAVE_PREFIX}${id}`);

/** オブジェクト 1 つ (フォルダ単位) の解析結果。Apex の ApexFileStructureType と同じ形 */
export type ObjectFileStructureType = {
    /** オブジェクトのフォルダのパス */
    filePath: string;
    resolvedError: XmlResolvedError[];
    dataType: 'object';
    result: {
        /** オブジェクトの API 名 */
        id: string;
        base: CustomObjectJson;
        sourceObject: XmlSourceJson[];
    };
};

/** object-meta.xml が読めなかったとき */
export type ErrorObjectFileStructureType = {
    filePath: string;
    resolvedError: XmlResolvedError[];
    dataType: 'error';
    result: {
        id: string;
        base: ErrorJson;
        sourceObject: XmlSourceJson[];
    };
};

export type ObjectParseResult = ObjectFileStructureType | ErrorObjectFileStructureType;

const toPosix = (p: string) => p.split(path.sep).join('/');

const isDirectory = async (p: string) =>
    fs
        .stat(p)
        .then((stat) => stat.isDirectory())
        .catch(() => false);

export class MetadataParser {
    /**
     * rootDir の下の objects フォルダにある、オブジェクトのフォルダを探す
     * (force-app/main/default/objects/<API 名>/ の形)
     */
    static async searchObjectDirectories(rootDir: string): Promise<string[]> {
        if (!(await isDirectory(rootDir))) {
            return [];
        }
        // objects フォルダそのものを渡されたときは、直下だけを見る (リポジトリ全体を走査しない)
        if (path.basename(rootDir) === 'objects') {
            return (await fs.readdir(rootDir, { withFileTypes: true }))
                .filter((entry) => entry.isDirectory())
                .map((entry) => path.join(rootDir, entry.name))
                .sort();
        }
        const entries = await fs.readdir(rootDir, { recursive: true, withFileTypes: true });
        return entries
            .filter((entry) => entry.isDirectory() && path.basename(entry.parentPath) === 'objects')
            .map((entry) => path.join(entry.parentPath, entry.name))
            .sort();
    }

    /** オブジェクトのフォルダ (objects/<API 名>/) を読み、CustomObjectJson にする */
    static async parseObject(objectDir: string): Promise<ObjectParseResult> {
        const apiName = path.basename(objectDir);
        const files: SourceText[] = [];
        const add = async (absolute: string, ...parts: string[]) =>
            files.push({
                fileName: parts[parts.length - 1]!,
                filePath: toPosix(path.join(apiName, ...parts)),
                source: await readSource(absolute),
            });

        const objectPath = path.join(objectDir, `${apiName}${OBJECT_SUFFIX}`);
        if (await fs.stat(objectPath).catch(() => undefined)) {
            await add(objectPath, `${apiName}${OBJECT_SUFFIX}`);
        }
        for (const key of Object.keys(OBJECT_MEMBERS) as ObjectMemberKey[]) {
            const { folder, suffix } = OBJECT_MEMBERS[key];
            const folderPath = path.join(objectDir, folder);
            const names = (await isDirectory(folderPath))
                ? (await fs.readdir(folderPath))
                      .filter((fileName) => fileName.endsWith(suffix))
                      .sort()
                : [];
            for (const fileName of names)
                await add(path.join(folderPath, fileName), folder, fileName);
        }
        return { ...MetadataParser.parseObjectSource(apiName, files), filePath: objectDir };
    }

    /**
     * 読み込み済みのファイルからオブジェクトを解析する (ファイルを読まない入口。git の before 側などに使う)。
     * files の filePath は <API 名>/<API 名>.object-meta.xml、<API 名>/<子のフォルダ>/<名前><接尾辞> の相対パス。
     * 結果の filePath は API 名
     */
    static parseObjectSource(apiName: string, files: SourceText[]): ObjectParseResult {
        const lf = (source: string) => source.replace(/\r\n?/g, '\n');
        const objectText = files.find(
            (file) => file.filePath === `${apiName}/${apiName}${OBJECT_SUFFIX}`,
        );
        const objectFile = objectText
            ? parseXmlSource(objectText.filePath, lf(objectText.source), apiName)
            : undefined;
        const members = {} as Record<ObjectMemberKey, ParsedXmlFile[]>;
        for (const key of Object.keys(OBJECT_MEMBERS) as ObjectMemberKey[]) {
            const { folder, suffix } = OBJECT_MEMBERS[key];
            members[key] = files
                .filter(
                    (file) =>
                        file.filePath.startsWith(`${apiName}/${folder}/`) &&
                        file.filePath.endsWith(suffix),
                )
                .sort((a, b) => a.filePath.localeCompare(b.filePath))
                .map((file) =>
                    parseXmlSource(
                        file.filePath,
                        lf(file.source),
                        file.fileName.slice(0, -suffix.length),
                    ),
                );
        }

        const registry = new XmlSourceRegistry();
        const source = { apiName, ...(objectFile ? { objectFile } : {}), members };
        const { object, problems } = makeCustomObjectJson(source, registry);
        const resolvedError = problems.map(toXmlResolvedError);

        // object-meta.xml 自体が読めなければ、オブジェクト全体をエラーにする (Apex のユニットのエラーと同じ)
        const objectProblem = problems.find((problem) => problem.kindType === 'object');
        if (objectProblem) {
            return {
                filePath: apiName,
                resolvedError,
                dataType: 'error',
                result: {
                    id: apiName,
                    base: objectProblem.error,
                    sourceObject: registry.toSourceObjects(),
                },
            };
        }
        return {
            filePath: apiName,
            resolvedError,
            dataType: 'object',
            result: { id: apiName, base: object, sourceObject: registry.toSourceObjects() },
        };
    }

    /** rootDir の下のすべてのオブジェクトを読む (API 名の順) */
    static async parseObjects(rootDir: string): Promise<ObjectParseResult[]> {
        const directories = await MetadataParser.searchObjectDirectories(rootDir);
        return Promise.all(directories.map((directory) => MetadataParser.parseObject(directory)));
    }

    // 本番用: msgpackr で <baseDir>/object_<API 名>.msgpack に保存する
    static saveObjectFile(baseDir: string, target: ObjectParseResult): SaveDataInfo[] {
        return [makeMsgPackSaveData('Object', baseDir, objectSaveIdOf(target.result.id), target)];
    }

    // 開発者でのデータ確認用
    static saveObjectFileForDeveloper(baseDir: string, target: ObjectParseResult): SaveDataInfo[] {
        return [makeJsonSaveData('Object', baseDir, target.result.id, target)];
    }

    /** saveObjectFile で保存したものを読み込む。id は保存名 (object_<API 名>) でも、API 名でもよい */
    static async readObjectMsgPack(baseDir: string, id: string): Promise<ObjectParseResult> {
        return readMsgPack<ObjectParseResult>(baseDir, objectSaveIdOf(id), 'object');
    }

    /** baseDir に保存したすべてのオブジェクトを読む。baseDir がなければ空 */
    static async readSavedObjects(baseDir: string): Promise<ObjectParseResult[]> {
        return readSavedMsgPacks(baseDir, isObjectSaveId, (id) =>
            MetadataParser.readObjectMsgPack(baseDir, id),
        );
    }
}
