import type { ApexUnitJson, ApexUnitParseResult } from '../parser/Apex/unit';
import { analyzeApexUnit } from '../processor/Apex/calls';
import {
    type ApexOutlineMember,
    apexInterfaceKeyOf,
    apexOutlineOf,
} from '../processor/Apex/interface';
import { isSameValue } from '../processor/commons/diff/commons';
import { getApexDependencies } from '../processor/dependency/apex';
import type { TriggerUnitJson } from '../types';
import { type Compared, changedProps, compareKeyed, rowBase } from './commons';
import type { ApexDataAccessRow, ApexOutlineRow, MetadataSnapshot, SnapshotInput } from './types';

// Apex のドキュメント・理解のための provider (apex.outline / apex.dataAccess)。
// 方針: docs/report-components-plan.md 2.3 章、順番は docs/apex-json-analysis.md 7 章 (クラスの概要 → データアクセス)。
// 既定は今の状態のすべて (status なし)。比べる時点があれば (diff / compare)、行に status と変わったプロパティの名前を付ける

/** 絞り込みの引数 (クラス・トリガーの名前) */
export type ApexFilter = { classes?: string[] };

type Unit = { result: ApexUnitParseResult; json: ApexUnitJson };

const unitsOf = (snapshot: MetadataSnapshot | undefined, filter: ApexFilter): Unit[] | undefined =>
    snapshot
        ? (snapshot.apex ?? [])
              .filter((r) => r.dataType === 'apexUnit' && r.result.base)
              .map((r) => ({ result: r, json: r.result.base as ApexUnitJson }))
              .filter((u) => !filter.classes || filter.classes.includes(u.json.name))
        : undefined;

/** クラス・トリガーを名前で対応付ける (名前の順) */
const compareUnits = (input: SnapshotInput, filter: ApexFilter, types: string[]) =>
    compareKeyed<Unit>(
        unitsOf(input.before, filter)?.filter((u) => types.includes(u.json.unitType)),
        unitsOf(input.after, filter)?.filter((u) => types.includes(u.json.unitType)),
        (u) => `${u.json.unitType}:${u.json.name}`,
        input.before !== undefined,
        () => true,
    ).sort((a, b) => a.key.localeCompare(b.key));

/** 単位の中の行を、before / after で対応付ける */
const compareRows = <T>(
    unit: Compared<Unit>,
    hasBefore: boolean,
    rowsOf: (unit: Unit) => T[],
    key: (row: T) => string,
    same: (before: T, after: T) => boolean,
): Compared<T>[] =>
    compareKeyed<T>(
        unit.before ? rowsOf(unit.before) : hasBefore ? [] : undefined,
        unit.after ? rowsOf(unit.after) : [],
        key,
        hasBefore,
        same,
    );

const filePathOf = (unit: Compared<Unit>) => (unit.after ?? unit.before)!.result.filePath;

// ---------------------------------------------------------------------------
// apex.outline
// ---------------------------------------------------------------------------

type OutlineItem = Omit<ApexOutlineMember, 'access' | 'memberType'> & {
    access?: ApexOutlineMember['access'];
    memberType: ApexOutlineRow['memberType'];
    events?: string[];
};

const triggerItem = (unit: ApexUnitJson): OutlineItem[] => {
    const source = unit.source;
    if (!source || source.fileType !== 'trigger') return [];
    const content = source.content as unknown as TriggerUnitJson;
    return [
        {
            owner: content.name,
            memberType: 'trigger',
            name: content.name,
            type: content.object,
            static: false,
            annotations: [],
            events: content.case.map(
                (c) => `${c.timing.toLowerCase()} ${c.actionType.toLowerCase()}`,
            ),
        },
    ];
};

/** クラスがテストか (いちばん外の型の @isTest) */
const testClassOf = (members: ApexOutlineMember[]) =>
    members[0]?.annotations.some((a) => a.toLowerCase() === 'istest') ?? false;

/**
 * apex.outline: クラス・トリガーのすべてのクラス・メンバー (アクセスに関係なく。private・テストも)。
 * ドキュメント・コードの理解のため。外から使えるものだけは apex.interface
 */
export const getApexOutline = (
    input: SnapshotInput,
    filter: ApexFilter & { includeTests?: boolean } = {},
): ApexOutlineRow[] => {
    const hasBefore = input.before !== undefined;
    const itemsOf = (unit: Unit): OutlineItem[] => {
        if (unit.json.unitType === 'trigger') return triggerItem(unit.json);
        const members = apexOutlineOf(unit.json);
        if (filter.includeTests === false && testClassOf(members)) return [];
        return members;
    };
    return compareUnits(input, filter, ['class', 'trigger']).flatMap((unit) => {
        const json = (unit.after ?? unit.before)!.json;
        const isTest =
            json.unitType === 'class' && testClassOf(apexOutlineOf(json))
                ? { isTest: true as const }
                : {};
        return compareRows<OutlineItem>(
            unit,
            hasBefore,
            itemsOf,
            (item) =>
                item.memberType === 'trigger'
                    ? `trigger:${item.name}`
                    : apexInterfaceKeyOf(item as ApexOutlineMember as never),
            (b, a) => changedProps(b, a, ['sourceKeys']).length === 0,
        ).map((row): ApexOutlineRow => {
            const item = (row.after ?? row.before)!;
            const { sourceKeys, ...rest } = item;
            const changed =
                row.status === 'changed'
                    ? changedProps(row.before, row.after, ['sourceKeys']).map((c) => c.name)
                    : [];
            return {
                ...rowBase(row, sourceKeys ? { sourceKeys } : undefined, filePathOf(unit)),
                ...(changed.length ? { changedProperties: changed } : {}),
                className: json.name,
                unitType: json.unitType as 'class' | 'trigger',
                ...rest,
                ...isTest,
            };
        });
    });
};

// ---------------------------------------------------------------------------
// apex.dataAccess
// ---------------------------------------------------------------------------

type AccessItem = Omit<
    ApexDataAccessRow,
    'status' | 'filePath' | 'changedProperties' | 'className' | 'unitType'
> & {
    key: string;
};

/** 単位のクエリ・DML (依存関係の参照で、クエリが読む項目と、同じメソッドで代入する項目を足す) */
const accessItemsOf = (unit: Unit): AccessItem[] => {
    const info = analyzeApexUnit(unit.result);
    const references = getApexDependencies(unit.result).references;
    // クエリの位置 → 読む項目 (クエリの位置は参照の expression)
    const fieldsByQuery = new Map<string, Set<string>>();
    // メンバー → 代入する項目 (Account.Name)
    const writesByMember = new Map<string, Set<string>>();
    for (const ref of references) {
        if (ref.kind === 'reads' && ref.refType === 'field' && ref.from.expression) {
            const key = ref.from.expression.sourceKey;
            if (!fieldsByQuery.has(key)) fieldsByQuery.set(key, new Set());
            fieldsByQuery.get(key)!.add(ref.target);
        }
        if (ref.kind === 'writes' && ref.refType === 'apexTypeMember') {
            const key = ref.from.member ?? '';
            if (!writesByMember.has(key)) writesByMember.set(key, new Set());
            writesByMember.get(key)!.add(ref.target);
        }
    }
    const items: AccessItem[] = [];
    const counts = new Map<string, number>();
    const keyOf = (base: string) => {
        const n = (counts.get(base) ?? 0) + 1;
        counts.set(base, n);
        return n === 1 ? base : `${base}#${n}`;
    };
    const common = (context: {
        member?: string | undefined;
        loopDepth: number;
        isTest: boolean;
    }) => ({
        ...(context.member ? { member: context.member } : {}),
        inLoop: context.loopDepth > 0,
        inTest: context.isTest,
    });
    for (const query of info.queries) {
        const operation =
            query.language === 'soql'
                ? 'select'
                : query.language === 'sosl'
                  ? 'search'
                  : 'dynamicQuery';
        const fields = [...(fieldsByQuery.get(query.sourceKeys.sourceKey) ?? [])].sort();
        const objects = query.objects.length ? query.objects : [undefined];
        for (const object of objects) {
            items.push({
                key: keyOf(`${query.context.member ?? ''}|${operation}|${object ?? ''}`),
                sourceKeys: query.sourceKeys,
                ...common(query.context),
                operation,
                ...(object ? { object } : {}),
                fields: object ? fields.filter((f) => f.startsWith(`${object}.`)) : [],
                via: query.language,
            });
        }
    }
    for (const dml of info.dml) {
        const writes = dml.object
            ? [...(writesByMember.get(dml.context.member ?? '') ?? [])]
                  .filter((f) => f.startsWith(`${dml.object}.`))
                  .sort()
            : [];
        items.push({
            key: keyOf(`${dml.context.member ?? ''}|${dml.operation}|${dml.object ?? ''}`),
            sourceKeys: dml.sourceKeys,
            ...common(dml.context),
            operation: dml.operation,
            ...(dml.object ? { object: dml.object } : {}),
            fields: writes,
            via: dml.via,
            ...(dml.accessLevel ? { accessLevel: dml.accessLevel } : {}),
            ...(dml.allOrNone !== undefined ? { allOrNone: dml.allOrNone } : {}),
        });
    }
    return items;
};

/**
 * apex.dataAccess: どこで (クラス・メソッド)、どのオブジェクト・項目を読み書きするか (SOQL・SOSL・DML)。
 * ループの中か、テストの中かも出す。objects でオブジェクトに絞る
 */
export const getApexDataAccess = (
    input: SnapshotInput,
    filter: ApexFilter & { objects?: string[]; includeTests?: boolean } = {},
): ApexDataAccessRow[] => {
    const hasBefore = input.before !== undefined;
    return compareUnits(input, filter, ['class', 'trigger', 'anonymous']).flatMap((unit) => {
        const json = (unit.after ?? unit.before)!.json;
        return compareRows<AccessItem>(
            unit,
            hasBefore,
            accessItemsOf,
            (item) => item.key,
            (b, a) => isSameValue(b.fields, a.fields) && b.inLoop === a.inLoop && b.via === a.via,
        )
            .map((row): ApexDataAccessRow => {
                const { key: _key, sourceKeys, ...item } = (row.after ?? row.before)!;
                const changed =
                    row.status === 'changed'
                        ? changedProps(row.before, row.after, ['sourceKeys', 'key']).map(
                              (c) => c.name,
                          )
                        : [];
                return {
                    ...rowBase(row, sourceKeys ? { sourceKeys } : undefined, filePathOf(unit)),
                    ...(changed.length ? { changedProperties: changed } : {}),
                    className: json.name,
                    unitType: json.unitType as ApexDataAccessRow['unitType'],
                    ...item,
                };
            })
            .filter(
                (row) =>
                    (!filter.objects ||
                        (row.object !== undefined && filter.objects.includes(row.object))) &&
                    (filter.includeTests !== false || !row.inTest),
            );
    });
};
