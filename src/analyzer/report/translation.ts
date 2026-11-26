import {
    type TranslationCoverage,
    type TranslationCoverageItem,
    analyzeTranslationCoverages,
} from '../processor/Metadata/translation';
import { changedProps, compareKeyed, readable, rowBase } from './commons';
import type {
    MetadataSnapshot,
    SnapshotInput,
    TranslationCoverageRow,
    TranslationItemRow,
} from './types';

// 翻訳の provider (translation.coverage / translation.items)。方針: docs/report-components-plan.md 2.2 章、
// docs/object-translation.md 4 章。既定はすべての言語・すべての項目 (languages で絞る)。
// 比べる時点があれば (diff / compare)、古い翻訳 (outdated) も見て、行に status を付ける

export type TranslationFilter = { languages?: string[]; objects?: string[] };

type Coverage = TranslationCoverage & { filePath?: string };

/** ある時点の翻訳の網羅 (同じ時点のオブジェクトと突き合わせる。before があれば古い翻訳も見る) */
const coveragesOf = (
    snapshot: MetadataSnapshot | undefined,
    before: MetadataSnapshot | undefined,
    filter: TranslationFilter,
): Coverage[] | undefined => {
    if (!snapshot) return undefined;
    const translations = readable(snapshot.objectTranslations, 'objectTranslation');
    const objects = (s: MetadataSnapshot) => readable(s.objects, 'object').map((o) => o.json);
    const filePaths = new Map(
        translations.map((t) => [`${t.json.objectApiName}-${t.json.locale}`, t.filePath]),
    );
    return analyzeTranslationCoverages(
        translations.map((t) => t.json),
        objects(snapshot),
        before
            ? {
                  translations: readable(before.objectTranslations, 'objectTranslation').map(
                      (t) => t.json,
                  ),
                  objects: objects(before),
              }
            : undefined,
    )
        .filter(
            (c) =>
                (!filter.languages || filter.languages.includes(c.locale)) &&
                (!filter.objects || filter.objects.includes(c.objectApiName)),
        )
        .map((c) => {
            const filePath = filePaths.get(c.id);
            return filePath !== undefined ? { ...c, filePath } : c;
        });
};

const compareCoverages = (input: SnapshotInput, filter: TranslationFilter) =>
    compareKeyed<Coverage>(
        coveragesOf(input.before, undefined, filter),
        coveragesOf(input.after, input.before, filter),
        (c) => c.id,
        input.before !== undefined,
        () => true,
    ).sort((a, b) => a.key.localeCompare(b.key));

const summaryOf = (c: Coverage) => {
    // 翻訳すべきもの (orphan はオブジェクトにないので数えない)
    const total =
        c.counts.translated + c.counts.missing + c.counts.sameAsSource + c.counts.outdated;
    return {
        object: c.objectApiName,
        language: c.locale,
        objectFound: c.objectFound,
        total,
        translated: c.counts.translated,
        missing: c.counts.missing,
        sameAsSource: c.counts.sameAsSource,
        orphan: c.counts.orphan,
        outdated: c.counts.outdated,
        coverage: total === 0 ? 100 : Math.round((c.counts.translated / total) * 100),
    };
};

/** translation.coverage: オブジェクト × 言語ごとの翻訳の網羅 (件数と割合) */
export const getTranslationCoverage = (
    input: SnapshotInput,
    filter: TranslationFilter = {},
): TranslationCoverageRow[] =>
    compareCoverages(input, filter).map((compared) => {
        const coverage = (compared.after ?? compared.before)!;
        const summary = summaryOf(coverage);
        const changed =
            compared.before && compared.after
                ? changedProps(summaryOf(compared.before), summaryOf(compared.after)).map(
                      (c) => c.name,
                  )
                : [];
        const status =
            compared.status === 'unchanged' && changed.length
                ? ('changed' as const)
                : compared.status;
        return {
            ...rowBase(status ? { status } : {}, undefined, coverage.filePath),
            ...(changed.length ? { changedProperties: changed } : {}),
            ...summary,
        };
    });

type ItemStatus = TranslationItemRow['translationStatus'];

/**
 * translation.items: 翻訳する項目ごとの、翻訳元・訳・状態 (未訳・翻訳元と同じ・対象がない・古い)。
 * statuses で状態を絞る (例: ['missing'] で未訳だけ)
 */
export const getTranslationItems = (
    input: SnapshotInput,
    filter: TranslationFilter & { statuses?: ItemStatus[] } = {},
): TranslationItemRow[] => {
    const hasBefore = input.before !== undefined;
    return compareCoverages(input, filter).flatMap((compared) => {
        const coverage = (compared.after ?? compared.before)!;
        return compareKeyed<TranslationCoverageItem>(
            compared.before ? compared.before.items : hasBefore ? [] : undefined,
            compared.after ? compared.after.items : [],
            (item) => `${item.kind}:${item.name}`,
            hasBefore,
            (b, a) => b.translation === a.translation && b.source === a.source,
        )
            .filter((row) => {
                const item = (row.after ?? row.before)!;
                return !filter.statuses || filter.statuses.includes(item.status);
            })
            .map((row): TranslationItemRow => {
                const item = (row.after ?? row.before)!;
                const changed =
                    row.status === 'changed'
                        ? changedProps(row.before, row.after, ['sourceKeys', 'status']).map(
                              (c) => c.name,
                          )
                        : [];
                const keys = item.sourceKeys.translation ?? item.sourceKeys.object;
                return {
                    ...rowBase(row, keys ? { sourceKeys: keys } : undefined, coverage.filePath),
                    ...(changed.length ? { changedProperties: changed } : {}),
                    object: coverage.objectApiName,
                    language: coverage.locale,
                    kind: item.kind,
                    name: item.name,
                    ...(item.source !== undefined ? { source: item.source } : {}),
                    ...(item.translation !== undefined ? { translation: item.translation } : {}),
                    translationStatus: item.status,
                };
            });
    });
};
