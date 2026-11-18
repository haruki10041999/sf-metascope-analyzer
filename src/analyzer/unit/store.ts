import { createHash } from 'node:crypto';
import path from 'node:path';

import { SAVE_FORMAT_VERSION as LAYOUT_VERSION } from '../parser/commons';
import type { SourceText } from '../types';

import { DERIVED_VERSION, primeUnitDependencies, unitDependenciesOf } from './dependencies';
import { Repository, locateUnits, readUnitSources } from './repository';
import type { SourceTree } from './sourceTree';
import type {
    FileStatEntry,
    Manifest,
    ManifestFile,
    ManifestUnit,
    StoreBackend,
    UnitSourceFile,
} from './storeBackend';
import { SqliteStoreBackend } from './storeSqlite';
import { type ParsedWriter, StoreWriterThread } from './storeWriter';
import {
    type AnyUnitType,
    type UnitParseResult,
    UNIT_TYPES,
    unitFormatVersionOf,
} from './unitType';

export type { Manifest, ManifestFile, ManifestUnit } from './storeBackend';

// 保存の置き場 (docs/save-format-plan.md 4.1。段階 S1〜S5。保存の形は docs/implementation-roadmap.md 5 章の SQLite)。
// 置き場は <savingRoot>/store/metascope.db (storeSqlite.ts)。ここは単位の判定・hash・parse の使い回しを行い、
// 読み書きは backend (storeBackend.ts) に任せる。
//
// - 単位の key は (種類・場所・ファイルと中身の hash) の hash。同じ key の単位は parse し直さず、保存した解析結果を使う
//   (after も。読み込んだ結果はメモリでも使い回すので、before と after で同じ単位は同じオブジェクトになる)
// - 解析結果の版 (formatVersion) は系統ごと (unitFormatVersionOf)。版の違う解析結果は、保存したソースから parse し直す
//   (版を上げても before が消えない)
// - 保存は 1 つのトランザクション (途中で止まっても、前の before が残る)。目録にない解析結果・ソースは保存のときに消す
// - 作業ツリーのファイルは、大きさ・更新時刻が前回 hash を取ったときと同じなら、読まずに前回の hash を使う (S5)。
//   hash を取った時点で更新されたばかりだったファイル (同じ時刻のうちにもう一度書かれうる) は使わない (git の racy の考え方)
// - 定義・参照の版 (DERIVED_VERSION) は解析結果の版と分ける。保存した解析結果を読んだ単位は、版の合う定義・参照も読み、
//   作り直さない。取り出し方だけを変えたときは派生の版を上げれば、parse はやり直さずに定義・参照だけを作り直す

/**
 * 更新時刻と hash を取った時刻がこれより近いファイルは、大きさ・更新時刻が同じでも読み直す
 * (同じ時刻のうちに書き直されても、更新時刻が変わらないことがあるため)
 */
const RACY_MS = 2000;

const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');

/** 単位の key */
export const unitKeyOf = (type: string, location: string, files: readonly ManifestFile[]): string =>
    sha256(JSON.stringify([type, location, files.map((file) => [file.path, file.hash])]));

/**
 * 単位を解析する関数。UnitStore に渡すと、parse をそれに任せる (worker_threads のプールで並列にするなど。
 * docs/implementation-roadmap.md 8 章の M4)
 */
export type UnitParser = (
    unitType: AnyUnitType,
    location: string,
    files: SourceText[],
) => Promise<UnitParseResult>;

/** 作った解析結果 → 目録の単位 (diff・保存で、どのファイルのどの中身から作ったかを引く) */
const manifestUnits = new WeakMap<UnitParseResult, ManifestUnit>();

/** 解析結果の目録の単位 (UnitStore で作ったものだけ) */
export const manifestUnitOf = (result: UnitParseResult): ManifestUnit | undefined =>
    manifestUnits.get(result);

/** 置き場の数 (テスト・計測用) */
export type UnitStoreStats = {
    /** parse した単位の数 */
    parsed: number;
    /** 保存した解析結果を読んだ単位の数 */
    loaded: number;
    /** メモリの解析結果を使った単位の数 */
    reused: number;
    /** 保存した定義・参照を読んだ単位の数 (S4) */
    derivedLoaded: number;
    /** 定義・参照を保存した単位の数 (S4) */
    derivedWritten: number;
    /** 読んで hash を取ったファイルの数 (S5) */
    hashed: number;
    /** 大きさ・更新時刻が同じなので、読まずに前回の hash を使ったファイルの数 (S5) */
    statHits: number;
};

export class UnitStore {
    /** key → 解析結果 (filePath は絶対パス) */
    private readonly cache = new Map<string, UnitParseResult>();
    /** 最後に読んだ木のソース (hash → 中身)。保存のときに書く */
    private sources = new Map<string, string>();
    /** 保存した定義・参照が今の版の key (保存のときに書かなくてよいもの) */
    private readonly freshDerived = new Set<string>();
    readonly stats: UnitStoreStats = {
        parsed: 0,
        loaded: 0,
        reused: 0,
        derivedLoaded: 0,
        derivedWritten: 0,
        hashed: 0,
        statHits: 0,
    };
    /** 作業ツリーのファイル (絶対パス) → hash を取ったときの大きさ・更新時刻 (S5)。最初の loadTree で読む */
    private fileStats?: Map<string, FileStatEntry>;
    /** 最後に読んだ木 (保存のときに、読まずに済ませたソースを読む) */
    private tree?: SourceTree;

    /** 読み書き (SQLite) */
    readonly backend: StoreBackend;

    /** dir は置き場 (<savingRoot>/store)、root はリポジトリのルート */
    /** 単位を解析する関数 (既定はこのスレッドで。worker_threads のプールに任せることもできる) */
    private readonly parse: UnitParser;

    /** 解析結果を書く先 (別のスレッドで書くとき。なければ backend に書く) */
    private writer: ParsedWriter | undefined;

    constructor(
        readonly dir: string,
        readonly root: string,
        readonly types: readonly AnyUnitType[] = UNIT_TYPES,
        options: { parse?: UnitParser } = {},
    ) {
        this.backend = new SqliteStoreBackend(dir);
        this.parse =
            options.parse ??
            (async (unitType, location, files) => unitType.parseUnit(location, files));
    }

    /**
     * 解析結果の書き込みを別のスレッドで行う (storeWriter.ts。docs/implementation-roadmap.md 8 章の M5)。
     * 置き場を開いたあとに作る。読み込みの終わりと保存の始めに、書き終わるのを待つ
     */
    useWriterThread(): void {
        this.writer ??= new StoreWriterThread(this.dir);
    }

    /** データベースを閉じる (テスト・終わるとき) */
    close(): void {
        void this.writer?.close();
        this.writer = undefined;
        this.backend.close();
    }

    private async loadFileStats(): Promise<Map<string, FileStatEntry>> {
        this.fileStats ??= await this.backend.readFileStats();
        return this.fileStats;
    }

    /**
     * 単位のファイルの hash。大きさ・更新時刻が前回と同じなら読まない (中身は undefined)。
     * 読んだファイルは中身も返す。読めないファイルは undefined
     */
    private async hashFile(
        tree: SourceTree,
        filePath: string,
        stats: Map<string, FileStatEntry> | undefined,
    ): Promise<{ hash: string; source?: string } | undefined> {
        const absolute = path.join(tree.root, filePath);
        const stat = stats ? await tree.statFile?.(filePath) : undefined;
        const cached = stat ? stats!.get(absolute) : undefined;
        if (
            stat &&
            cached &&
            cached.size === stat.size &&
            cached.mtimeMs === stat.mtimeMs &&
            cached.checkedAt - cached.mtimeMs > RACY_MS
        ) {
            this.stats.statHits++;
            return { hash: cached.hash };
        }
        const checkedAt = Date.now();
        const source = await tree.readFile(filePath);
        if (source === undefined) return undefined;
        const hash = sha256(source);
        this.stats.hashed++;
        if (stat) stats!.set(absolute, { ...stat, hash, checkedAt });
        return { hash, source };
    }

    /** 今の置き場所の版の目録。なければ・版が違えば undefined */
    readManifest(): Promise<Manifest | undefined> {
        return this.backend.readManifest();
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

    /**
     * 木 (作業ツリーなど) のすべての単位。key が同じ単位は parse しない。
     * track が false なら、保存に使う「最後に読んだ木」とソースを書き換えない
     * (git の範囲で比べるためだけに読む木。docs/implementation-roadmap.md の R5)
     */
    async loadTree(tree: SourceTree, options: { track?: boolean } = {}): Promise<Repository> {
        // 途中で書く解析結果を 1 つのトランザクションにまとめる (単位ごとに確定しない)
        return this.backend.batch(() => this.loadTreeInBatch(tree, options));
    }

    private async loadTreeInBatch(
        tree: SourceTree,
        options: { track?: boolean },
    ): Promise<Repository> {
        const files = await tree.listFiles();
        const locations = locateUnits(files, this.types);
        const units = new Map<string, UnitParseResult[]>();
        const sources = new Map<string, string>();
        // 作業ツリー (大きさ・更新時刻が分かる木) だけ、前回の hash を使う
        const stats = tree.statFile ? await this.loadFileStats() : undefined;
        for (const unitType of this.types) {
            const results = await Promise.all(
                (locations.get(unitType.type) ?? []).map(async (location) => {
                    const hashed = await Promise.all(
                        unitType.filesOf(location, files).map(async (filePath) => {
                            const file = await this.hashFile(tree, filePath, stats);
                            if (!file) return [];
                            if (file.source !== undefined) sources.set(file.hash, file.source);
                            return [{ path: filePath, hash: file.hash }];
                        }),
                    );
                    const unitFiles = hashed.flat();
                    const unit: ManifestUnit = {
                        type: unitType.type,
                        location,
                        files: unitFiles,
                        key: unitKeyOf(unitType.type, location, unitFiles),
                    };
                    // parse するときだけ中身を読む (読まずに済ませたファイルも含めて読み直す)
                    return (await this.resolve(unitType, unit, () =>
                        readUnitSources(tree, unitType, location, files),
                    ))!;
                }),
            );
            units.set(unitType.type, results);
        }
        // 別のスレッドで書いている解析結果を書き終える (このあと DB を読む処理が、書いたものを見られるように)
        await this.writer?.flush();
        if (options.track ?? true) {
            this.sources = sources;
            this.tree = tree;
        }
        return Repository.of(tree.root, units);
    }

    /**
     * repository (loadTree で作ったもの) を before として保存する。
     * 解析結果・定義・参照・ソースを書き足し、目録を置き換え、目録にないものを消す (1 つのトランザクション)
     */
    async save(repository: Repository): Promise<void> {
        // 別のスレッドで書いている解析結果を、先に書き終える (hasParsed がそれを見る)
        await this.writer?.flush();
        await this.backend.begin();
        try {
            const units: ManifestUnit[] = [];
            for (const unitType of this.types) {
                const formatVersion = unitFormatVersionOf(unitType);
                for (const result of repository.get(unitType.type)) {
                    const unit = manifestUnitOf(result);
                    if (!unit) throw new Error(`Not loaded by the store: ${result.result.id}`);
                    units.push(unit);
                    // ソース (読まずに済ませたファイル (S5) は、ここで木から読む。中身が変わっていれば書かない)
                    const files: UnitSourceFile[] = [];
                    for (const { path: filePath, hash } of unit.files) {
                        let text = this.sources.get(hash) ?? (await this.backend.readSource(hash));
                        if (text === undefined && this.tree) {
                            const read = await this.tree.readFile(filePath);
                            if (read !== undefined && sha256(read) === hash) text = read;
                        }
                        if (text === undefined) continue;
                        files.push({ path: filePath, hash, text });
                        await this.backend.writeSource(hash, text);
                    }
                    if (!(await this.backend.hasParsed(unit.type, unit.key, formatVersion))) {
                        await this.writeParsed(unitType, unit.key, result, files);
                    }
                    // 定義・参照 (今の版のものを読んでいなければ、作って書く)
                    if (!this.freshDerived.has(unit.key)) {
                        await this.writeDerived(
                            unitType,
                            unit.key,
                            unitDependenciesOf(unit.type, result),
                        );
                    }
                }
            }
            await this.saveFileStats();
            await this.backend.commit({ layoutVersion: LAYOUT_VERSION, units });
        } catch (error) {
            await this.backend.rollback();
            throw error;
        }
    }

    /** ファイルの大きさ・更新時刻・hash を書く (S5。最後に読んだ木にあるファイルだけ) */
    private async saveFileStats(): Promise<void> {
        if (!this.fileStats || !this.tree?.statFile) return;
        const root = this.tree.root;
        const files = new Set((await this.tree.listFiles()).map((f) => path.join(root, f)));
        await this.backend.writeFileStats([...this.fileStats].filter(([file]) => files.has(file)));
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
                // 保存した定義・参照 (版が合えば、作り直さずに使う)
                const dependencies = await this.readDerived(unitType, unit.key);
                if (dependencies) {
                    primeUnitDependencies(result, dependencies);
                    this.freshDerived.add(unit.key);
                    this.stats.derivedLoaded++;
                }
            } else {
                const texts = await sources();
                if (!texts) return undefined;
                const parsed = await this.parse(unitType, unit.location, texts);
                this.stats.parsed++;
                result = { ...parsed, filePath: path.join(this.root, parsed.filePath) };
                // 単位のファイルの中身も渡す (位置からソースの文字列を作れるものは、文字列を持たずに済ませる)
                const hashes = new Map(unit.files.map((file) => [file.path, file.hash]));
                await this.writeParsed(
                    unitType,
                    unit.key,
                    result,
                    texts.map((text) => ({
                        path: text.filePath,
                        hash: hashes.get(text.filePath) ?? sha256(text.source),
                        text: text.source,
                    })),
                );
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
        const saved = await this.backend.readParsed(
            unitType.type,
            key,
            unitFormatVersionOf(unitType),
        );
        return saved ? { ...saved, filePath: path.join(this.root, saved.filePath) } : undefined;
    }

    /** 解析結果を書く (filePath はリポジトリからの相対パスにする) */
    private async writeParsed(
        unitType: AnyUnitType,
        key: string,
        result: UnitParseResult,
        files: readonly UnitSourceFile[],
    ): Promise<void> {
        const data = {
            ...result,
            filePath: path.relative(this.root, result.filePath).split(path.sep).join('/'),
        };
        if (this.writer) {
            this.writer.write(unitType.type, key, unitFormatVersionOf(unitType), data, files);
            return;
        }
        await this.backend.writeParsed(
            unitType.type,
            key,
            unitFormatVersionOf(unitType),
            data,
            files,
        );
    }

    /** 保存した定義・参照 (今の解析結果の版・派生の版のもの)。なければ・版が違えば undefined */
    private readDerived(unitType: AnyUnitType, key: string) {
        return this.backend.readDerived(
            unitType.type,
            key,
            unitFormatVersionOf(unitType),
            DERIVED_VERSION,
        );
    }

    /** 定義・参照を書く */
    private async writeDerived(
        unitType: AnyUnitType,
        key: string,
        dependencies: ReturnType<typeof unitDependenciesOf>,
    ): Promise<void> {
        await this.backend.writeDerived(
            unitType.type,
            key,
            unitFormatVersionOf(unitType),
            DERIVED_VERSION,
            dependencies,
        );
        this.freshDerived.add(key);
        this.stats.derivedWritten++;
    }

    /** 保存したソース。1 つでも欠けていれば undefined */
    private async storedSources(unit: ManifestUnit): Promise<SourceText[] | undefined> {
        const texts: SourceText[] = [];
        for (const file of unit.files) {
            const source = await this.backend.readSource(file.hash);
            if (typeof source !== 'string') return undefined;
            texts.push({ fileName: path.posix.basename(file.path), filePath: file.path, source });
        }
        return texts;
    }
}
