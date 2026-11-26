import { formulaTextOf, templateTextOf } from '../types/metadata/formula';
import type { FxTemplateJson } from '../types/metadata/formula';
import type { Repository } from '../unit/repository';
import { type UnitParseResult, findUnitType, unitName } from '../unit/unitType';
import { compareKeyed } from './commons';
import type { MetadataPropertyRow, MetadataTypeRow, MetadataUnitRow, ReportInput } from './types';
import { recordOf as record, stringOf as text } from '../processor/commons/json';

// すべての種類の単位の土台の provider (metadata.units / metadata.types / metadata.properties)。
// 専用の provider がない種類 (53 種類のうち約 38) でも、一覧と設定値をドキュメントにできるようにする
// (docs/todo.md 2.1)。既定は今の状態のすべて。比べるときは status を付ける。
// 機密の値は runReportProvider が伏せたリポジトリを渡す (maskRepository)

export type MetadataFilter = {
    /** 単位の種類 (customTab・namedCredential など。UNIT_TYPES の type) */
    types?: string[];
    /** 単位の名前 */
    names?: string[];
};

type Unit = { type: string; name: string; location: string; result: UnitParseResult };

const unitsOf = (repository: Repository | undefined, filter: MetadataFilter): Unit[] | undefined =>
    repository
        ?.entries()
        .filter(([type]) => !filter.types || filter.types.includes(type))
        .flatMap(([type, results]) =>
            results.map((result) => ({
                type,
                name: unitName(type, result),
                location: repository.locationOf(result),
                result,
            })),
        )
        .filter((unit) => !filter.names || filter.names.includes(unit.name));

/** 単位のラベルと説明 (メタデータの label・masterLabel、Apex・LWC の -meta.xml) */
const labelOf = (base: Record<string, unknown> | undefined) => {
    const meta = record(base?.meta);
    return {
        label:
            text(base?.label) ??
            text(base?.masterLabel) ??
            text(meta?.masterLabel) ??
            text(meta?.label),
        description: text(base?.description) ?? text(meta?.description),
    };
};

const compareUnits = (input: ReportInput, filter: MetadataFilter) =>
    compareKeyed<Unit>(
        unitsOf(input.before, filter),
        unitsOf(input.after, filter)!,
        (unit) => `${unit.type}|${unit.name}`,
        input.before !== undefined,
        (b, a) => JSON.stringify(b.result.result.base) === JSON.stringify(a.result.result.base),
    ).sort((a, b) => a.key.localeCompare(b.key));

/** metadata.units: すべての種類の単位の一覧 */
export const getMetadataUnits = (
    input: ReportInput,
    filter: MetadataFilter = {},
): MetadataUnitRow[] =>
    compareUnits(input, filter).map((compared) => {
        const unit = (compared.after ?? compared.before)!;
        const base = record(unit.result.result.base);
        const { label, description } = labelOf(base);
        const skipped = Array.isArray(base?.skippedElements)
            ? (base.skippedElements as unknown[]).filter((e): e is string => typeof e === 'string')
            : [];
        return {
            ...(compared.status ? { status: compared.status } : {}),
            filePath: unit.location,
            unitType: unit.type,
            name: unit.name,
            ...(label !== undefined ? { label } : {}),
            ...(description !== undefined ? { description } : {}),
            readable: unit.result.dataType !== 'error' && base !== undefined,
            errorCount: unit.result.resolvedError.length,
            ...(skipped.length ? { skippedElements: skipped } : {}),
        };
    });

/** metadata.types: 単位の種類ごとの数 (読めなかったもの・エラーのあるものの数も) */
export const getMetadataTypes = (
    input: ReportInput,
    filter: MetadataFilter = {},
): MetadataTypeRow[] => {
    const rows = new Map<string, MetadataTypeRow>();
    for (const unit of getMetadataUnits(input, filter)) {
        const row = rows.get(unit.unitType) ?? {
            unitType: unit.unitType,
            lineage: findUnitType(unit.unitType)?.lineage ?? 'metadata',
            count: 0,
            unreadable: 0,
            withErrors: 0,
            ...(input.before ? { added: 0, removed: 0, changed: 0 } : {}),
        };
        if (unit.status !== 'removed') row.count++;
        if (!unit.readable) row.unreadable++;
        if (unit.errorCount > 0) row.withErrors++;
        if (unit.status === 'added' || unit.status === 'removed' || unit.status === 'changed') {
            row[unit.status] = (row[unit.status] ?? 0) + 1;
        }
        rows.set(unit.unitType, row);
    }
    return [...rows.values()].sort((a, b) => a.unitType.localeCompare(b.unitType));
};

// ---------------------------------------------------------------------------
// metadata.properties
// ---------------------------------------------------------------------------

/** 配列の要素を名前で示すときに使うキー (見つかった最初のもの) */
const NAME_KEYS = [
    'fullName',
    'apiName',
    'name',
    'developerName',
    'field',
    'parameterName',
    'picklist',
    'label',
];

export type Value = string | number | boolean;

/** 値を 1 つの文字列・数・真偽値にできれば、それ (数式・テンプレート・条件の行・XML の文字列) */
export const leafOf = (value: unknown): Value | undefined => {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }
    const node = record(value);
    if (!node) return undefined;
    const kind = text(node.kind);
    if (kind === 'fxTemplate') return templateTextOf(node as unknown as FxTemplateJson);
    if (kind?.startsWith('fx')) return formulaTextOf(node as never);
    if (kind === 'criterion') {
        const right = record(node.right);
        const rightText =
            right?.type === 'value'
                ? text(right.value)
                : right
                  ? leafOf(right.value ?? right)
                  : undefined;
        return [leafOf(node.left) ?? text(node.field), text(node.operator), rightText]
            .filter((part) => part !== undefined && part !== '')
            .join(' ');
    }
    // Flow の値 ({ type: 'stringValue', value: 'Gold' }・{ type: 'elementReference', value: 'x' })。参照は {!x}
    const keys = Object.keys(node).filter(
        (key) => key !== 'kind' && key !== 'sourceKeys' && key !== 'valueType',
    );
    if (keys.length === 2 && keys.includes('type') && keys.includes('value')) {
        const inner = leafOf(node.value);
        if (inner !== undefined) {
            return String(node.type).endsWith('Reference') ? `{!${String(inner)}}` : inner;
        }
    }
    // XML の要素の文字列 ({ "#text": "200", "@xsi:type": "xsd:string" })
    if ('#text' in node) return leafOf(node['#text']);
    return undefined;
};

const isLeafArray = (value: unknown[]) => value.every((item) => leafOf(item) !== undefined);

/** 配列の要素の名前 (名前のキーがなければ番号) */
const itemName = (item: unknown, index: number): string => {
    const node = record(item);
    for (const key of NAME_KEYS) {
        const name = node ? leafOf(node[key]) : undefined;
        if (name !== undefined && name !== '') return String(name);
    }
    return String(index + 1);
};

/** JSON を「場所 → 値」の行にする (kind・sourceKeys は持たない。値の配列は , でつなぐ) */
export const propertiesOf = (value: unknown, at: string, out: [string, Value][]): void => {
    const leaf = leafOf(value);
    if (leaf !== undefined) {
        if (at) out.push([at, leaf]);
        return;
    }
    if (Array.isArray(value)) {
        if (value.length === 0) return;
        if (isLeafArray(value)) {
            out.push([at, value.map((item) => String(leafOf(item))).join(', ')]);
            return;
        }
        value.forEach((item, index) => propertiesOf(item, `${at}[${itemName(item, index)}]`, out));
        return;
    }
    const node = record(value);
    if (!node) return;
    for (const [key, child] of Object.entries(node)) {
        if (key === 'kind' || key === 'sourceKeys') continue;
        propertiesOf(child, at ? `${at}.${key}` : key, out);
    }
};

/** 単位の設定値の行 (XML のメタデータ。Apex・LWC は -meta.xml・js-meta.xml だけ) */
const unitPropertiesOf = (unit: Unit): [string, Value][] => {
    const base = record(unit.result.result.base);
    if (!base) return [];
    const lineage = findUnitType(unit.type)?.lineage;
    const out: [string, Value][] = [];
    if (lineage === 'apex' || lineage === 'lwc') {
        const meta = base.meta;
        if (meta) propertiesOf(meta, 'meta', out);
        return out;
    }
    propertiesOf(base, '', out);
    return out;
};

/**
 * metadata.properties: 単位の設定値を「場所 → 値」の行で (例: `sharingCriteriaRules[Large_Invoices].accessLevel` → Edit)。
 * 数式は文字列に戻し、条件の行は「左 演算子 右」にする。Apex・LWC は -meta.xml の値だけ (中身は apex.*・lwc.*)。
 * 大きい種類 (Profile など) は行が多いので、types・names で絞る
 */
export const getMetadataProperties = (
    input: ReportInput,
    filter: MetadataFilter & { paths?: string[] } = {},
): MetadataPropertyRow[] => {
    const hasBefore = input.before !== undefined;
    return compareUnits(input, filter).flatMap((compared) => {
        const unit = (compared.after ?? compared.before)!;
        const rowsOf = (u: Unit | undefined) =>
            u
                ? unitPropertiesOf(u).map(([path, value]) => ({ path, value }))
                : hasBefore
                  ? []
                  : undefined;
        return compareKeyed(
            rowsOf(compared.before),
            rowsOf(compared.after) ?? [],
            (row) => row.path,
            hasBefore,
            (b, a) => b.value === a.value,
        )
            .filter((row) => {
                const path = (row.after ?? row.before)!.path;
                return !filter.paths || filter.paths.some((prefix) => path.startsWith(prefix));
            })
            .map((row): MetadataPropertyRow => {
                const { path, value } = (row.after ?? row.before)!;
                return {
                    ...(row.status ? { status: row.status } : {}),
                    filePath: unit.location,
                    unitType: unit.type,
                    name: unit.name,
                    path,
                    value,
                    ...(row.status === 'changed' && row.before ? { before: row.before.value } : {}),
                };
            });
    });
};
