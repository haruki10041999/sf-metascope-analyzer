import fs from 'node:fs/promises';
import path from 'path';

import {
    ErrorJson,
    JsonType,
    ParsedXmlFile,
    SourceText,
    XmlReadProblem,
    XmlSourceJson,
    XmlSourceRegistry,
} from '../../types';
import {
    SaveDataInfo,
    XmlResolvedError,
    makeJsonSaveData,
    makeMsgPackSaveData,
    parseXmlSource,
    readMsgPack,
    readSource,
    toXmlResolvedError,
} from '../commons';

// フォルダ単位のメタデータ (権限・ラベル・Flow・画面) の parser の共通部分。方針: docs/metadata-a-plan.md 2.1 章
// 読み込みはフォルダ単位 (permissionsets/ など。中のファイルをまとめて読む)、結果・保存はファイル単位
// (1 ファイル = 1 単位 = 1 解析結果 = 1 保存ファイル)。種類ごとの違いは MetadataFolderSpec (JSON の作り方) だけ

/** 種類ごとの設定 */
export type MetadataFolderSpec<T extends string, J extends JsonType<string>> = {
    /** 種類。解析結果の dataType、保存名・id の接頭辞 (<種類>_<名前>) */
    type: T;
    /** フォルダ名 (permissionsets など) */
    folder: string;
    /** ファイルの接尾辞 (.permissionset-meta.xml など)。ファイル名からこれを除いたものが名前 (bundle では使わない) */
    suffix: string;
    /**
     * フォルダの中の並び。file: 直下のファイルが 1 単位 (既定)、nested: <フォルダ>/<サブフォルダ>/ のファイルが 1 単位
     * (reports・email など。名前は <サブフォルダ>/<名前>)、bundle: サブフォルダが 1 単位 (aura)
     */
    layout?: 'file' | 'nested' | 'bundle';
    /** file・nested: 単位のファイルと一緒に読むファイルの接尾辞 (suffix を置き換えた名前。Visualforce の .page など) */
    companions?: readonly string[];
    /** bundle: メインのファイルの拡張子の候補 (<バンドル名>.<拡張子>。cmp など)。ほかのファイルは extras */
    bundleMain?: readonly string[];
    /** 読み込んだ XML を JSON にする。読めない・ルート要素が違うときは ErrorJson (理由は problems) */
    make: (
        file: ParsedXmlFile,
        registry: XmlSourceRegistry,
        problems: XmlReadProblem[],
        extras: SourceText[],
    ) => J | ErrorJson;
};

/** parseSource の追加の入力 */
export type ParseSourceOptions = {
    /** 一緒に読んだファイル */
    extras?: SourceText[];
    /** 名前 (省略時はファイル名から接尾辞を除いたもの) */
    name?: string;
};

/** 1 ファイルの解析結果 (読めたもの) */
export type MetadataFileStructureType<T extends string, J> = {
    /** ファイルのパス */
    filePath: string;
    resolvedError: XmlResolvedError[];
    dataType: T;
    result: {
        /** <種類>_<名前> (保存名と同じ) */
        id: string;
        base: J;
        sourceObject: XmlSourceJson[];
    };
};

/** XML として読めなかった・ルート要素が違ったとき */
export type ErrorMetadataFileStructureType = {
    filePath: string;
    resolvedError: XmlResolvedError[];
    dataType: 'error';
    result: {
        id: string;
        base: ErrorJson;
        sourceObject: XmlSourceJson[];
    };
};

export type MetadataFileParseResult<T extends string = string, J = unknown> =
    MetadataFileStructureType<T, J> | ErrorMetadataFileStructureType;

const toPosix = (p: string) => p.split(path.sep).join('/');

const isDirectory = async (p: string) =>
    fs
        .stat(p)
        .then((stat) => stat.isDirectory())
        .catch(() => false);

/** 探さないフォルダ */
const IGNORED_DIRECTORIES = new Set(['node_modules', '.git', '.sfdx', '.sf']);

export class MetadataFolderParser<T extends string, J extends JsonType<string>> {
    constructor(readonly spec: MetadataFolderSpec<T, J>) {}

    /** 保存名・id の接頭辞 (<種類>_) */
    get prefix(): string {
        return `${this.spec.type}_`;
    }

    /** ファイル名がこの種類のものか */
    matches(fileName: string): boolean {
        return fileName.endsWith(this.spec.suffix);
    }

    /** rootDir の下のこの種類のフォルダ (permissionsets/ など) を探す。rootDir がそのフォルダなら rootDir だけ */
    async searchFolders(rootDir: string): Promise<string[]> {
        if (!(await isDirectory(rootDir))) return [];
        if (path.basename(rootDir) === this.spec.folder) return [rootDir];
        const found: string[] = [];
        const walk = async (directory: string): Promise<void> => {
            const entries = await fs.readdir(directory, { withFileTypes: true });
            for (const entry of entries) {
                if (!entry.isDirectory() || IGNORED_DIRECTORIES.has(entry.name)) continue;
                const child = path.join(directory, entry.name);
                if (entry.name === this.spec.folder) {
                    found.push(child);
                } else {
                    await walk(child);
                }
            }
        };
        await walk(rootDir);
        return found.sort();
    }

    /** フォルダの中のこの種類の単位をすべて読む (名前の順)。結果は単位ごとに 1 つ */
    async parseFolder(directory: string): Promise<MetadataFileParseResult<T, J>[]> {
        const folder = path.basename(directory);
        const entries = await fs.readdir(directory, { withFileTypes: true });
        const subfolders = entries
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)
            .sort();
        switch (this.spec.layout ?? 'file') {
            case 'bundle':
                return Promise.all(
                    subfolders.map((sub) => this.parseBundle(path.join(directory, sub), folder)),
                );
            case 'nested':
                return (
                    await Promise.all(
                        subfolders.map((sub) =>
                            this.parseFiles(path.join(directory, sub), `${folder}/${sub}`, sub),
                        ),
                    )
                ).flat();
            default:
                return this.parseFiles(directory, folder);
        }
    }

    /** directory の直下の単位のファイルを読む。relative は結果に残すフォルダのパス、group は名前の前に付けるサブフォルダ */
    private async parseFiles(
        directory: string,
        relative: string,
        group?: string,
    ): Promise<MetadataFileParseResult<T, J>[]> {
        const names = (await fs.readdir(directory, { withFileTypes: true }))
            .filter((entry) => entry.isFile() && this.matches(entry.name))
            .map((entry) => entry.name)
            .sort();
        return Promise.all(
            names.map(async (fileName) => {
                const absolute = path.join(directory, fileName);
                const base = fileName.slice(0, -this.spec.suffix.length);
                const extras = await this.readCompanions(directory, relative, base);
                const result = this.parseSource(
                    `${relative}/${fileName}`,
                    await readSource(absolute),
                    {
                        extras,
                        name: group ? `${group}/${base}` : base,
                    },
                );
                return { ...result, filePath: absolute };
            }),
        );
    }

    /** companions のファイル (あるものだけ) */
    private async readCompanions(
        directory: string,
        relative: string,
        base: string,
    ): Promise<SourceText[]> {
        const extras: SourceText[] = [];
        for (const suffix of this.spec.companions ?? []) {
            const fileName = `${base}${suffix}`;
            const source = await readSource(path.join(directory, fileName)).catch(() => undefined);
            if (source !== undefined) {
                extras.push({ fileName, filePath: `${relative}/${fileName}`, source });
            }
        }
        return extras;
    }

    /** バンドル (サブフォルダ) を 1 単位として読む。メインのファイルがなければ error */
    private async parseBundle(
        directory: string,
        folder: string,
    ): Promise<MetadataFileParseResult<T, J>> {
        const name = path.basename(directory);
        const relative = `${folder}/${name}`;
        const fileNames = (await fs.readdir(directory, { withFileTypes: true }))
            .filter((entry) => entry.isFile())
            .map((entry) => entry.name)
            .sort();
        const main = (this.spec.bundleMain ?? [])
            .map((ext) => `${name}.${ext}`)
            .find((fileName) => fileNames.includes(fileName));
        const extras = await Promise.all(
            fileNames
                .filter((fileName) => fileName !== main)
                .map(async (fileName) => ({
                    fileName,
                    filePath: `${relative}/${fileName}`,
                    source: await readSource(path.join(directory, fileName)),
                })),
        );
        const result = this.parseSource(
            `${relative}/${main ?? name}`,
            main ? await readSource(path.join(directory, main)) : '',
            { extras, name },
        );
        return { ...result, filePath: directory };
    }

    /** rootDir の下のこの種類のファイルをすべて読む */
    async parseAll(rootDir: string): Promise<MetadataFileParseResult<T, J>[]> {
        const folders = await this.searchFolders(rootDir);
        return (await Promise.all(folders.map((folder) => this.parseFolder(folder)))).flat();
    }

    /**
     * 読み込み済みのソースを解析する (ファイルを読まない入口。git の before 側などに使う)。
     * filePath は結果とソース位置に残すパス (<フォルダ>/<ファイル名> の相対パス)
     */
    parseSource(
        filePath: string,
        source: string,
        options: ParseSourceOptions = {},
    ): MetadataFileParseResult<T, J> {
        const fileName = path.posix.basename(toPosix(filePath));
        const name =
            options.name ??
            (this.matches(fileName) ? fileName.slice(0, -this.spec.suffix.length) : fileName);
        // 入れ子のフォルダの名前 (<サブフォルダ>/<名前>) は、保存名に / を使わないよう . にする
        const id = `${this.prefix}${name.split('/').join('.')}`;
        const file = parseXmlSource(filePath, source.replace(/\r\n?/g, '\n'), name);
        const registry = new XmlSourceRegistry();
        const problems: XmlReadProblem[] = [];
        const extras = (options.extras ?? []).map((extra) => ({
            ...extra,
            source: extra.source.split('\r\n').join('\n'),
        }));
        const base = this.spec.make(file, registry, problems, extras);
        const resolvedError = problems.map(toXmlResolvedError);
        const sourceObject = registry.toSourceObjects();
        if (base.kind === 'error') {
            return {
                filePath,
                resolvedError,
                dataType: 'error',
                result: { id, base: base as ErrorJson, sourceObject },
            };
        }
        return {
            filePath,
            resolvedError,
            dataType: this.spec.type,
            result: { id, base: base as J, sourceObject },
        };
    }

    // 本番用: msgpackr で <baseDir>/<種類>_<名前>.msgpack に保存する
    save(baseDir: string, target: MetadataFileParseResult<T, J>): SaveDataInfo[] {
        return [makeMsgPackSaveData('Metadata', baseDir, target.result.id, target)];
    }

    // 開発者でのデータ確認用: <baseDir>/<種類>_<名前>.json
    saveForDevelopper(baseDir: string, target: MetadataFileParseResult<T, J>): SaveDataInfo[] {
        return [makeJsonSaveData('Metadata', baseDir, target.result.id, target)];
    }

    /** save で保存したものを読み込む。id は保存名 (接頭辞付き) でも、名前だけでもよい */
    async read(baseDir: string, id: string): Promise<MetadataFileParseResult<T, J>> {
        const saveId = id.startsWith(this.prefix) ? id : `${this.prefix}${id}`;
        return readMsgPack<MetadataFileParseResult<T, J>>(baseDir, saveId, this.spec.type);
    }

    /** baseDir に保存したこの種類のものをすべて読む。baseDir がなければ空 */
    async readSaved(baseDir: string): Promise<MetadataFileParseResult<T, J>[]> {
        const names = await fs.readdir(baseDir).catch(() => [] as string[]);
        return Promise.all(
            names
                .filter((name) => name.startsWith(this.prefix) && name.endsWith('.msgpack'))
                .sort()
                .map((name) => this.read(baseDir, name.slice(0, -'.msgpack'.length))),
        );
    }
}
