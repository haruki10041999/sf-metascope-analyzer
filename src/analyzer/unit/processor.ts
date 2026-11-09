import fs from 'node:fs/promises';
import path from 'node:path';

import { hasCurrentSavedData } from '../parser/commons';
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
import { ProjectTree } from './project';
import { type RepositoryUnitDiff, Repository, diffRepositories } from './repository';
import { WorkingTree } from './sourceTree';
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

    private constructor(
        readonly repositoryRoot: string,
        /** 保存先 (<savingRoot>/units) */
        readonly savedDir: string,
        private readonly types: readonly AnyUnitType[],
    ) {
        this.before = Repository.empty(repositoryRoot);
        this.after = Repository.empty(repositoryRoot);
    }

    /** savingRoot は保存先の親フォルダ、repositoryRoot は sfdx のプロジェクト (sfdx-project.json の場所) */
    static async create(
        savingRoot: string,
        repositoryRoot: string,
        options: RepositoryProcessorOptions = {},
    ): Promise<RepositoryProcessor> {
        const processor = new RepositoryProcessor(
            repositoryRoot,
            path.join(savingRoot, 'units'),
            options.types ?? UNIT_TYPES,
        );
        await processor.reset();
        return processor;
    }

    /** 保存データとリポジトリを読み直す */
    async reset(): Promise<void> {
        this.before = await Repository.loadSaved(this.repositoryRoot, this.savedDir, this.types);
        this.after = await Repository.load(
            new ProjectTree(new WorkingTree(this.repositoryRoot)),
            this.types,
        );
        this.diffs = undefined;
    }

    /** 前回の解析結果 (今の版) を保存しているか。版が古ければ保存していないとみなす */
    hasSaved(): Promise<boolean> {
        return hasCurrentSavedData(this.savedDir);
    }

    /** 今の解析結果を保存し、次の差分の基準 (before) にする。リポジトリにない単位の保存データは消す */
    async save(): Promise<void> {
        await fs.rm(this.savedDir, { recursive: true, force: true });
        await fs.mkdir(this.savedDir, { recursive: true });
        await this.after.save(this.savedDir, this.types);
        await this.reset();
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

    /** レポートの provider の入力。保存データがなければ before を持たない (1 時点のレポート) */
    getReportInput(): RepositoryInput {
        const hasBefore = this.before.entries().some(([, results]) => results.length > 0);
        return hasBefore ? { before: this.before, after: this.after } : { after: this.after };
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
