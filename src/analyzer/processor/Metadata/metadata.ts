import fs from 'node:fs/promises';
import path from 'path';

import {
    MetadataParser,
    ObjectParseResult,
    ObjectTranslationParseResult,
    ObjectTranslationParser,
    SaveDataInfo,
} from '../../parser';

import {
    ObjectDependency,
    ObjectInfo,
    analyzeObject,
    getObjectDependencies,
    getRelatedObjectApiNames,
} from './analysis';
import {
    ObjectTranslationUnitDiff,
    ObjectUnitDiff,
    makeObjectTranslationUnitDiffs,
    makeObjectUnitDiffs,
} from './diff/unit';
import { TranslationCoverage, analyzeTranslationCoverages } from './translation';
import {
    DependencyView,
    ObjectView,
    makeDependencyDiffViews,
    makeDependencyViews,
    makeObjectDiffViews,
    makeObjectViews,
} from './view';

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

const toObjects = (results: ObjectParseResult[]) =>
    results.flatMap((result) => (result.dataType === 'object' ? [result.result.base] : []));

const toTranslations = (results: ObjectTranslationParseResult[]) =>
    results.flatMap((result) =>
        result.dataType === 'objectTranslation' ? [result.result.base] : [],
    );

const toObjectInfos = (results: ObjectParseResult[]): ObjectInfo[] =>
    toObjects(results).map(analyzeObject);

const writeSaveData = async (saveData: SaveDataInfo[]) => {
    for (const { outputPath, data } of saveData) {
        await fs.writeFile(outputPath, data as Uint8Array);
    }
};

/**
 * 保存しておいた前回の解析結果 (before) と、リポジトリの今のオブジェクト・翻訳 (after) を読み、
 * 差分と表示用のデータを作る
 */
export class MetadataProcessor {
    private readonly objectsDir: string;
    private readonly savedDir: string;
    private readonly translationsDir: string;
    private readonly savedTranslationsDir: string;

    private before: ObjectParseResult[] = [];
    private after: ObjectParseResult[] = [];
    private unitDiffs: ObjectUnitDiff[] = [];
    private beforeTranslations: ObjectTranslationParseResult[] = [];
    private afterTranslations: ObjectTranslationParseResult[] = [];
    private translationUnitDiffs: ObjectTranslationUnitDiff[] = [];

    constructor(
        savingRoot: string, // 結果を保存しているフォルダ
        repositoryRoot: string,
    ) {
        const sourceRoot = path.join(repositoryRoot, 'force-app', 'main', 'default');
        this.savedDir = path.join(savingRoot, 'objects');
        this.objectsDir = path.join(sourceRoot, 'objects');
        // 翻訳はオブジェクトと別のファイルなので、保存も分ける
        this.savedTranslationsDir = path.join(savingRoot, 'objectTranslations');
        this.translationsDir = path.join(sourceRoot, 'objectTranslations');
    }

    static async create(savingRoot: string, repositoryRoot: string): Promise<MetadataProcessor> {
        const processor = new MetadataProcessor(savingRoot, repositoryRoot);
        await processor.reset();
        return processor;
    }

    async reset(): Promise<void> {
        this.before = await MetadataParser.readSavedObjects(this.savedDir);
        this.after = await MetadataParser.parseObjects(this.objectsDir);
        this.unitDiffs = makeObjectUnitDiffs(this.before, this.after);

        this.beforeTranslations = await ObjectTranslationParser.readSavedObjectTranslations(
            this.savedTranslationsDir,
        );
        this.afterTranslations = await ObjectTranslationParser.parseObjectTranslations(
            this.translationsDir,
        );
        this.translationUnitDiffs = makeObjectTranslationUnitDiffs(
            this.beforeTranslations,
            this.afterTranslations,
        );
    }

    /** 前回の解析結果を保存しているか */
    async hasSavedObjects(): Promise<boolean> {
        const names = await fs.readdir(this.savedDir).catch(() => [] as string[]);
        return names.some((name) => name.endsWith('.msgpack'));
    }

    /**
     * 今の解析結果 (オブジェクトと翻訳) を保存し、次の差分の基準 (before) にする。
     * リポジトリにないオブジェクト・翻訳の保存データは消す
     */
    async save(): Promise<void> {
        for (const directory of [this.savedDir, this.savedTranslationsDir]) {
            await fs.rm(directory, { recursive: true, force: true });
            await fs.mkdir(directory, { recursive: true });
        }
        for (const target of this.after) {
            await writeSaveData(MetadataParser.saveObjectFile(this.savedDir, target));
        }
        for (const target of this.afterTranslations) {
            await writeSaveData(
                ObjectTranslationParser.saveObjectTranslationFile(
                    this.savedTranslationsDir,
                    target,
                ),
            );
        }
        await this.reset();
    }

    getObjectUnitDiffs(): ObjectUnitDiff[] {
        return this.unitDiffs;
    }

    getBeforeParseResults(): ObjectParseResult[] {
        return this.before;
    }

    getAfterParseResults(): ObjectParseResult[] {
        return this.after;
    }

    getObjectTranslationUnitDiffs(): ObjectTranslationUnitDiff[] {
        return this.translationUnitDiffs;
    }

    getBeforeTranslationParseResults(): ObjectTranslationParseResult[] {
        return this.beforeTranslations;
    }

    getAfterTranslationParseResults(): ObjectTranslationParseResult[] {
        return this.afterTranslations;
    }

    /** 今の翻訳の網羅 (オブジェクトと突き合わせる)。前回の保存データがあれば、古い翻訳 (outdated) も見る */
    getTranslationCoverages(filter: TranslationCoverageFilter = {}): TranslationCoverage[] {
        const hasBefore = this.before.length > 0 || this.beforeTranslations.length > 0;
        return analyzeTranslationCoverages(
            toTranslations(this.afterTranslations),
            toObjects(this.after),
            hasBefore
                ? {
                      translations: toTranslations(this.beforeTranslations),
                      objects: toObjects(this.before),
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
        const before = toObjectInfos(this.before);
        const after = toObjectInfos(this.after);
        const views = options.isDiff
            ? makeObjectDiffViews(before, after, this.unitDiffs)
            : makeObjectViews(after);
        const names = this.getTargetNames(options, before, after);
        return names ? views.filter((view) => names.has(view.apiName)) : views;
    }

    /** 表示用の参照関係。targets を指定したときは、選んだオブジェクトから出る参照に絞る */
    getDependencyViews(options: MetadataViewOptions): DependencyView[] {
        const before = getObjectDependencies(toObjectInfos(this.before));
        const after = getObjectDependencies(toObjectInfos(this.after));
        const views = options.isDiff
            ? makeDependencyDiffViews(before, after)
            : makeDependencyViews(after);
        const names = this.getTargetNames(
            options,
            toObjectInfos(this.before),
            toObjectInfos(this.after),
        );
        return names ? views.filter((view) => names.has(view.parentObjectApiName)) : views;
    }

    private getTargetNames(
        options: MetadataViewOptions,
        before: ObjectInfo[],
        after: ObjectInfo[],
    ): Set<string> | undefined {
        if (!options.targets) {
            return undefined;
        }
        const dependencies: ObjectDependency[] = options.isDiff
            ? [...getObjectDependencies(before), ...getObjectDependencies(after)]
            : getObjectDependencies(after);
        return new Set(getRelatedObjectApiNames(dependencies, options.targets, options.depth ?? 1));
    }
}
