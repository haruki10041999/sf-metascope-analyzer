import type { FlexiPageParseResult, LayoutParseResult } from '../../parser/Metadata/page';
import type { ConvertKeys, FlexiPageJson, LayoutJson } from '../../types';
import {
    MetadataContext,
    MetadataFinding,
    ReferenceProblem,
    makeReferenceChecker,
} from './references';

// 画面 (ページレイアウト・Lightning ページ) の解析。方針: docs/metadata-a-plan.md 7.2・8.2 章

// ---------------------------------------------------------------------------
// ページレイアウト
// ---------------------------------------------------------------------------

export type LayoutInfo = {
    name: string;
    objectApiName: string;
    /** レイアウトに置いた項目 (表示順) */
    fields: string[];
    sectionCount: number;
    filePath: string;
    sourceKeys: ConvertKeys;
};

export type LayoutAnalysisCode =
    | 'UNKNOWN_OBJECT'
    | 'UNKNOWN_FIELD'
    | 'FIELD_NOT_ON_LAYOUT'
    | 'REQUIRED_FIELD_NOT_ON_LAYOUT'
    | 'REQUIRED_FIELD_READONLY'
    | 'LAYOUT_ONLY_REQUIRED';

export type LayoutFinding = MetadataFinding<LayoutAnalysisCode> & { layout: string };

export type LayoutAnalysis = {
    layouts: LayoutInfo[];
    /** <オブジェクト>.<項目> → 置いているレイアウト */
    layoutsByField: Record<string, string[]>;
    findings: LayoutFinding[];
};

const addProblem = <F extends MetadataFinding>(
    findings: F[],
    problem: ReferenceProblem | undefined,
    base: Omit<F, 'code' | 'severity' | 'target' | 'message'>,
) => {
    if (problem) {
        findings.push({
            ...base,
            code: problem.code,
            severity: 'warning',
            target: problem.target,
            message: problem.message,
        } as F);
    }
};

/**
 * ページレイアウトの解析。context.objects を渡すと、項目がオブジェクトにあるか、
 * どのレイアウトにもないカスタム項目 (レイアウトのあるオブジェクトのみ) も確かめる
 */
export const analyzeLayouts = (
    results: LayoutParseResult[],
    context: MetadataContext = {},
): LayoutAnalysis => {
    const check = makeReferenceChecker(context);
    const objects = new Map(
        (context.objects ?? []).map((object) => [object.apiName.toLowerCase(), object]),
    );
    const findings: LayoutFinding[] = [];
    const layouts: LayoutInfo[] = [];
    const layoutsByField: Record<string, string[]> = {};

    for (const result of results) {
        if (result.dataType !== 'layout') continue;
        const json = result.result.base as LayoutJson;
        const base = { layout: json.name, filePath: result.filePath };
        const fields = (json.items ?? []).flatMap((item) => (item.field ? [item.field] : []));
        layouts.push({
            name: json.name,
            objectApiName: json.objectApiName,
            fields,
            sectionCount: json.sections?.length ?? 0,
            filePath: result.filePath,
            sourceKeys: json.sourceKeys,
        });
        // オブジェクトがないときはレイアウトに 1 回だけ出し、項目は確かめない (項目ごとに同じ指摘が並ぶため)
        const unknownObject = check.object(json.objectApiName);
        addProblem(findings, unknownObject, { ...base, sourceKeys: json.sourceKeys });
        for (const item of json.items ?? []) {
            if (!item.field) continue;
            const field = `${json.objectApiName}.${item.field}`;
            layoutsByField[field] = [...(layoutsByField[field] ?? []), json.name];
            if (!unknownObject) {
                addProblem(findings, check.field(field), { ...base, sourceKeys: item.sourceKeys });
            }
        }

        // 項目の必須とレイアウトの behavior の食い違い (メタデータのある項目だけ)
        const object = objects.get(json.objectApiName.toLowerCase());
        if (!object) continue;
        const items = new Map(
            (json.items ?? []).flatMap((item) =>
                item.field ? [[item.field.toLowerCase(), item] as const] : [],
            ),
        );
        for (const field of object.fields) {
            if (field.origin !== 'metadata') continue;
            const target = `${object.apiName}.${field.apiName}`;
            const item = items.get(field.apiName.toLowerCase());
            const at = {
                ...base,
                target,
                ...(item ? { sourceKeys: item.sourceKeys } : { sourceKeys: json.sourceKeys }),
            };
            if (field.required && !item) {
                findings.push({
                    ...at,
                    code: 'REQUIRED_FIELD_NOT_ON_LAYOUT',
                    severity: 'warning',
                    message: `必須の項目 ${target} がレイアウト ${json.name} にない`,
                });
            } else if (field.required && item?.behavior === 'Readonly') {
                findings.push({
                    ...at,
                    code: 'REQUIRED_FIELD_READONLY',
                    severity: 'warning',
                    message: `必須の項目 ${target} がレイアウト ${json.name} で参照のみ`,
                });
            } else if (!field.required && item?.behavior === 'Required') {
                findings.push({
                    ...at,
                    code: 'LAYOUT_ONLY_REQUIRED',
                    severity: 'info',
                    message: `項目 ${target} はレイアウト ${json.name} でだけ必須 (API・データの取り込みでは必須にならない)`,
                });
            }
        }
    }

    // どのレイアウトにもないカスタム項目 (レイアウトがリポジトリにあるオブジェクトだけ)
    const objectsWithLayouts = new Set(layouts.map((layout) => layout.objectApiName.toLowerCase()));
    for (const object of context.objects ?? []) {
        if (!objectsWithLayouts.has(object.apiName.toLowerCase())) continue;
        object.fields
            // 必須の項目は REQUIRED_FIELD_NOT_ON_LAYOUT でレイアウトごとに出す
            .filter(
                (field) =>
                    field.origin === 'metadata' && /__c$/i.test(field.apiName) && !field.required,
            )
            .filter((field) => !layoutsByField[`${object.apiName}.${field.apiName}`])
            .forEach((field) =>
                findings.push({
                    code: 'FIELD_NOT_ON_LAYOUT',
                    severity: 'info',
                    layout: '',
                    target: `${object.apiName}.${field.apiName}`,
                    message: `項目 ${object.apiName}.${field.apiName} はどのレイアウトにもない`,
                    ...(field.sourceKeys ? { sourceKeys: field.sourceKeys } : {}),
                }),
            );
    }

    return { layouts, layoutsByField, findings };
};

// ---------------------------------------------------------------------------
// Lightning ページ
// ---------------------------------------------------------------------------

/** ページの種類 → LWC の js-meta.xml の target */
export const FLEXI_PAGE_TARGETS: Record<string, string> = {
    RecordPage: 'lightning__RecordPage',
    AppPage: 'lightning__AppPage',
    HomePage: 'lightning__HomePage',
    UtilityBar: 'lightning__UtilityBar',
    CommAppPage: 'lightningCommunity__Page',
    CommObjectPage: 'lightningCommunity__Page',
    CommRecordPage: 'lightningCommunity__Page',
    CommRelatedListPage: 'lightningCommunity__Page',
    CommThemeLayoutPage: 'lightningCommunity__Page',
};

/** LWC を置いているところ */
export type LwcPlacement = {
    /** バンドルの名前 */
    lwc: string;
    flexiPage: string;
    pageType?: string;
    sobjectType?: string;
    region: string;
    identifier: string;
    /** ページで渡しているプロパティの名前 */
    properties: string[];
};

export type FlexiPageInfo = {
    name: string;
    label?: string;
    pageType?: string;
    sobjectType?: string;
    template?: string;
    components: string[];
    fields: string[];
    filePath: string;
    sourceKeys: ConvertKeys;
};

export type FlexiPageAnalysisCode =
    | 'UNKNOWN_OBJECT'
    | 'UNKNOWN_FIELD'
    | 'UNKNOWN_LWC'
    | 'LWC_NOT_EXPOSED'
    | 'LWC_TARGET_MISMATCH'
    | 'UNKNOWN_LWC_PROPERTY';

export type FlexiPageFinding = MetadataFinding<FlexiPageAnalysisCode> & { flexiPage: string };

export type FlexiPageAnalysis = {
    pages: FlexiPageInfo[];
    placements: LwcPlacement[];
    findings: FlexiPageFinding[];
};

const RECORD_FIELD = /\{!Record\.(\w+)\}/g;

/**
 * Lightning ページの解析。context.lwcBundles / lwcMeta (lwcContextOf で作る) を渡すと、
 * 置いている LWC があるか・公開されているか・ページの種類の target を持つか・渡すプロパティが targetConfigs にあるかも確かめる
 */
export const analyzeFlexiPages = (
    results: FlexiPageParseResult[],
    context: MetadataContext = {},
): FlexiPageAnalysis => {
    const check = makeReferenceChecker(context);
    const findings: FlexiPageFinding[] = [];
    const pages: FlexiPageInfo[] = [];
    const placements: LwcPlacement[] = [];

    for (const result of results) {
        if (result.dataType !== 'flexiPage') continue;
        const json = result.result.base as FlexiPageJson;
        const base = { flexiPage: json.name, filePath: result.filePath };
        const add = (
            code: FlexiPageAnalysisCode,
            target: string,
            message: string,
            sourceKeys: ConvertKeys,
        ) => findings.push({ ...base, code, severity: 'warning', target, message, sourceKeys });
        const object = json.sobjectType;
        const target = json.type ? FLEXI_PAGE_TARGETS[json.type] : undefined;

        pages.push({
            name: json.name,
            ...(json.masterLabel !== undefined ? { label: json.masterLabel } : {}),
            ...(json.type !== undefined ? { pageType: json.type } : {}),
            ...(object !== undefined ? { sobjectType: object } : {}),
            ...(json.template !== undefined ? { template: json.template } : {}),
            components: (json.components ?? []).map((component) => component.componentName),
            fields: (json.fields ?? []).map((field) => field.fieldItem),
            filePath: result.filePath,
            sourceKeys: json.sourceKeys,
        });
        if (object) {
            addProblem(findings, check.object(object), { ...base, sourceKeys: json.sourceKeys });
        }

        /** Record.<項目> と表示条件の {!Record.<項目>} を、ページのオブジェクトの項目として確かめる */
        const checkRecordFields = (texts: string[], sourceKeys: ConvertKeys) => {
            if (!object) return;
            texts.forEach((text) => {
                const direct = text.match(/^Record\.(\w+)$/);
                const fields = direct
                    ? [direct[1]!]
                    : [...text.matchAll(RECORD_FIELD)].map((m) => m[1]!);
                fields.forEach((field) =>
                    addProblem(findings, check.field(`${object}.${field}`), {
                        ...base,
                        sourceKeys,
                    }),
                );
            });
        };

        for (const component of json.components ?? []) {
            const ruleTexts = (component.visibilityRule?.criteria ?? []).flatMap((c) => [
                c.leftValue ?? '',
                c.rightValue ?? '',
            ]);
            checkRecordFields(ruleTexts, component.sourceKeys);

            const [namespace, name] = component.componentName.split(':');
            if (namespace !== 'c' || !name) continue;
            const properties = Object.keys(component.properties ?? {});
            placements.push({
                lwc: name,
                flexiPage: json.name,
                ...(json.type !== undefined ? { pageType: json.type } : {}),
                ...(object !== undefined ? { sobjectType: object } : {}),
                region: component.region,
                identifier: component.identifier,
                properties,
            });
            const unknown = check.lwc(name);
            if (unknown) {
                add('UNKNOWN_LWC', name, unknown.message, component.sourceKeys);
                continue;
            }
            const meta = context.lwcMeta?.[name];
            if (!meta) continue;
            if (!meta.isExposed) {
                add(
                    'LWC_NOT_EXPOSED',
                    name,
                    `LWC ${name} は isExposed でない`,
                    component.sourceKeys,
                );
            }
            if (target && !meta.targets.includes(target)) {
                add(
                    'LWC_TARGET_MISMATCH',
                    name,
                    `LWC ${name} の targets に ${target} がない`,
                    component.sourceKeys,
                );
            }
            const declared = target ? meta.properties[target] : undefined;
            if (declared) {
                properties
                    .filter((property) => !declared.includes(property))
                    .forEach((property) =>
                        add(
                            'UNKNOWN_LWC_PROPERTY',
                            `${name}.${property}`,
                            `LWC ${name} の targetConfigs (${target}) にプロパティ ${property} がない`,
                            component.sourceKeys,
                        ),
                    );
            }
        }
        for (const field of json.fields ?? []) {
            checkRecordFields(
                [
                    field.fieldItem,
                    ...(field.visibilityRule?.criteria ?? []).flatMap((c) => [
                        c.leftValue ?? '',
                        c.rightValue ?? '',
                    ]),
                ],
                field.sourceKeys,
            );
        }
    }

    return { pages, placements, findings };
};
