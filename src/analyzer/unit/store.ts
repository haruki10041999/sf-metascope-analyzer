import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { Packr } from 'msgpackr';

import { SAVE_FORMAT_VERSION } from '../parser/commons';
import type { SourceText } from '../types';

import { Repository, locateUnits, readUnitSources } from './repository';
import type { SourceTree } from './sourceTree';
import {
    type AnyUnitType,
    type UnitParseResult,
    UNIT_TYPES,
    unitFormatVersionOf,
} from './unitType';

// 保存の置き場 (docs/save-format-plan.md 4.1。段階 S1〜S3)。
//
// <dir>/
//   manifest.msgpack              before の目録 (置き場所の版・単位の一覧・各単位のファイルと hash・key)
//   sources/<hash>.msgpack        ソース (LF にそろえた中身)。同じ中身は 1 つ
//   parsed/<種類>/<key>.msgpack   解析結果 { layoutVersion, formatVersion, data }。data の filePath はリポジトリからの相対パス
//
// - 単位の key は (種類・場所・ファイルと中身の hash) の hash。同じ key の単位は parse し直さず、保存した解析結果を使う
//   (after も。読み込んだ結果はメモリでも使い回すので、before と after で同じ単位は同じオブジェクトになる)
// - 解析結果の版 (formatVersion) は系統ごと (unitFormatVersionOf)。版の違う解析結果は、保存したソースから parse し直す
//   (版を上げても before が消えない)
// - 目録は一時ファイルに書いてから名前を変える (保存が途中で止まっても、前の before が残る)。
//   目録にない解析結果・ソースは、保存のあとに消す。解析結果は消えても作り直せる (困るのは目録とソースだけ)

/** 単位のファイル 1 つ (リポジトリからの相対パスと、中身の hash) */
export type ManifestFile = { path: string; hash: string };

/** 保存した時点の単位 1 つ */
export type ManifestUnit = {
    /** 単位の種類 */
    type: string;
    /** 単位の場所 (リポジトリからの相対パス) */
    location: string;
    /** filesOf のファイル (読めたもの。名前の順) */
    files: ManifestFile[];
    /** hash(type, location, files)。解析結果の保存名 */
    key: string;
};

export type Manifest = { layoutVersion: number; units: ManifestUnit[] };

type ParsedEnvelope = { layoutVersion: number; formatVersion: string; data: UnitParseResult };

const packr = new Packr({ useRecords: true });

const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');

/** 単位の key */
export const unitKeyOf = (type: string, location: string, files: readonly ManifestFile[]): string =>
    sha256(JSON.stringify([type, location, files.map((file) => [file.path, file.hash])]));

/** 作った解析結果 → 目録の単位 (diff・保存で、どのファイルのどの中身から作ったかを引く) */
const manifestUnits = new WeakMap<UnitParseResult, ManifestUnit>();

/** 解析結果の目録の単位 (UnitStore で作ったものだけ) */
export const manifestUnitOf = (result: UnitParseResult): ManifestUnit | undefined =>
    manifestUnits.get(result);

const readPacked = async <T>(file: string): Promise<T | undefined> => {
    const content = await fs.readFile(file).catch(() => undefined);
    if (!content) return undefined;
    try {
        return packr.unpack(content) as T;
    } catch {
        return undefined;
    }
};

const exists = (file: string) =>
    fs.stat(file).then(
        () => true,
        () => false,
    );

/** 置き場の数 (テスト・計測用) */
export type UnitStoreStats = {
    /** parse した単位の数 */
    parsed: number;
    /** 保存した解析結果を読んだ単位の数 */
    loaded: number;
    /** メモリの解析結果を使った単位の数 */
    reused: number;
};

export class UnitStore {
    /** key → 解析結果 (filePath は絶対パス) */
    private readonly cache = new Map<string, UnitParseResult>();
    /** 最後に読んだ木のソース (hash → 中身)。保存のときに書く */
    private sources = new Map<string, string>();
    readonly stats: UnitStoreStats = { parsed: 0, loaded: 0, reused: 0 };

    /** dir は置き場 (<savingRoot>/store)、root はリポジトリのルート */
    constructor(
        readonly dir: string,
        readonly root: string,
        readonly types: readonly AnyUnitType[] = UNIT_TYPES,
    ) {}

    private get manifestFile(): string {
        return path.join(this.dir, 'manifest.msgpack');
    }

    private sourceFile(hash: string): string {
        return path.join(this.dir, 'sources', `${hash}.msgpack`);
    }

    private parsedFile(type: string, key: string): string {
        return path.join(this.dir, 'parsed', type, `${key}.msgpack`);
    }

    /** 今の置き場所の版の目録。なければ・版が違えば undefined */
    async readManifest(): Promise<Manifest | undefined> {
        const manifest = await readPacked<Partial<Manifest>>(this.manifestFile);
        if (manifest?.layoutVersion !== SAVE_FORMAT_VERSION || !Array.isArray(manifest.units)) {
            return undefined;
        }
        return manifest as Manifest;
    }

    /** before (今の置き場所の版の目録) があるか */
    async hasSaved(): Promise<boolean> {
        return (await this.readManifest()) !== undefined;
    }

    /**
     * before (最後に保存した時点)。解析結果の版が古い単位は、保存したソースから parse し直す。
     * ソースが欠けた単位があれば、その種類は「なし」にする (一部だけ読むと、残りが「追加」に見えるため)
     */
    async loadBefore(): Promise<Repository> {
        const manifest = await this.readManifest();
        const units = new Map<string, UnitParseResult[]>(this.types.map((t) => [t.type, []]));
        if (!manifest) return Repository.of(this.root, units);
        for (const unitType of this.types) {
            const results: UnitParseResult[] = [];
            let complete = true;
            for (const unit of manifest.units.filter((u) => u.type === unitType.type)) {
                const result = await this.resolve(unitType, unit, () => this.storedSources(unit));
                if (!result) {
                    complete = false;
                    break;
                }
                results.push(result);
            }
            units.set(unitType.type, complete ? results : []);
        }
        return Repository.of(this.root, units);
    }

    /** 木 (作業ツリーなど) のすべての単位。key が同じ単位は parse しない */
    async loadTree(tree: SourceTree): Promise<Repository> {
        const files = await tree.listFiles();
        const locations = locateUnits(files, this.types);
        const units = new Map<string, UnitParseResult[]>();
        const sources = new Map<string, string>();
        for (const unitType of this.types) {
            const results = await Promise.all(
                (locations.get(unitType.type) ?? []).map(async (location) => {
                    const texts = await readUnitSources(tree, unitType, location, files);
                    const unitFiles = texts.map((text) => {
                        const hash = sha256(text.source);
                        sources.set(hash, text.source);
                        return { path: text.filePath, hash };
                    });
                    const unit: ManifestUnit = {
                        type: unitType.type,
                        location,
                        files: unitFiles,
                        key: unitKeyOf(unitType.type, location, unitFiles),
                    };
                    return (await this.resolve(unitType, unit, async () => texts))!;
                }),
            );
            units.set(unitType.type, results);
        }
        this.sources = sources;
        return Repository.of(tree.root, units);
    }

    /**
     * repository (loadTree で作ったもの) を before として保存する。
     * 解析結果・ソースを書き足し、目録を最後に置き換え、目録にないものを消す
     */
    async save(repository: Repository): Promise<void> {
        const units: ManifestUnit[] = [];
        for (const unitType of this.types) {
            for (const result of repository.get(unitType.type)) {
                const unit = manifestUnitOf(result);
                if (!unit) throw new Error(`Not loaded by the store: ${result.result.id}`);
                units.push(unit);
                const file = this.parsedFile(unit.type, unit.key);
                if (!(await exists(file))) await this.writeParsed(unitType, unit.key, result);
                for (const { hash } of unit.files) {
                    const sourceFile = this.sourceFile(hash);
                    const source = this.sources.get(hash);
                    if (source === undefined || (await exists(sourceFile))) continue;
                    await fs.mkdir(path.dirname(sourceFile), { recursive: true });
                    await fs.writeFile(sourceFile, packr.pack(source));
                }
            }
        }
        const manifest: Manifest = { layoutVersion: SAVE_FORMAT_VERSION, units };
        const temporary = `${this.manifestFile}.${process.pid}.tmp`;
        await fs.mkdir(this.dir, { recursive: true });
        await fs.writeFile(temporary, packr.pack(manifest));
        await fs.rename(temporary, this.manifestFile);
        await this.collectGarbage(manifest);
    }

    /** メモリの解析結果のうち、keep (今の before・after) にないものを捨てる */
    retain(...repositories: Repository[]): void {
        const keys = new Set(
            repositories.flatMap((repository) =>
                repository
                    .entries()
                    .flatMap(([, results]) => results.map((r) => manifestUnitOf(r)?.key)),
            ),
        );
        for (const key of this.cache.keys()) if (!keys.has(key)) this.cache.delete(key);
    }

    /** 単位の解析結果 (メモリ → 保存した解析結果 → parse の順に探す)。ソースがなければ undefined */
    private async resolve(
        unitType: AnyUnitType,
        unit: ManifestUnit,
        sources: () => Promise<SourceText[] | undefined>,
    ): Promise<UnitParseResult | undefined> {
        let result = this.cache.get(unit.key);
        if (result) {
            this.stats.reused++;
        } else {
            result = await this.readParsed(unitType, unit.key);
            if (result) {
                this.stats.loaded++;
            } else {
                const texts = await sources();
                if (!texts) return undefined;
                const parsed = await unitType.parseUnit(unit.location, texts);
                this.stats.parsed++;
                result = { ...parsed, filePath: path.join(this.root, parsed.filePath) };
                await this.writeParsed(unitType, unit.key, result);
            }
            this.cache.set(unit.key, result);
        }
        manifestUnits.set(result, unit);
        return result;
    }

    /** 保存した解析結果 (今の版のもの)。なければ・版が違えば undefined */
    private async readParsed(
        unitType: AnyUnitType,
        key: string,
    ): Promise<UnitParseResult | undefined> {
        const saved = await readPacked<Partial<ParsedEnvelope>>(
            this.parsedFile(unitType.type, key),
        );
        if (
            !saved?.data ||
            saved.layoutVersion !== SAVE_FORMAT_VERSION ||
            saved.formatVersion !== unitFormatVersionOf(unitType)
        ) {
            return undefined;
        }
        return { ...saved.data, filePath: path.join(this.root, saved.data.filePath) };
    }

    /** 解析結果を書く (filePath はリポジトリからの相対パスにする) */
    private async writeParsed(
        unitType: AnyUnitType,
        key: string,
        result: UnitParseResult,
    ): Promise<void> {
        const file = this.parsedFile(unitType.type, key);
        const data = {
            ...result,
            filePath: path.relative(this.root, result.filePath).split(path.sep).join('/'),
        };
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(
            file,
            packr.pack({
                layoutVersion: SAVE_FORMAT_VERSION,
                formatVersion: unitFormatVersionOf(unitType),
                data,
            } satisfies ParsedEnvelope),
        );
    }

    /** 保存したソース。1 つでも欠けていれば undefined */
    private async storedSources(unit: ManifestUnit): Promise<SourceText[] | undefined> {
        const texts: SourceText[] = [];
        for (const file of unit.files) {
            const source = await readPacked<string>(this.sourceFile(file.hash));
            if (typeof source !== 'string') return undefined;
            texts.push({ fileName: path.posix.basename(file.path), filePath: file.path, source });
        }
        return texts;
    }

    /** 目録にない解析結果・ソースを消す */
    private async collectGarbage(manifest: Manifest): Promise<void> {
        const keys = new Set(manifest.units.map((unit) => `${unit.type}/${unit.key}.msgpack`));
        const hashes = new Set(
            manifest.units.flatMap((unit) => unit.files.map((file) => `${file.hash}.msgpack`)),
        );
        const parsedDir = path.join(this.dir, 'parsed');
        for (const type of await fs.readdir(parsedDir).catch(() => [] as string[])) {
            for (const name of await fs.readdir(path.join(parsedDir, type)).catch(() => [])) {
                if (!keys.has(`${type}/${name}`)) {
                    await fs.rm(path.join(parsedDir, type, name), { force: true });
                }
            }
        }
        const sourcesDir = path.join(this.dir, 'sources');
        for (const name of await fs.readdir(sourcesDir).catch(() => [] as string[])) {
            if (!hashes.has(name)) await fs.rm(path.join(sourcesDir, name), { force: true });
        }
    }
}
