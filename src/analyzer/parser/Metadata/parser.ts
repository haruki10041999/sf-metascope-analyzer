import fs from 'node:fs/promises';
import path from 'path';

import {
    CustomObjectJson,
    ErrorJson,
    OBJECT_MEMBERS,
    OBJECT_SUFFIX,
    ObjectMemberKey,
    ParsedXmlFile,
    XmlSourceJson,
    XmlSourceRegistry,
    makeCustomObjectJson,
} from '../../types';
import {
    SaveDataInfo,
    XmlResolvedError,
    makeJsonSaveData,
    makeMsgPackSaveData,
    readMsgPack,
    readXmlFile,
    toXmlResolvedError,
} from '../commons';
import { APEX_UNIT_PREFIXES } from '../Apex/unit';
import { LWC_SAVE_PREFIX } from '../Lwc/parser';
import { OBJECT_TRANSLATION_SAVE_PREFIX } from './objectTranslation';

/** 同じ保存先に置くほかの種類の保存名の接頭辞 (オブジェクトは API 名のまま保存するので、これら以外がオブジェクト) */
const OTHER_SAVE_PREFIXES = [
    OBJECT_TRANSLATION_SAVE_PREFIX,
    ...Object.values(APEX_UNIT_PREFIXES),
    LWC_SAVE_PREFIX,
];

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
        const relative = (...parts: string[]) => toPosix(path.join(apiName, ...parts));

        const objectPath = path.join(objectDir, `${apiName}${OBJECT_SUFFIX}`);
        const objectFile = (await fs.stat(objectPath).catch(() => undefined))
            ? await readXmlFile(objectPath, relative(`${apiName}${OBJECT_SUFFIX}`), apiName)
            : undefined;

        const members = {} as Record<ObjectMemberKey, ParsedXmlFile[]>;
        for (const key of Object.keys(OBJECT_MEMBERS) as ObjectMemberKey[]) {
            const { folder, suffix } = OBJECT_MEMBERS[key];
            const folderPath = path.join(objectDir, folder);
            const names = (await isDirectory(folderPath))
                ? (await fs.readdir(folderPath))
                      .filter((fileName) => fileName.endsWith(suffix))
                      .sort()
                : [];
            members[key] = await Promise.all(
                names.map((fileName) =>
                    readXmlFile(
                        path.join(folderPath, fileName),
                        relative(folder, fileName),
                        fileName.slice(0, -suffix.length),
                    ),
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
                filePath: objectDir,
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
            filePath: objectDir,
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

    // 本番用: msgpackr で <baseDir>/<API 名>.msgpack に保存する
    static saveObjectFile(baseDir: string, target: ObjectParseResult): SaveDataInfo[] {
        return [makeMsgPackSaveData('Object', baseDir, target.result.id, target)];
    }

    // 開発者でのデータ確認用
    static saveObjectFileForDevelopper(baseDir: string, target: ObjectParseResult): SaveDataInfo[] {
        return [makeJsonSaveData('Object', baseDir, target.result.id, target)];
    }

    // 本番用: saveObjectFile で保存した <baseDir>/<API 名>.msgpack を読み込む
    static async readObjectMsgPack(baseDir: string, id: string): Promise<ObjectParseResult> {
        return readMsgPack<ObjectParseResult>(baseDir, id, 'object');
    }

    /** baseDir に保存したすべてのオブジェクトを読む。baseDir がなければ空 */
    static async readSavedObjects(baseDir: string): Promise<ObjectParseResult[]> {
        const names = await fs.readdir(baseDir).catch(() => [] as string[]);
        return Promise.all(
            names
                // 同じフォルダに保存したほかの種類 (翻訳・Apex・LWC) は除く
                .filter(
                    (name) =>
                        name.endsWith('.msgpack') &&
                        !OTHER_SAVE_PREFIXES.some((prefix) => name.startsWith(prefix)),
                )
                .sort()
                .map((name) =>
                    MetadataParser.readObjectMsgPack(baseDir, name.slice(0, -'.msgpack'.length)),
                ),
        );
    }
}
