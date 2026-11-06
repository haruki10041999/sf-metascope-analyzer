import path from 'node:path';

import {
    type GitDiffFile,
    listSavedIds,
    SavedDataVersionError,
    writeSaveDataInfo,
} from '../parser';

import type { SourceTree } from './sourceTree';
import {
    type AnyUnitType,
    type UnitDiff,
    type UnitParseResult,
    UNIT_TYPES,
    findUnitTypeBySaveId,
} from './unitType';

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

/** 単位 1 つを木から読んで解析する。結果の filePath は木のルートからの絶対パス */
export const parseUnitFromTree = async (
    tree: SourceTree,
    unitType: AnyUnitType,
    location: string,
): Promise<UnitParseResult> => {
    const files = unitType.filesOf(location, await tree.listFiles());
    const sources = (
        await Promise.all(
            files.map(async (filePath) => {
                const source = await tree.readFile(filePath);
                return source === undefined
                    ? []
                    : [{ fileName: path.posix.basename(filePath), filePath, source }];
            }),
        )
    ).flat();
    const result = await unitType.parseUnit(location, sources);
    return { ...result, filePath: path.join(tree.root, result.filePath) };
};

/** 単位の種類 → 解析結果 (id の順) */
export class Repository {
    private constructor(
        readonly root: string,
        private readonly units: Map<string, UnitParseResult[]>,
    ) {}

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
            units.set(unitType.type, sortById(results));
        }
        return new Repository(tree.root, units);
    }

    /**
     * 保存したリポジトリを読む (Repository.save で保存したもの)。
     * 版の違う保存データが 1 つでもあれば、保存データなし (空のリポジトリ) とする
     */
    static async loadSaved(
        root: string,
        baseDir: string,
        types: readonly AnyUnitType[] = UNIT_TYPES,
    ): Promise<Repository> {
        const units = new Map<string, UnitParseResult[]>(types.map((t) => [t.type, []]));
        const typeNames = new Set(types.map((t) => t.type));
        try {
            for (const saveId of await listSavedIds(baseDir)) {
                const unitType = findUnitTypeBySaveId(saveId);
                if (!unitType || !typeNames.has(unitType.type)) continue;
                units.get(unitType.type)!.push(await unitType.load(baseDir, saveId));
            }
        } catch (e) {
            if (e instanceof SavedDataVersionError) return new Repository(root, new Map());
            throw e;
        }
        return new Repository(
            root,
            new Map([...units].map(([type, results]) => [type, sortById(results)])),
        );
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

    /** すべての単位を baseDir に保存する (本番用の msgpack。保存名は種類の接頭辞 + 名前) */
    async save(baseDir: string, types: readonly AnyUnitType[] = UNIT_TYPES): Promise<void> {
        for (const unitType of types) {
            for (const result of this.get(unitType.type)) {
                await writeSaveDataInfo(unitType.save(baseDir, result));
            }
        }
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
        const units = new Map(this.units);
        for (const unitType of types) {
            const locations = new Set(changed.get(unitType.type) ?? []);
            if (locations.size === 0) continue;
            const kept = this.get(unitType.type).filter(
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
            units.set(unitType.type, sortById([...kept, ...reparsed]));
        }
        return new Repository(tree.root, units);
    }
}

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
