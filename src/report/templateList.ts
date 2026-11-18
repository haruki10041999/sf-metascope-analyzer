import {
    analyticsOverviewTemplate,
    automationOverviewTemplate,
    featureOverviewTemplate,
    integrationOverviewTemplate,
    securityOverviewTemplate,
    uiOverviewTemplate,
} from './domainTemplates';
import type { ReportDocument } from './document';
import {
    apexSpecificationTemplate,
    impactAnalysisTemplate,
    lwcOverviewTemplate,
    metadataInventoryTemplate,
    objectDefinitionTemplate,
    permissionOverviewTemplate,
    releaseReviewTemplate,
    systemOverviewTemplate,
    translationOverviewTemplate,
} from './templates';

// 雛形の一覧 (名前 → 説明と文書)。CLI の report new・report templates が使う。
// 名前は MCP のプロンプトと同じ。雛形は構成とデータの種類だけを決め、個々のデータは引数に取らない

export type TemplateEntry = { description: string; document: () => ReportDocument };

export const REPORT_TEMPLATES: Record<string, TemplateEntry> = {
    system_overview: { description: 'システムの構成', document: systemOverviewTemplate },
    object_definition: {
        description: 'オブジェクト定義書 (一覧・ER 図、オブジェクトごとに 1 ページ)',
        document: objectDefinitionTemplate,
    },
    apex_specification: {
        description: 'Apex の仕様書 (クラス・トリガーごとに 1 ページ、メソッドごとの処理フロー)',
        document: apexSpecificationTemplate,
    },
    lwc_overview: {
        description: 'LWC のコンポーネント (コンポーネントごとに 1 ページ)',
        document: lwcOverviewTemplate,
    },
    translation_overview: { description: '翻訳の状況', document: translationOverviewTemplate },
    metadata_inventory: {
        description: 'メタデータの棚卸し',
        document: () => metadataInventoryTemplate(),
    },
    automation_overview: { description: '自動化', document: automationOverviewTemplate },
    security_overview: { description: 'セキュリティと共有', document: securityOverviewTemplate },
    ui_overview: { description: '画面', document: uiOverviewTemplate },
    integration_overview: { description: '連携', document: integrationOverviewTemplate },
    analytics_overview: { description: '分析', document: analyticsOverviewTemplate },
    feature_overview: {
        description: '機能のまとまり (カスタムオブジェクトごとに 1 ページ)',
        document: featureOverviewTemplate,
    },
    permission_overview: { description: '権限の一覧', document: permissionOverviewTemplate },
    release_review: { description: 'リリース前のレビュー (差分)', document: releaseReviewTemplate },
    impact_analysis: { description: '変更の影響の調査 (差分)', document: impactAnalysisTemplate },
};
