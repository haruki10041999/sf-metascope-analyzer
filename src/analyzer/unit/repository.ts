import path from 'node:path';

import type { GitDiffFile } from '../parser';

import type { SourceText } from '../types';

import type { SourceTree } from './sourceTree';
import { type AnyUnitType, type UnitDiff, type UnitParseResult, UNIT_TYPES } from './unitType';

// ある時点のリポジトリ (単位の種類 → 解析結果の一覧) と、その作り方 (作業ツリー・git・保存データ)。
// 方針: docs/analysis-plan.md 2 章

const toPosix = (p: string) => p.split(path.sep).join('/');

/** 単位の場所 (リポジトリからの相対パス) ごとにまとめた、種類ごとの単位 */
export type UnitLocations = Map<string, string[]>;

/** ファイルの一覧から、種類ごとの単位の場所 (名前の順) */
export const locateUnits = (
    files: readonly string[],
    types: readonly AnyUnitType[] = UNIT_TYPES,
): UnitLocations => {
    const fileSet = new Set(files);
    return new Map(
        types.map((unitType) => {
            const locations = new Set<string>();
            for (const file of files) {
                const location = unitType.locate(file);
                if (location !== undefined && unitType.exists(location, fileSet)) {
                    locations.add(location);
                }
            }
            return [unitType.type, [...locations].sort()];
        }),
    );
};

/** 単位 1 つのファイル (filesOf) を木から読む。読めないファイルは除く */
export const readUnitSources = async (
    tree: SourceTree,
    unitType: AnyUnitType,
    location: string,
    files?: readonly string[],
): Promise<SourceText[]> =>
    (
        await Promise.all(
            unitType.filesOf(location, files ?? (await tree.listFiles())).map(async (filePath) => {
                const source = await tree.readFile(filePath);
                return source === undefined
                    ? []
                    : [{ fileName: path.posix.basename(filePath), filePath, source }];
            }),
        )
    ).flat();

/** 読んだファイルで単位 1 つを解析する。結果の filePath は root からの絶対パス */
export const parseUnitSources = async (
    root: string,
    unitType: AnyUnitType,
    location: string,
    sources: SourceText[],
): Promise<UnitParseResult> => {
    const result = await unitType.parseUnit(location, sources);
    return { ...result, filePath: path.join(root, result.filePath) };
};

/** 単位 1 つを木から読んで解析する。結果の filePath は木のルートからの絶対パス */
export const parseUnitFromTree = async (
    tree: SourceTree,
    unitType: AnyUnitType,
    location: string,
): Promise<UnitParseResult> =>
    parseUnitSources(
        tree.root,
        unitType,
        location,
        await readUnitSources(tree, unitType, location),
    );

/**
 * パッケージディレクトリの重なり: 同じ種類・同じ id (名前) の単位が、2 つ以上の場所にあるもの
 * (force-app と別のパッケージディレクトリに同じクラスがあるなど)。解析には 1 つ (kept) だけを使う
 */
export type UnitOverlap = {
    type: string;
    id: string;
    /** 解析に使う単位の場所 (リポジトリからの相対パス) */
    kept: string;
    /** 解析に使わない単位の場所 */
    skipped: string[];
};

/** 単位の種類 → 解析結果 (id の順) */
export class Repository {
    private constructor(
        readonly root: string,
        private readonly units: Map<string, UnitParseResult[]>,
        /** パッケージディレクトリの重なり (種類・id の順) */
        readonly overlaps: readonly UnitOverlap[] = [],
        /** 重なりで解析に使わない単位 (update で選び直すために持つ) */
        private readonly skipped: Map<string, UnitParseResult[]> = new Map(),
        /** sfdx-project.json の packageDirectories (重なりのとき、先に書いたものを使う) */
        private readonly packageDirectories: readonly string[] = [],
    ) {}

    /**
     * 種類 → 解析結果から作る (解析結果は id の順に並べ替える)。同じ種類・同じ id の単位が複数あれば、
     * packageDirectories に先に書いたパッケージディレクトリのもの (同じなら場所の名前の順で先のもの) を使い、
     * ほかは overlaps に残す
     */
    static of(
        root: string,
        units: Map<string, UnitParseResult[]>,
        packageDirectories: readonly string[] = [],
    ): Repository {
        const kept = new Map<string, UnitParseResult[]>();
        const skipped = new Map<string, UnitParseResult[]>();
        const overlaps: UnitOverlap[] = [];
        const locationOf = (result: UnitParseResult) =>
            toPosix(path.relative(root, result.filePath));
        const rank = (location: string) => {
            const index = packageDirectories.findIndex(
                (directory) => location === directory || location.startsWith(`${directory}/`),
            );
            return index < 0 ? packageDirectories.length : index;
        };
        for (const [type, results] of units) {
            const byId = new Map<string, UnitParseResult[]>();
            for (const result of results) {
                byId.set(result.result.id, [...(byId.get(result.result.id) ?? []), result]);
            }
            const keep: UnitParseResult[] = [];
            const skip: UnitParseResult[] = [];
            for (const [id, same] of byId) {
                const ordered = [...same].sort((a, b) => {
                    const [la, lb] = [locationOf(a), locationOf(b)];
                    return rank(la) - rank(lb) || la.localeCompare(lb);
                });
                keep.push(ordered[0]!);
                if (ordered.length > 1) {
                    skip.push(...ordered.slice(1));
                    overlaps.push({
                        type,
                        id,
                        kept: locationOf(ordered[0]!),
                        skipped: ordered.slice(1).map(locationOf),
                    });
                }
            }
            kept.set(type, sortById(keep));
            if (skip.length) skipped.set(type, skip);
        }
        overlaps.sort((a, b) => a.type.localeCompare(b.type) || a.id.localeCompare(b.id));
        return new Repository(root, kept, overlaps, skipped, packageDirectories);
    }

    /** 単位のないリポジトリ */
    static empty(root: string): Repository {
        return new Repository(root, new Map());
    }

    /** 解析結果を 1 つずつ変えたリポジトリ (機密の値を伏せる (report/mask.ts) など。元は変えない) */
    map(fn: (type: string, result: UnitParseResult) => UnitParseResult): Repository {
        const mapAll = (units: Map<string, UnitParseResult[]>) =>
            new Map(
                [...units].map(([type, results]) => [
                    type,
                    results.map((result) => fn(type, result)),
                ]),
            );
        return new Repository(
            this.root,
            mapAll(this.units),
            this.overlaps,
            mapAll(this.skipped),
            this.packageDirectories,
        );
    }

    /** 木 (作業ツリー・git のある時点) のすべての単位を解析する */
    static async load(
        tree: SourceTree,
        types: readonly AnyUnitType[] = UNIT_TYPES,
    ): Promise<Repository> {
        const locations = locateUnits(await tree.listFiles(), types);
        const units = new Map<string, UnitParseResult[]>();
        for (const unitType of types) {
            const results = await Promise.all(
                (locations.get(unitType.type) ?? []).map((location) =>
                    parseUnitFromTree(tree, unitType, location),
                ),
            );
            units.set(unitType.type, results);
        }
        return Repository.of(tree.root, units, await packageDirectoriesOf(tree));
    }

    /** 単位の種類の一覧 (解析結果のある種類) */
    get types(): string[] {
        return [...this.units.keys()];
    }

    /** 種類の解析結果 (id の順)。種類がなければ空 */
    get(type: string): UnitParseResult[] {
        return this.units.get(type) ?? [];
    }

    /** すべての解析結果 (種類 → 解析結果) */
    entries(): [string, UnitParseResult[]][] {
        return [...this.units];
    }

    /** 単位の場所 (リポジトリからの相対パス) */
    locationOf(result: UnitParseResult): string {
        return toPosix(path.relative(this.root, result.filePath));
    }

    /**
     * changed の単位だけを tree から解析し直したリポジトリ (ほかの単位は今のまま使う)。
     * changed は種類 → 単位の場所。tree にない単位は除く
     */
    async update(
        tree: SourceTree,
        changed: UnitLocations,
        types: readonly AnyUnitType[] = UNIT_TYPES,
    ): Promise<Repository> {
        const files = await tree.listFiles();
        const fileSet = new Set(files);
        // 重なりで使わなかった単位も含めて選び直す
        const units = new Map(
            this.types
                .concat([...this.skipped.keys()])
                .map((type) => [type, [...this.get(type), ...(this.skipped.get(type) ?? [])]]),
        );
        for (const unitType of types) {
            const locations = new Set(changed.get(unitType.type) ?? []);
            if (locations.size === 0) continue;
            const kept = (units.get(unitType.type) ?? []).filter(
                (result) => !locations.has(this.locationOf(result)),
            );
            const reparsed = await Promise.all(
                [...locations]
                    .filter(
                        (location) =>
                            unitType.exists(location, fileSet) &&
                            unitType.filesOf(location, files).length > 0,
                    )
                    .map((location) => parseUnitFromTree(tree, unitType, location)),
            );
            units.set(unitType.type, [...kept, ...reparsed]);
        }
        return Repository.of(tree.root, units, this.packageDirectories);
    }
}

/** sfdx-project.json の packageDirectories (/ 区切り・前後の / を除く)。プロジェクトの木でなければ空 */
export const packageDirectoriesOf = async (tree: SourceTree): Promise<string[]> => {
    const project =
        'project' in tree && typeof tree.project === 'function'
            ? ((await (tree.project as () => Promise<unknown>)()) as
                  { packageDirectories?: { path: string }[] } | undefined)
            : undefined;
    return (project?.packageDirectories ?? [])
        .map((directory) =>
            toPosix(directory.path)
                .replace(/^\.\/+/, '')
                .replace(/\/+$/, ''),
        )
        .filter((directory) => directory !== '');
};

const sortById = (results: UnitParseResult[]) =>
    [...results].sort((a, b) => a.result.id.localeCompare(b.result.id));

// ---------------------------------------------------------------------------
// git
// ---------------------------------------------------------------------------

/**
 * git の変更ファイル (git のルートからのパス) を、subdirectory (GitTree の subdirectory) からのパスにする。
 * subdirectory の外のファイルは除く
 */
export const relativeGitFiles = (
    files: readonly GitDiffFile[],
    subdirectory: string,
): GitDiffFile[] => {
    const base = toPosix(subdirectory).replace(/^\/+|\/+$/g, '');
    if (!base) return [...files];
    const prefix = `${base}/`;
    const strip = (p: string | undefined) =>
        p !== undefined && p.startsWith(prefix) ? p.slice(prefix.length) : undefined;
    return files.flatMap((file) => {
        const filePath = strip(file.path);
        const oldPath = strip(file.oldPath);
        if (filePath === undefined && oldPath === undefined) return [];
        return [
            {
                ...file,
                path: filePath ?? oldPath!,
                ...(oldPath !== undefined && filePath !== undefined ? { oldPath } : {}),
            },
        ];
    });
};

/**
 * git の変更ファイルから、変わった単位 (種類 → 単位の場所)。
 * 移動・名前の変更は、前と後の両方の場所を入れる
 */
export const changedUnits = (
    files: readonly GitDiffFile[],
    types: readonly AnyUnitType[] = UNIT_TYPES,
): UnitLocations => {
    const paths = files.flatMap((file) => (file.oldPath ? [file.oldPath, file.path] : [file.path]));
    return new Map(
        types.map((unitType) => {
            const locations = new Set<string>();
            for (const filePath of paths) {
                const location = unitType.locate(filePath);
                if (location !== undefined) locations.add(location);
            }
            return [unitType.type, [...locations].sort()];
        }),
    );
};

/** 名前の変更・移動で対応付く単位 (種類 → 前の場所 → 後の場所)。git の renamed から決める */
export const renamedUnits = (
    files: readonly GitDiffFile[],
    types: readonly AnyUnitType[] = UNIT_TYPES,
): Map<string, Map<string, string>> =>
    new Map(
        types.map((unitType) => {
            const renames = new Map<string, string>();
            for (const file of files) {
                if (file.status !== 'renamed' || !file.oldPath) continue;
                const before = unitType.locate(file.oldPath);
                const after = unitType.locate(file.path);
                if (before !== undefined && after !== undefined && before !== after) {
                    renames.set(before, after);
                }
            }
            return [unitType.type, renames];
        }),
    );

// ---------------------------------------------------------------------------
// Diff
// ---------------------------------------------------------------------------

/** 単位の差分。名前の変更・移動で対応付けたものは renamedFrom (前の id) を持つ */
export type RepositoryUnitDiff = UnitDiff & { renamedFrom?: string };

/**
 * before / after のリポジトリの、種類ごとの単位の差分。
 * renames (renamedUnits) があれば、前の場所の単位を後の場所の単位と対応付ける (id が違っても)
 */
export const diffRepositories = (
    before: Repository,
    after: Repository,
    options: {
        types?: readonly AnyUnitType[];
        renames?: Map<string, Map<string, string>>;
    } = {},
): Map<string, RepositoryUnitDiff[]> => {
    const types = options.types ?? UNIT_TYPES;
    return new Map(
        types.map((unitType) => {
            const afterResults = after.get(unitType.type);
            const afterByLocation = new Map(
                afterResults.map((result) => [after.locationOf(result), result]),
            );
            const renames = options.renames?.get(unitType.type) ?? new Map<string, string>();
            const renamedFrom = new Map<string, string>();
            const beforeResults = before.get(unitType.type).map((result) => {
                const target = afterByLocation.get(renames.get(before.locationOf(result)) ?? '');
                if (!target || target.result.id === result.result.id) return result;
                renamedFrom.set(target.result.id, result.result.id);
                return { ...result, result: { ...result.result, id: target.result.id } };
            });
            const diffs = unitType.diffs(beforeResults, afterResults) as RepositoryUnitDiff[];
            return [
                unitType.type,
                diffs.map((diff) =>
                    renamedFrom.has(diff.id)
                        ? { ...diff, renamedFrom: renamedFrom.get(diff.id)! }
                        : diff,
                ),
            ];
        }),
    );
};
