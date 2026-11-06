import type { ApexUnitParseResult } from '../../parser/Apex/unit';
import type { LwcBundleParseResult } from '../../parser/Lwc/parser';
import type { ConvertKeys } from '../../types';
import type { ObjectInfo } from './analysis';
import { walkJsonNodes } from './labelAnalysis';

// フォルダ単位のメタデータ (権限・ラベル・Flow・画面) の解析で共通の、ほかのメタデータへの参照の確かめ方。
// 方針: docs/metadata-implementation.md 10 章 (種類をまたぐ突き合わせは保存する JSON に入れず、解析で行う)。
// リポジトリにあるはずのもの (カスタムのオブジェクト・項目など) だけを確かめ、標準のものは「ない」と言わない (LWC の解析と同じ)

/** 突き合わせに使う、リポジトリの解析結果。渡したものだけを確かめる */
export type MetadataContext = {
    /** オブジェクト (MetadataParser の解析結果を analyzeObject したもの) */
    objects?: ObjectInfo[];
    /** Apex クラスの名前 */
    apexClasses?: string[];
    /** @InvocableMethod を持つ Apex クラスの名前 (Flow の Apex アクションで呼べるもの。apexContextOf で作る) */
    invocableApexClasses?: string[];
    /** Flow の名前 */
    flows?: string[];
    /** LWC のバンドルの名前 (c 名前空間) */
    lwcBundles?: string[];
    /** LWC のバンドルの名前 → js-meta.xml の isExposed・targets・targetConfigs の property (lwcContextOf で作る) */
    lwcMeta?: Record<string, LwcMetaInfo>;
    /** レイアウトの名前 (<オブジェクト>-<名前>) */
    layouts?: string[];
    /** Lightning ページの名前 */
    flexiPages?: string[];
    /** 権限セットの名前 */
    permissionSets?: string[];
    /** ミュート権限セットの名前 */
    mutingPermissionSets?: string[];
    /** カスタム表示ラベルの名前 */
    customLabels?: string[];
};

export type MetadataFindingSeverity = 'error' | 'warning' | 'info';

/** 突き合わせ・確かめで見つかったこと */
export type MetadataFinding<C extends string = string> = {
    code: C;
    /** error: デプロイで弾かれるもの / warning: 参照先がないなど (誤検出がありうる) / info: レビューで目立たせるもの */
    severity: MetadataFindingSeverity;
    /** 対象 (Invoice__c.Amount__c / AccountService など) */
    target: string;
    message: string;
    /** ファイルのパス (ソース位置の filePath) */
    filePath?: string;
    /** 見つけた行の sourceKeys */
    sourceKeys?: ConvertKeys;
};

/** LWC の js-meta.xml から取り出したもの */
export type LwcMetaInfo = {
    isExposed: boolean;
    targets: string[];
    /** targetConfigs の property の名前 (target ごと) */
    properties: Record<string, string[]>;
};

/** LWC の解析結果から、MetadataContext の lwcBundles・lwcMeta を作る */
export const lwcContextOf = (
    bundles: LwcBundleParseResult[],
): Pick<MetadataContext, 'lwcBundles' | 'lwcMeta'> => {
    const readable = bundles.flatMap((bundle) =>
        bundle.dataType === 'lwcBundle' ? [bundle.result.base] : [],
    );
    return {
        lwcBundles: readable.map((bundle) => bundle.name),
        lwcMeta: Object.fromEntries(
            readable.map((bundle) => {
                const meta = bundle.meta && bundle.meta.kind !== 'error' ? bundle.meta : undefined;
                const properties: Record<string, string[]> = {};
                for (const config of meta?.targetConfigs ?? []) {
                    for (const target of config.targets) {
                        properties[target] = [
                            ...(properties[target] ?? []),
                            ...(config.properties ?? []).map((property) => property.name),
                        ];
                    }
                }
                return [
                    bundle.name,
                    {
                        isExposed: meta?.isExposed === true,
                        targets: meta?.targets ?? [],
                        properties,
                    },
                ];
            }),
        ),
    };
};

/** カスタムのオブジェクト・項目 (リポジトリにメタデータがあるはずのもの) の API 名か */
export const isCustomName = (apiName: string): boolean => /__(c|mdt|e|b|x)$/i.test(apiName);

/** 名前の大文字・小文字を区別しない集合 (渡されていなければ undefined = 確かめない) */
const nameSet = (names: string[] | undefined) =>
    names ? new Set(names.map((name) => name.toLowerCase())) : undefined;

export type ReferenceProblem = { code: string; target: string; message: string };

/** 参照を確かめる関数の集まり。問題がなければ undefined */
export const makeReferenceChecker = (context: MetadataContext) => {
    const objects = context.objects
        ? new Map(context.objects.map((object) => [object.apiName.toLowerCase(), object]))
        : undefined;
    const sets = {
        apexClass: nameSet(context.apexClasses),
        flow: nameSet(context.flows),
        lwc: nameSet(context.lwcBundles),
        layout: nameSet(context.layouts),
        flexiPage: nameSet(context.flexiPages),
        permissionSet: nameSet(context.permissionSets),
        mutingPermissionSet: nameSet(context.mutingPermissionSets),
        customLabel: nameSet(context.customLabels),
    };

    const object = (name: string): ReferenceProblem | undefined => {
        if (!objects || objects.has(name.toLowerCase()) || !isCustomName(name)) return undefined;
        return {
            code: 'UNKNOWN_OBJECT',
            target: name,
            message: `オブジェクト ${name} がメタデータにない`,
        };
    };

    /** <オブジェクト>.<項目>。オブジェクトがリポジトリにないときは、項目を確かめられないのでオブジェクトだけを確かめる */
    const field = (value: string): ReferenceProblem | undefined => {
        const [objectName, fieldName] = value.split('.');
        if (!objects || !objectName || !fieldName) return undefined;
        const info = objects.get(objectName.toLowerCase());
        if (!info) return object(objectName);
        if (!isCustomName(fieldName) && !isCustomName(objectName)) return undefined;
        if (info.fields.some((f) => f.apiName.toLowerCase() === fieldName.toLowerCase())) {
            return undefined;
        }
        return {
            code: 'UNKNOWN_FIELD',
            target: value,
            message: `項目 ${value} がメタデータにない`,
        };
    };

    /** 名前の集合で確かめる (code は UNKNOWN_<種類>) */
    const named =
        (set: Set<string> | undefined, code: string, label: string) =>
        (name: string): ReferenceProblem | undefined =>
            !set || set.has(name.toLowerCase())
                ? undefined
                : { code, target: name, message: `${label} ${name} がリポジトリにない` };

    return {
        object,
        field,
        apexClass: named(sets.apexClass, 'UNKNOWN_APEX_CLASS', 'Apex クラス'),
        flow: named(sets.flow, 'UNKNOWN_FLOW', 'Flow'),
        lwc: named(sets.lwc, 'UNKNOWN_LWC', 'LWC'),
        layout: named(sets.layout, 'UNKNOWN_LAYOUT', 'レイアウト'),
        flexiPage: named(sets.flexiPage, 'UNKNOWN_FLEXIPAGE', 'Lightning ページ'),
        permissionSet: named(sets.permissionSet, 'UNKNOWN_PERMISSION_SET', '権限セット'),
        mutingPermissionSet: named(
            sets.mutingPermissionSet,
            'UNKNOWN_MUTING_PERMISSION_SET',
            'ミュート権限セット',
        ),
        customLabel: named(sets.customLabel, 'UNKNOWN_CUSTOM_LABEL', 'カスタム表示ラベル'),
    };
};

export type ReferenceChecker = ReturnType<typeof makeReferenceChecker>;

/** Apex のトリガー (対象オブジェクトとイベント) */
export type ApexTriggerInfo = {
    name: string;
    object: string;
    /** before insert / after update など */
    events: string[];
    /** -meta.xml の status (Active / Inactive)。-meta.xml がなければ持たない */
    status?: string;
    unit: string;
};

const classNamesOf = (units: ApexUnitParseResult[], unitType: string) =>
    units.filter((unit) => unit.result.base.unitType === unitType);

/** Apex の解析結果から、MetadataContext の apexClasses・invocableApexClasses を作る */
export const apexContextOf = (
    units: ApexUnitParseResult[],
): Pick<MetadataContext, 'apexClasses' | 'invocableApexClasses'> => {
    const classes = classNamesOf(units, 'class');
    return {
        apexClasses: classes.map((unit) => unit.result.base.name),
        invocableApexClasses: classes
            .filter((unit) => {
                let invocable = false;
                walkJsonNodes(unit.result.base.source, (node) => {
                    if (
                        node.kind === 'annotation' &&
                        /^InvocableMethod$/i.test(String(node.name))
                    ) {
                        invocable = true;
                    }
                });
                return invocable;
            })
            .map((unit) => unit.result.base.name),
    };
};

/** Apex のトリガーの一覧 (対象オブジェクトが読めないものは除く) */
export const getApexTriggers = (units: ApexUnitParseResult[]): ApexTriggerInfo[] =>
    classNamesOf(units, 'trigger').flatMap((unit) => {
        const content = unit.result.base.source?.content as
            | { object?: unknown; case?: { kind?: string; actionType?: string; timing?: string }[] }
            | undefined;
        if (!content || typeof content.object !== 'string') return [];
        const meta = unit.result.base.meta?.meta as { status?: string } | undefined;
        return [
            {
                name: unit.result.base.name,
                object: content.object,
                events: (content.case ?? [])
                    .filter((c) => c.kind === 'triggerCase')
                    .map(
                        (c) =>
                            `${String(c.timing).toLowerCase()} ${String(c.actionType).toLowerCase()}`,
                    ),
                ...(meta?.status !== undefined ? { status: meta.status } : {}),
                unit: unit.result.id,
            },
        ];
    });
