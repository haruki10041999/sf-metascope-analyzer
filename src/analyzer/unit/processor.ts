import fs from 'node:fs/promises';
import path from 'node:path';

import type { ObjectParseResult } from '../parser/Metadata/parser';
import type { ObjectTranslationParseResult } from '../parser/Metadata/objectTranslation';
import type { DependencyGraph } from '../processor/dependency/graph';
import {
    type ObjectDependency,
    type ObjectInfo,
    analyzeObject,
    getObjectDependencies,
    getRelatedObjectApiNames,
} from '../processor/Metadata/analysis';
import type { ObjectTranslationUnitDiff, ObjectUnitDiff } from '../processor/Metadata/diff/unit';
import {
    type TranslationCoverage,
    analyzeTranslationCoverages,
} from '../processor/Metadata/translation';
import {
    type DependencyView,
    type ObjectView,
    makeDependencyDiffViews,
    makeDependencyViews,
    makeObjectDiffViews,
    makeObjectViews,
} from '../processor/Metadata/view';

import { dependencyGraphOf } from './dependencies';
import { type CompareRange, WORKING_TREE, resolveCompareRange } from './gitRange';
import { ProjectTree } from './project';
import { type RepositoryUnitDiff, Repository, diffRepositories } from './repository';
import { GitTree, WorkingTree } from './sourceTree';
import { UnitStore } from './store';
import { type AnyUnitType, UNIT_TYPES } from './unitType';

// 保存しておいた前回の解析結果 (before) と、リポジトリの今の状態 (after) を Repository で持ち、
// 差分・表示用のデータ・レポートの入力・依存関係のグラフを作る。方針: docs/analysis-plan.md 2 章・1.4
// (以前の MetadataProcessor (オブジェクト・翻訳だけ) を、すべての単位の種類に広げたもの)

/** 表示するオブジェクトの選び方。targets を指定すると、そこから参照関係を depth 段たどったものに絞る */
export type MetadataViewOptions = {
    isDiff: boolean;
    targets?: string[];
    depth?: number;
};

/** 翻訳の網羅の絞り込み */
export type TranslationCoverageFilter = {
    /** 言語 (ja / en_US など)。省略時はすべて */
    locales?: string[];
    /** オブジェクトの API 名。省略時はすべて */
    objects?: string[];
};

export type RepositoryProcessorOptions = {
    /** 読む単位の種類 (既定はすべて) */
    types?: readonly AnyUnitType[];
};

/** レポートの provider の入力 (report/types.ts の ReportInput と同じ形) */
export type RepositoryInput = { before?: Repository; after: Repository };

/** 比べる 2 つの時点と、その説明 (レポートに出す) */
export type ComparedInput = { input: RepositoryInput; compared: string };

/** git のコミットの解析結果をメモリに残す数 */
const COMMIT_CACHE_SIZE = 4;

const objectsOf = (results: readonly unknown[]) =>
    (results as ObjectParseResult[]).flatMap((result) =>
        result.dataType === 'object' ? [result.result.base] : [],
    );

const translationsOf = (results: readonly unknown[]) =>
    (results as ObjectTranslationParseResult[]).flatMap((result) =>
        result.dataType === 'objectTranslation' ? [result.result.base] : [],
    );

const objectInfosOf = (results: readonly unknown[]): ObjectInfo[] =>
    objectsOf(results).map(analyzeObject);

export class RepositoryProcessor {
    /** 前回の解析結果 (保存データ)。なければ空 */
    before: Repository;
    /** リポジトリの今の状態 */
    after: Repository;
    private diffs?: Map<string, RepositoryUnitDiff[]> | undefined;
    /** 保存の置き場 (目録・ソース・解析結果)。docs/save-format-plan.md 4.1 */
    readonly store: UnitStore;

    private constructor(
        readonly repositoryRoot: string,
        /** 保存先の親フォルダ (置き場は <savingRoot>/store) */
        readonly savingRoot: string,
        private readonly types: readonly AnyUnitType[],
    ) {
        this.before = Repository.empty(repositoryRoot);
        this.after = Repository.empty(repositoryRoot);
        this.store = new UnitStore(path.join(savingRoot, 'store'), repositoryRoot, types);
    }

    /** 置き場 (<savingRoot>/store) */
    get savedDir(): string {
        return this.store.dir;
    }

    /** savingRoot は保存先の親フォルダ、repositoryRoot は sfdx のプロジェクト (sfdx-project.json の場所) */
    static async create(
        savingRoot: string,
        repositoryRoot: string,
        options: RepositoryProcessorOptions = {},
    ): Promise<RepositoryProcessor> {
        const processor = new RepositoryProcessor(
            repositoryRoot,
            savingRoot,
            options.types ?? UNIT_TYPES,
        );
        await processor.reset();
        return processor;
    }

    /**
     * 保存データとリポジトリを読み直す。中身の変わっていない単位は parse し直さない
     * (保存した解析結果・前回読んだ解析結果を使う。docs/save-format-plan.md の S3)
     */
    async reset(): Promise<void> {
        this.before = await this.store.loadBefore();
        this.after = await this.store.loadTree(
            new ProjectTree(new WorkingTree(this.repositoryRoot)),
        );
        this.store.retain(this.before, this.after);
        this.diffs = undefined;
    }

    /** 前回の解析結果 (今の置き場所の版の目録) を保存しているか */
    hasSaved(): Promise<boolean> {
        return this.store.hasSaved();
    }

    /**
     * 今の解析結果を保存し、次の差分の基準 (before) にする。リポジトリにない単位の保存データは消す。
     * 保存したものは after と同じなので、読み直さず after をそのまま before にする (docs/save-format-plan.md の S0)
     */
    async save(): Promise<void> {
        await this.store.save(this.after);
        // 版 7 までの置き場 (<savingRoot>/units) は移行せずに消す
        await fs.rm(path.join(this.savingRoot, 'units'), { recursive: true, force: true });
        this.before = this.after;
        this.diffs = undefined;
    }

    /** 単位の種類ごとの差分 (before → after) */
    getUnitDiffs(type: string): RepositoryUnitDiff[] {
        this.diffs ??= diffRepositories(this.before, this.after, { types: this.types });
        return this.diffs.get(type) ?? [];
    }

    getObjectUnitDiffs(): ObjectUnitDiff[] {
        return this.getUnitDiffs('object') as unknown as ObjectUnitDiff[];
    }

    getObjectTranslationUnitDiffs(): ObjectTranslationUnitDiff[] {
        return this.getUnitDiffs('objectTranslation') as unknown as ObjectTranslationUnitDiff[];
    }

    /** 保存した基準と今の状態 (差分のレポートの入力)。保存データがなければ before を持たない (1 時点) */
    getReportInput(): RepositoryInput {
        const hasBefore = this.before.entries().some(([, results]) => results.length > 0);
        return hasBefore ? { before: this.before, after: this.after } : { after: this.after };
    }

    /** コミットの解析結果 (コミットのハッシュ → リポジトリ。新しいものほど後ろ) */
    private readonly commits = new Map<string, Repository>();

    /** git のコミットの木を読む (中身の同じ単位は置き場の解析結果を使う。保存に使う木は書き換えない) */
    private async loadCommit(gitRoot: string, subdirectory: string, commit: string) {
        const cached = this.commits.get(commit);
        if (cached) {
            this.commits.delete(commit);
            this.commits.set(commit, cached);
            return cached;
        }
        const tree = new GitTree(gitRoot, commit, subdirectory);
        try {
            const repository = await this.store.loadTree(new ProjectTree(tree), { track: false });
            this.commits.set(commit, repository);
            if (this.commits.size > COMMIT_CACHE_SIZE) {
                this.commits.delete(this.commits.keys().next().value!);
            }
            return repository;
        } finally {
            tree.close();
        }
    }

    /**
     * レポートの入力。既定は今の状態 (作業ツリー) だけ (1 時点。すべてを出し、status は付けない)。
     * range を渡せば git の範囲 (docs/implementation-roadmap.md の R5)、diff なら保存した基準と作業ツリーを比べる。
     * このリポジトリの第一の目的はドキュメントとコードの理解で、差分は補助 (docs/implementation-roadmap.md の冒頭)
     */
    async getComparedInput(
        range?: CompareRange,
        options: { diff?: boolean } = {},
    ): Promise<ComparedInput> {
        if (!range) {
            if (!options.diff) return { input: { after: this.after }, compared: '作業ツリー' };
            const input = this.getReportInput();
            return {
                input,
                compared: input.before
                    ? '保存した基準 → 作業ツリー'
                    : '作業ツリー (保存した基準なし)',
            };
        }
        const resolved = await resolveCompareRange(this.repositoryRoot, range);
        const before = await this.loadCommit(
            resolved.gitRoot,
            resolved.subdirectory,
            resolved.before,
        );
        const after =
            resolved.after === WORKING_TREE
                ? this.after
                : await this.loadCommit(resolved.gitRoot, resolved.subdirectory, resolved.after);
        return { input: { before, after }, compared: resolved.label };
    }

    /** 今のリポジトリの依存関係のグラフ */
    getDependencyGraph(): DependencyGraph {
        return dependencyGraphOf(this.after);
    }

    /** 今の翻訳の網羅 (オブジェクトと突き合わせる)。前回の保存データがあれば、古い翻訳 (outdated) も見る */
    getTranslationCoverages(filter: TranslationCoverageFilter = {}): TranslationCoverage[] {
        const before = {
            objects: this.before.get('object'),
            translations: this.before.get('objectTranslation'),
        };
        const hasBefore = before.objects.length > 0 || before.translations.length > 0;
        return analyzeTranslationCoverages(
            translationsOf(this.after.get('objectTranslation')),
            objectsOf(this.after.get('object')),
            hasBefore
                ? {
                      translations: translationsOf(before.translations),
                      objects: objectsOf(before.objects),
                  }
                : undefined,
        ).filter(
            (coverage) =>
                (!filter.locales || filter.locales.includes(coverage.locale)) &&
                (!filter.objects || filter.objects.includes(coverage.objectApiName)),
        );
    }

    /** 表示用のオブジェクト。isDiff なら前回からの差分 (削除されたものも含む) */
    getObjectViews(options: MetadataViewOptions): ObjectView[] {
        const before = objectInfosOf(this.before.get('object'));
        const after = objectInfosOf(this.after.get('object'));
        const views = options.isDiff
            ? makeObjectDiffViews(before, after, this.getObjectUnitDiffs())
            : makeObjectViews(after);
        const names = this.getTargetNames(options, before, after);
        return names ? views.filter((view) => names.has(view.apiName)) : views;
    }

    /** 表示用の参照関係。targets を指定したときは、選んだオブジェクトから出る参照に絞る */
    getDependencyViews(options: MetadataViewOptions): DependencyView[] {
        const before = objectInfosOf(this.before.get('object'));
        const after = objectInfosOf(this.after.get('object'));
        const views = options.isDiff
            ? makeDependencyDiffViews(getObjectDependencies(before), getObjectDependencies(after))
            : makeDependencyViews(getObjectDependencies(after));
        const names = this.getTargetNames(options, before, after);
        return names ? views.filter((view) => names.has(view.parentObjectApiName)) : views;
    }

    private getTargetNames(
        options: MetadataViewOptions,
        before: ObjectInfo[],
        after: ObjectInfo[],
    ): Set<string> | undefined {
        if (!options.targets) return undefined;
        const dependencies: ObjectDependency[] = options.isDiff
            ? [...getObjectDependencies(before), ...getObjectDependencies(after)]
            : getObjectDependencies(after);
        return new Set(getRelatedObjectApiNames(dependencies, options.targets, options.depth ?? 1));
    }
}
