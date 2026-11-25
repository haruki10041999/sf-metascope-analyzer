import type { ApexUnitParseResult } from '../../parser/Apex/unit';
import type { LwcBundleParseResult } from '../../parser/Lwc/parser';
import type { ConvertKeys } from '../../types';
import type { ObjectInfo } from './analysis';
import { walkApexParseResult } from '../Apex/walker';

// フォルダ単位のメタデータ (権限・Flow・画面) の解析で共通に使う、ほかの種類の情報と指摘の形。
// 方針: docs/metadata-implementation.md 10 章 (種類をまたぐ突き合わせは保存する JSON に入れず、解析で行う)。
// 参照先がリポジトリにあるか (UNKNOWN_OBJECT・UNKNOWN_FIELD など) は、依存関係のグラフの指摘
// (processor/dependency/graph.ts の referenceFindingsOf。参照している単位 + 行の sourceKeys) に一本化した
// (docs/plan.md 10 章 P3)。種類ごとの解析は、その種類の中の決まり (Apex アクションの @InvocableMethod・
// LWC の公開と target・必須項目とレイアウトなど) だけを、ここの情報で確かめる

/** 種類の中の決まりの確かめに使う、ほかの種類の解析結果。渡したものだけを使う */
export type MetadataContext = {
    /** オブジェクト (MetadataParser の解析結果を analyzeObject したもの。レイアウトの必須項目の確かめ) */
    objects?: ObjectInfo[];
    /** Apex クラスの名前 (リポジトリにあるクラスだけ、Apex アクションの @InvocableMethod を確かめる) */
    apexClasses?: string[];
    /** @InvocableMethod を持つ Apex クラスの名前 (Flow の Apex アクションで呼べるもの。apexContextOf で作る) */
    invocableApexClasses?: string[];
    /** LWC のバンドルの名前 → js-meta.xml の isExposed・targets・targetConfigs の property (lwcContextOf で作る) */
    lwcMeta?: Record<string, LwcMetaInfo>;
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

/** LWC の解析結果から、MetadataContext の lwcMeta を作る */
export const lwcContextOf = (bundles: LwcBundleParseResult[]): Pick<MetadataContext, 'lwcMeta'> => {
    const readable = bundles.flatMap((bundle) =>
        bundle.dataType === 'lwcBundle' ? [bundle.result.base] : [],
    );
    return {
        lwcMeta: Object.fromEntries(
            readable.map((bundle) => {
                const meta = bundle.meta ?? undefined;
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

/** 種類の中の決まりの確かめで見つかった問題 */
export type ReferenceProblem = { code: string; target: string; message: string };

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
                // Apex の共通の走査 (docs/json-redesign-plan.md の段階 A3)
                let invocable = false;
                walkApexParseResult(unit, {
                    annotation: (node) => {
                        if (/^InvocableMethod$/i.test(String(node.name))) invocable = true;
                    },
                });
                return invocable;
            })
            .map((unit) => unit.result.base.name),
    };
};

/** Apex のトリガーの一覧 (対象オブジェクトが読めないものは除く) */
export const getApexTriggers = (units: ApexUnitParseResult[]): ApexTriggerInfo[] =>
    classNamesOf(units, 'trigger').flatMap((unit) => {
        const source = unit.result.base.source;
        // ソースが読めなかった (fileType: 'error') ときは中身を持たない
        const content = (source && source.fileType !== 'error' ? source.content : undefined) as
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
