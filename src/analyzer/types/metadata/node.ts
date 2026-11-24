// Metadata の JSON のすべてのノードの共用体と、kind から型を引く表 (docs/plan.md 5.1)。
// 走査 (processor/commons/node.ts の walk) で kind ごとに型を絞るのに使う。
// metadata の JSON の型を足したら、ここにも足す (test/converter/json-node-union.test.ts が漏れを見つける)
import type * as J from './index';

/** Metadata の JSON のすべてのノード */
export type MetadataNodeJson =
    | J.ApexComponentJson
    | J.ApexPageJson
    | J.ApprovalProcessJson
    | J.AssignmentRulesJson
    | J.AuraBundleJson
    | J.AuraDefinitionBundleJson
    | J.AuraJavascriptJson
    | J.AutoResponseRulesJson
    | J.BusinessProcessJson
    | J.CaseValueJson
    | J.CompactLayoutJson
    | J.CriterionJson
    | J.CriterionValueJson
    | J.CspTrustedSiteJson
    | J.CustomApplicationJson
    | J.CustomFieldJson
    | J.CustomFieldTranslationJson
    | J.CustomLabelJson
    | J.CustomLabelsJson
    | J.CustomMetadataRecordJson
    | J.CustomNotificationTypeJson
    | J.CustomObjectJson
    | J.CustomObjectTranslationJson
    | J.CustomPermissionJson
    | J.CustomTabJson
    | J.DashboardJson
    | J.DuplicateRuleJson
    | J.EmailTemplateJson
    | J.EscalationRulesJson
    | J.ExternalCredentialJson
    | J.ExternalDataSourceJson
    | J.FieldSetItemJson
    | J.FieldSetJson
    | J.FieldSetTranslationJson
    | J.FilterLogicJson
    | J.FlexiPageComponentJson
    | J.FlexiPageFieldJson
    | J.FlexiPageJson
    | J.FlexiPageRegionJson
    | J.FlexiPageVisibilityRule
    | J.FlowEdge
    | J.FlowElementJson
    | J.FlowJson
    | J.FlowResourceJson
    | J.FlowRuleJson
    | J.FlowScreenFieldJson
    | J.FlowStartJson
    | J.FxBinaryJson
    | J.FxBooleanJson
    | J.FxCallJson
    | J.FxConditionalJson
    | J.FxJson
    | J.FxMergeJson
    | J.FxNameJson
    | J.FxNullJson
    | J.FxNumberJson
    | J.FxParenJson
    | J.FxStringJson
    | J.FxTemplateJson
    | J.FxUnaryJson
    | J.GlobalValueJson
    | J.GlobalValueSetJson
    | J.GroupJson
    | J.LayoutActionJson
    | J.LayoutItemJson
    | J.LayoutItemPosition
    | J.LayoutJson
    | J.LayoutRelatedListJson
    | J.LayoutSectionJson
    | J.LayoutSectionTranslationJson
    | J.LayoutTranslationJson
    | J.LightningMessageChannelJson
    | J.ListViewJson
    | J.LoginHoursJson
    | J.LookupFilterJson
    | J.LookupFilterTranslationJson
    | J.MarkupAttributeJson
    | J.MarkupElementJson
    | J.MarkupNodeJson
    | J.MarkupTextJson
    | J.MatchingRulesJson
    | J.MutingPermissionSetJson
    | J.NameFieldJson
    | J.NamedCredentialJson
    | J.ObjectActionOverrideJson
    | J.PathAssistantJson
    | J.PermissionSetGroupJson
    | J.PermissionSetJson
    | J.PermissionsJson
    | J.PicklistValueJson
    | J.PicklistValueSelectionJson
    | J.PicklistValueSettingJson
    | J.PicklistValueTranslationJson
    | J.PlatformEventChannelJson
    | J.PlatformEventChannelMemberJson
    | J.PlatformEventSubscriberConfigJson
    | J.ProfileJson
    | J.QueueJson
    | J.QuickActionJson
    | J.QuickActionTranslationJson
    | J.RecordTypeJson
    | J.RecordTypePicklistJson
    | J.RecordTypeTranslationJson
    | J.RemoteSiteSettingJson
    | J.ReportJson
    | J.ReportTypeJson
    | J.RoleJson
    | J.SearchLayoutsJson
    | J.SettingsJson
    | J.SharingReasonJson
    | J.SharingReasonTranslationJson
    | J.SharingRulesJson
    | J.StandardFieldTranslationJson
    | J.StandardValueSetJson
    | J.StaticResourceJson
    | J.TranslationsJson
    | J.ValidationRuleJson
    | J.ValidationRuleTranslationJson
    | J.ValueSetJson
    | J.VisualforceMarkupJson
    | J.WebLinkJson
    | J.WebLinkTranslationJson
    | J.WorkflowJson;

/** Metadata の JSON のノードの kind */
export type MetadataNodeKind = MetadataNodeJson['kind'];

/** kind が K の Metadata のノード */
export type MetadataNodeOf<K extends MetadataNodeKind> = Extract<MetadataNodeJson, { kind: K }>;
