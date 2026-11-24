# フォルダ単位のメタデータの parse の結果

`run-folders.ts` が出力する。

## before

| id | dataType | 行の件数 | skippedElements | 読めなかったところ |
| --- | --- | --- | --- | --- |
| permissionSet_Broken_Set | error | - | - | permissionsets/Broken_Set.permissionset-meta.xml L6: XML_SYNTAX </objectPermissions> expected but </PermissionSet> found |
| permissionSet_Invoice_Manager | permissionSet | classAccesses: 1<br>customPermissions: 1<br>fieldPermissions: 2<br>objectPermissions: 1<br>recordTypeVisibilities: 1<br>userPermissions: 1<br>tabSettings: 1 | - | - |
| permissionSet_Invoice_Viewer | permissionSet | fieldPermissions: 1<br>objectPermissions: 1 | - | - |
| mutingPermissionSet_Invoice_Team_Muted | mutingPermissionSet | objectPermissions: 1 | - | - |
| profile_Sales | profile | applicationVisibilities: 1<br>classAccesses: 1<br>fieldPermissions: 2<br>objectPermissions: 2<br>userPermissions: 2<br>tabVisibilities: 1<br>layoutAssignments: 2<br>loginIpRanges: 1<br>loginFlows: 1<br>profileActionOverrides: 1<br>categoryGroupVisibilities: 1 | futureSetting | - |
| permissionSetGroup_Invoice_Team | permissionSetGroup | - | - | - |
| customLabels_CustomLabels | customLabels | labels: 3 | - | - |
| flow_Account_Wizard | flow | elements: 1<br>edges: 1 | - | - |
| flow_Invoice_Status_Update | flow | elements: 4<br>resources: 2<br>edges: 5 | - | - |
| layout_Account-Account Layout | layout | sections: 1<br>items: 2 | - | - |
| layout_Invoice__c-Invoice Layout | layout | sections: 2<br>items: 7<br>relatedLists: 1<br>actions: 2 | summaryLayout | - |
| flexiPage_Invoice_Record_Page | flexiPage | regions: 3<br>components: 4<br>fields: 1 | - | - |
| customMetadata_App_Setting.Default | customMetadata | values: 1 | - | - |
| customTab_Invoice__c | customTab | - | - | - |
| customApplication_Invoice_App | customApplication | actionOverrides: 1 | - | - |
| globalValueSet_Invoice_Status | globalValueSet | customValue: 3 | - | - |
| standardValueSet_Industry | standardValueSet | standardValue: 2 | - | - |
| customPermission_Approve_Invoice | customPermission | - | - | - |
| customPermission_View_Invoice | customPermission | - | - | - |
| quickAction_Invoice__c.Approve | quickAction | fieldOverrides: 1 | - | - |
| sharingRules_Invoice__c | sharingRules | sharingCriteriaRules: 1<br>sharingOwnerRules: 1 | - | - |
| apexPage_InvoicePrint | apexPage | - | - | - |
| apexComponent_invoiceHeader | apexComponent | - | - | - |
| aura_invoiceCard | aura | attributes: 2<br>registerEvents: 1<br>handlers: 1<br>body: 1 | - | - |
| staticResource_logo | staticResource | - | - | - |
| emailTemplate_Invoice_Templates.Invoice_Sent | emailTemplate | - | - | - |
| report_Invoice_Reports.Open_Invoices | report | params: 1<br>columns: 3 | - | - |
| dashboard_Invoice_Dashboards.Invoice_Overview | dashboard | - | - | - |
| translations_ja | translations | customLabels: 2<br>customTabs: 1<br>customApplications: 1 | - | - |
| namedCredential_Billing_API | namedCredential | namedCredentialParameters: 1 | - | - |
| remoteSiteSetting_Billing | remoteSiteSetting | - | - | - |
| workflow_Invoice__c | workflow | alerts: 1<br>fieldUpdates: 1<br>rules: 1 | - | - |
| approvalProcess_Invoice__c.Large_Invoice_Approval | approvalProcess | allowedSubmitters: 1<br>approvalStep: 1 | - | - |
| queue_Invoice_Queue | queue | queueSobject: 1 | - | - |
| group_Finance | group | - | - | - |
| role_Sales_Manager | role | - | - | - |
| messageChannel_Invoice_Selected | messageChannel | lightningMessageFields: 1 | - | - |
| externalCredential_Billing_Auth | externalCredential | externalCredentialParameters: 2 | - | - |
| customNotificationType_Invoice_Overdue | customNotificationType | - | - | - |
| reportType_Invoices_with_Lines | reportType | sections: 1 | - | - |
| assignmentRules_Case | assignmentRules | assignmentRule: 1 | - | - |
| autoResponseRules_Case | autoResponseRules | autoResponseRule: 1 | - | - |
| escalationRules_Case | escalationRules | escalationRule: 1 | - | - |
| pathAssistant_Invoice_Path | pathAssistant | pathAssistantSteps: 1 | - | - |
| duplicateRule_Account.Account_Name_Duplicate | duplicateRule | duplicateRuleMatchRules: 1 | - | - |
| matchingRules_Account | matchingRules | matchingRules: 1 | - | - |
| platformEventChannel_Invoice_Changes__chn | platformEventChannel | - | - | - |
| platformEventChannelMember_Invoice_Changes_chn_Invoice_ChangeEvent | platformEventChannelMember | enrichedFields: 1 | - | - |
| platformEventSubscriberConfig_AccountTriggerConfig | platformEventSubscriberConfig | - | - | - |
| cspTrustedSite_Billing_API | cspTrustedSite | - | - | - |
| externalDataSource_Billing_Data | externalDataSource | - | - | - |
| settings_Security | settings | - | - | - |

### 権限 (analyzePermissions)

| 権限 | オブジェクト (CRED / すべて参照・変更) | 項目 (参照・編集) | Apex | ユーザー権限 |
| --- | --- | --- | --- | --- |
| permissionSet:Invoice_Manager | Invoice__c: CRED | Invoice__c.Amount__c: R-<br>Invoice__c.Status__c: RE | AccountService | ApiEnabled |
| permissionSet:Invoice_Viewer | Invoice__c: -R-- | Invoice__c.Amount__c: R- | - | - |
| mutingPermissionSet:Invoice_Team_Muted | Invoice__c: ---D | - | - | - |
| profile:Sales | Account: CRE-<br>Invoice__c: -R-- | Account.Tier__c: R-<br>Invoice__c.Status__c: R- | AccountService | ApiEnabled |
| permissionSetGroup:Invoice_Team (実際の権限) | Invoice__c: CRE- | Invoice__c.Amount__c: R-<br>Invoice__c.Status__c: RE | AccountService | ApiEnabled |

| 重要度 | code | 権限 | 対象 | 内容 |
| --- | --- | --- | --- | --- |
| info | POWERFUL_USER_PERMISSION | permissionSet:Invoice_Manager | ApiEnabled | 強い権限 ApiEnabled を与える |
| warning | UNKNOWN_FLOW | profile:Sales | Login_Check | Flow Login_Check がリポジトリにない |
| info | POWERFUL_USER_PERMISSION | profile:Sales | ApiEnabled | 強い権限 ApiEnabled を与える |

### カスタム表示ラベル (依存関係のグラフ)

| ラベル | 使っている単位 |
| --- | --- |
| AccountListTitle | apexPage:InvoicePrint, aura:invoiceCard, flow:Account_Wizard, lwc:accountList, translations:ja |
| BannerMessage | translations:ja |
| Invoice_Overdue | flow:Invoice_Status_Update |

| code | 対象 | 参照元 |
| --- | --- | --- |

### Flow (analyzeFlows)

| Flow | 種類 | 起動 | 対象 | 状態 | 要素 |
| --- | --- | --- | --- | --- | --- |
| Account_Wizard | Flow | - | - | Draft | 1 |
| Invoice_Status_Update | AutoLaunchedFlow | RecordAfterSave / Update | Invoice__c | Active | 4 |

#### 接続 (図のエッジ)

- **Account_Wizard**: $start → Welcome (connector)
- **Invoice_Status_Update**: $start → Check_Amount (connector), Notify → Set_Status (connector), Notify → Log_Error (faultConnector), Check_Amount → Notify (defaultConnector), Check_Amount → Set_Status (rules[Large].connector)

#### オブジェクトごとの自動化

- Invoice__c: Invoice_Status_Update (RecordAfterSave Update, 順 10)

| 重要度 | code | 対象の単位 | 対象 | 内容 |
| --- | --- | --- | --- | --- |
| warning | LWC_NOT_FLOW_SCREEN | Account_Wizard | accountList | LWC accountList の targets に lightning__FlowScreen がない |
| info | NO_FAULT_PATH | Invoice_Status_Update | Set_Status | 要素 Set_Status に失敗時の経路 (faultConnector) がない |
| warning | APEX_NOT_INVOCABLE | Invoice_Status_Update | AccountService | Apex クラス AccountService に @InvocableMethod がない |

### ページレイアウト (analyzeLayouts)

| レイアウト | オブジェクト | 項目 |
| --- | --- | --- |
| Account-Account Layout | Account | Name, Tier__c |
| Invoice__c-Invoice Layout | Invoice__c | Name, Amount__c, Note__c, Status__c, Due_Date__c, CreatedById, LastModifiedById |

| 重要度 | code | 対象の単位 | 対象 | 内容 |
| --- | --- | --- | --- | --- |
| info | FIELD_NOT_ON_LAYOUT | - | Invoice__c.Account__c | 項目 Invoice__c.Account__c はどのレイアウトにもない |
| info | FIELD_NOT_ON_LAYOUT | - | Invoice__c.Is_Overdue__c | 項目 Invoice__c.Is_Overdue__c はどのレイアウトにもない |

### Lightning ページ (analyzeFlexiPages)

| LWC | ページ | リージョン | 渡すプロパティ |
| --- | --- | --- | --- |
| accountList | Invoice_Record_Page (RecordPage) | main | title |

| 重要度 | code | 対象の単位 | 対象 | 内容 |
| --- | --- | --- | --- | --- |

### オブジェクトごとの自動化 (analyzeAutomation)

| オブジェクト | レコードトリガーフロー | Apex トリガー | 入力規則 |
| --- | --- | --- | --- |
| Account | - | AccountTrigger (before insert, after update, Active)<br>ParserTrigger (before insert, before update, before delete, after insert, after update, after delete, after undelete) | - |
| Invoice__c | Invoice_Status_Update (RecordAfterSave Update, 順 10) | - | Amount_Positive |

### 種類をまたぐ参照 (依存関係のグラフ)

参照 685 件。参照先ごとの参照元 (標準のもの・自分の単位の中の参照は除く):

| 参照先 | 参照元 |
| --- | --- |
| apexClass:AccountService | permissionSet_Invoice_Manager, profile_Sales, flow_Invoice_Status_Update |
| apexClass:InvoiceController | aura_invoiceCard |
| apexClass:InvoicePrintExt | apexPage_InvoicePrint |
| apexClass:ParserInterface | class_ParserTest |
| apexComponent:invoiceHeader | apexPage_InvoicePrint |
| apexTrigger:AccountTrigger | platformEventSubscriberConfig_AccountTriggerConfig |
| aura:invoiceSelectedEvent | aura_invoiceCard |
| customApplication:Invoice_App | profile_Sales, translations_ja |
| customLabel:AccountListTitle | accountList, flow_Account_Wizard, apexPage_InvoicePrint, aura_invoiceCard, translations_ja |
| customLabel:BannerMessage | translations_ja |
| customLabel:Invoice_Overdue | flow_Invoice_Status_Update |
| customPermission:Approve_Invoice | permissionSet_Invoice_Manager |
| customTab:Invoice__c | permissionSet_Invoice_Manager, profile_Sales, customApplication_Invoice_App, translations_ja |
| emailTemplate:Invoice_Templates/Invoice_Sent | workflow_Invoice__c |
| field:Account.Birthdate__c | class_ParserTest |
| field:Account.Interests__c | class_ParserTest |
| field:Account.Tier__c | Invoice__c, profile_Sales, layout_Account-Account Layout |
| field:App_Setting__mdt.Value__c | customMetadata_App_Setting.Default |
| field:Broken__c.Code__c | Broken__c-ja |
| field:FAQ__kav.Id | class_ParserTest |
| field:Invoice__c.Account__c | Invoice__c-ja, emailTemplate_Invoice_Templates.Invoice_Sent |
| field:Invoice__c.Amount__c | Invoice__c-ja, permissionSet_Invoice_Manager, permissionSet_Invoice_Viewer, flow_Invoice_Status_Update, layout_Invoice__c-Invoice Layout, flexiPage_Invoice_Record_Page, quickAction_Invoice__c.Approve, sharingRules_Invoice__c, apexPage_InvoicePrint, report_Invoice_Reports.Open_Invoices, approvalProcess_Invoice__c.Large_Invoice_Approval, reportType_Invoices_with_Lines |
| field:Invoice__c.Due_Date__c | Invoice__c-ja, layout_Invoice__c-Invoice Layout, report_Invoice_Reports.Open_Invoices, pathAssistant_Invoice_Path |
| field:Invoice__c.Is_Overdue__c | workflow_Invoice__c |
| field:Invoice__c.Note__c | Invoice__c-ja, layout_Invoice__c-Invoice Layout |
| field:Invoice__c.Status__c | Invoice__c-ja, permissionSet_Invoice_Manager, profile_Sales, layout_Invoice__c-Invoice Layout, quickAction_Invoice__c.Approve, workflow_Invoice__c, pathAssistant_Invoice_Path |
| field:Knowledge__kav.Title | class_ParserTest |
| field:Legacy_Item__c.Invoice__c | Legacy_Item__c-ja |
| fieldSet:Invoice__c.Summary | Invoice__c-ja |
| flexiPage:Invoice_Record_Page | customApplication_Invoice_App |
| flow:Login_Check | profile_Sales |
| group:Finance | sharingRules_Invoice__c, queue_Invoice_Queue |
| layout:Account-Account Layout | profile_Sales |
| layout:Invoice__c-Invoice Layout | Invoice__c-ja, profile_Sales |
| lwc:accountList | flow_Account_Wizard, flexiPage_Invoice_Record_Page, aura_invoiceCard |
| lwc:accountRow | accountList |
| lwc:child | broken |
| lwc:errorPanel | accountList |
| lwc:utils | accountList, accountRow |
| lwcProperty:accountRow.amount | accountList |
| lwcProperty:accountRow.name | accountList |
| lwcProperty:accountRow.recordId | accountList |
| lwcProperty:errorPanel.errors | accountList |
| matchingRule:Account.Account_Name_Match | duplicateRule_Account.Account_Name_Duplicate |
| mutingPermissionSet:Invoice_Team_Muted | permissionSetGroup_Invoice_Team |
| object:Account | class_AccountService, class_ParserInterface, class_ParserTest, trigger_AccountTrigger, trigger_ParserTrigger, anonymous_broken, anonymous_parser, accountList, Invoice__c, profile_Sales, duplicateRule_Account.Account_Name_Duplicate, matchingRules_Account |
| object:App_Setting__mdt | customMetadata_App_Setting.Default |
| object:Broken__c | Broken__c-ja |
| object:FAQ__kav | class_ParserTest |
| object:Invoice__c | Invoice_Line__c, Legacy_Item__c, Invoice__c-en_US, Invoice__c-ja, permissionSet_Invoice_Manager, permissionSet_Invoice_Viewer, mutingPermissionSet_Invoice_Team_Muted, profile_Sales, flow_Invoice_Status_Update, flexiPage_Invoice_Record_Page, customTab_Invoice__c, customApplication_Invoice_App, quickAction_Invoice__c.Approve, sharingRules_Invoice__c, apexPage_InvoicePrint, report_Invoice_Reports.Open_Invoices, workflow_Invoice__c, approvalProcess_Invoice__c.Large_Invoice_Approval, queue_Invoice_Queue, reportType_Invoices_with_Lines, pathAssistant_Invoice_Path, platformEventChannelMember_Invoice_Changes_chn_Invoice_ChangeEvent |
| object:Knowledge__kav | class_ParserTest |
| object:Legacy_Item__c | Legacy_Item__c-ja |
| permissionSet:Invoice_Manager | permissionSetGroup_Invoice_Team |
| permissionSet:Invoice_Viewer | permissionSetGroup_Invoice_Team |
| platformEventChannel:Invoice_Changes__chn | platformEventChannelMember_Invoice_Changes_chn_Invoice_ChangeEvent |
| queue:Invoice_Queue | assignmentRules_Case, escalationRules_Case |
| recordType:Invoice__c.Standard | Invoice__c-ja, permissionSet_Invoice_Manager |
| report:Invoice_Reports/Open_Invoices | dashboard_Invoice_Dashboards.Invoice_Overview |
| role:Sales_Manager | sharingRules_Invoice__c |
| validationRule:Invoice__c.Amount_Positive | Invoice__c-ja |
| webLink:Invoice__c.Send_Invoice | Invoice__c-ja |

| code | 参照元 | 対象 |
| --- | --- | --- |
| UNKNOWN_FIELD | site:apexClass:ParserTest:query_cb346eb2a67309cf | field:Account.Interests__c |
| UNKNOWN_FIELD | site:apexClass:ParserTest:query_cb346eb2a67309cf | field:Account.Birthdate__c |
| UNKNOWN_LWC | site:lwc:accountList:lwcElement_c3dcca94c935e684 | lwc:errorPanel |
| UNKNOWN_LWC | site:lwc:broken:lwcElement_dcd2df94fbc96369 | lwc:child |
| UNKNOWN_FLOW | site:profile:Sales:loginFlow_95cb1010aaaf337a | flow:Login_Check |
| UNKNOWN_APEX_CLASS | site:apexPage:InvoicePrint:visualforceMarkup_45bc1856c875cd83 | apexClass:InvoicePrintExt |
| UNKNOWN_APEX_CLASS | site:aura:invoiceCard:auraBundle_2f030bba3c653a82 | apexClass:InvoiceController |
| UNKNOWN_AURA | site:aura:invoiceCard:auraRegisterEvent_c32c93b2caa0b1d0 | aura:invoiceSelectedEvent |

## after

| id | dataType | 行の件数 | skippedElements | 読めなかったところ |
| --- | --- | --- | --- | --- |
| permissionSet_Broken_Set | error | - | - | permissionsets/Broken_Set.permissionset-meta.xml L6: XML_SYNTAX </objectPermissions> expected but </PermissionSet> found |
| permissionSet_Invoice_Manager | permissionSet | classAccesses: 2<br>customPermissions: 1<br>fieldPermissions: 3<br>objectPermissions: 2<br>recordTypeVisibilities: 1<br>userPermissions: 2<br>tabSettings: 1 | - | - |
| permissionSet_Payment_Clerk | permissionSet | classAccesses: 1<br>fieldPermissions: 1<br>objectPermissions: 3 | - | - |
| mutingPermissionSet_Invoice_Team_Muted | mutingPermissionSet | fieldPermissions: 1<br>objectPermissions: 1<br>userPermissions: 1 | - | - |
| profile_Sales | profile | applicationVisibilities: 1<br>classAccesses: 1<br>fieldPermissions: 2<br>objectPermissions: 2<br>userPermissions: 2<br>tabVisibilities: 1<br>layoutAssignments: 2<br>loginIpRanges: 2<br>loginFlows: 1<br>profileActionOverrides: 1<br>categoryGroupVisibilities: 1 | futureSetting | - |
| permissionSetGroup_Invoice_Team | permissionSetGroup | - | - | - |
| customLabels_CustomLabels | customLabels | labels: 3 | - | - |
| flow_Account_Wizard | flow | elements: 3<br>edges: 4 | - | - |
| flow_Invoice_Status_Update | flow | elements: 5<br>resources: 2<br>edges: 7 | - | - |
| layout_Account-Account Layout | layout | sections: 1<br>items: 3 | - | - |
| layout_Invoice__c-Invoice Detail | layout | sections: 1<br>items: 2 | - | - |
| layout_Invoice__c-Invoice Layout | layout | sections: 3<br>items: 8<br>relatedLists: 1<br>actions: 3 | summaryLayout | - |
| flexiPage_Invoice_Record_Page | flexiPage | regions: 3<br>components: 5<br>fields: 2 | - | - |
| customMetadata_App_Setting.Default | customMetadata | values: 1 | - | - |
| customMetadata_App_Setting.Sandbox | customMetadata | values: 1 | - | - |
| customTab_Account_List | customTab | - | - | - |
| customTab_Invoice__c | customTab | - | - | - |
| customApplication_Invoice_App | customApplication | actionOverrides: 1 | - | - |
| globalValueSet_Invoice_Status | globalValueSet | customValue: 3 | - | - |
| standardValueSet_Industry | standardValueSet | standardValue: 3 | - | - |
| customPermission_Approve_Invoice | customPermission | requiredPermission: 1 | - | - |
| customPermission_View_Invoice | customPermission | - | - | - |
| quickAction_Invoice__c.Approve | quickAction | fieldOverrides: 1 | - | - |
| sharingRules_Invoice__c | sharingRules | sharingCriteriaRules: 2 | - | - |
| apexPage_InvoicePrint | apexPage | - | - | - |
| apexComponent_invoiceHeader | apexComponent | - | - | - |
| aura_brokenCard | error | - | - | aura/brokenCard/brokenCard.cmp L3: XML_SYNTAX </lightning:card> expected but </aura:component> found |
| aura_invoiceCard | aura | attributes: 3<br>registerEvents: 1<br>methods: 1<br>body: 1 | - | - |
| staticResource_logo | staticResource | - | - | - |
| emailTemplate_Invoice_Templates.Invoice_Sent | emailTemplate | - | - | - |
| report_Invoice_Reports.Open_Invoices | report | params: 1<br>columns: 3 | - | - |
| dashboard_Invoice_Dashboards.Invoice_Overview | dashboard | - | - | - |
| translations_ja | translations | customLabels: 2<br>customTabs: 1<br>customApplications: 1 | - | - |
| namedCredential_Billing_API | namedCredential | namedCredentialParameters: 2 | - | - |
| remoteSiteSetting_Billing | remoteSiteSetting | - | - | - |
| workflow_Invoice__c | workflow | fieldUpdates: 1<br>rules: 1 | - | - |
| approvalProcess_Invoice__c.Large_Invoice_Approval | approvalProcess | allowedSubmitters: 1<br>approvalStep: 2 | - | - |
| queue_Invoice_Queue | queue | queueSobject: 2 | - | - |
| group_Finance | group | - | - | - |
| role_Sales_Manager | role | - | - | - |
| messageChannel_Invoice_Selected | messageChannel | lightningMessageFields: 2 | - | - |
| externalCredential_Billing_Auth | externalCredential | externalCredentialParameters: 2 | - | - |
| customNotificationType_Invoice_Overdue | customNotificationType | - | - | - |
| reportType_Invoices_with_Lines | reportType | sections: 1 | - | - |
| assignmentRules_Case | assignmentRules | assignmentRule: 1 | - | - |
| autoResponseRules_Case | autoResponseRules | autoResponseRule: 1 | - | - |
| escalationRules_Case | escalationRules | escalationRule: 1 | - | - |
| pathAssistant_Invoice_Path | pathAssistant | pathAssistantSteps: 2 | - | - |
| duplicateRule_Account.Account_Name_Duplicate | duplicateRule | duplicateRuleMatchRules: 1 | - | - |
| matchingRules_Account | matchingRules | matchingRules: 1 | - | - |
| platformEventChannel_Invoice_Changes__chn | platformEventChannel | - | - | - |
| platformEventChannelMember_Invoice_Changes_chn_Invoice_ChangeEvent | platformEventChannelMember | enrichedFields: 2 | - | - |
| platformEventSubscriberConfig_AccountTriggerConfig | platformEventSubscriberConfig | - | - | - |
| cspTrustedSite_Billing_API | cspTrustedSite | - | - | - |
| externalDataSource_Billing_Data | externalDataSource | - | - | - |
| settings_Security | settings | - | - | - |

### 権限 (analyzePermissions)

| 権限 | オブジェクト (CRED / すべて参照・変更) | 項目 (参照・編集) | Apex | ユーザー権限 |
| --- | --- | --- | --- | --- |
| permissionSet:Invoice_Manager | Invoice__c: CRED VA MA<br>Payment__c: --E- | Invoice__c.Amount__c: RE<br>Invoice__c.Approved__c: RE<br>Invoice__c.Missing__c: R- | AccountService, NewHelper | ApiEnabled, ModifyAllData |
| permissionSet:Payment_Clerk | Invoice__c: -R--<br>Payment__c: CRE-<br>Receipt__c: -R-- | Invoice__c.Amount__c: R- | PaymentService | - |
| mutingPermissionSet:Invoice_Team_Muted | Invoice__c: ---D VA MA | Invoice__c.Approved__c: -E | - | ModifyAllData |
| profile:Sales | Account: CRE-<br>Invoice__c: -RE- | Account.Tier__c: RE<br>Invoice__c.Status__c: -E | AccountService | ApiEnabled, ViewSetup |
| permissionSetGroup:Invoice_Team (実際の権限) | Invoice__c: CRE-<br>Payment__c: CRE-<br>Receipt__c: -R-- | Invoice__c.Amount__c: RE<br>Invoice__c.Approved__c: R-<br>Invoice__c.Missing__c: R- | AccountService, NewHelper, PaymentService | ApiEnabled |

| 重要度 | code | 権限 | 対象 | 内容 |
| --- | --- | --- | --- | --- |
| warning | UNKNOWN_FIELD | permissionSet:Invoice_Manager | Invoice__c.Missing__c | 項目 Invoice__c.Missing__c がメタデータにない |
| error | OBJECT_PERMISSION_DEPENDENCY | permissionSet:Invoice_Manager | Payment__c | Payment__c の allowEdit には allowRead が要る |
| info | POWERFUL_USER_PERMISSION | permissionSet:Invoice_Manager | ApiEnabled | 強い権限 ApiEnabled を与える |
| info | POWERFUL_USER_PERMISSION | permissionSet:Invoice_Manager | ModifyAllData | 強い権限 ModifyAllData を与える |
| warning | UNKNOWN_OBJECT | permissionSet:Payment_Clerk | Receipt__c | オブジェクト Receipt__c がメタデータにない |
| warning | UNKNOWN_APEX_CLASS | permissionSet:Payment_Clerk | PaymentService | Apex クラス PaymentService がリポジトリにない |
| warning | UNKNOWN_FLOW | profile:Sales | Login_Check | Flow Login_Check がリポジトリにない |
| error | FIELD_EDIT_WITHOUT_READ | profile:Sales | Invoice__c.Status__c | Invoice__c.Status__c は編集できるが参照できない |
| info | POWERFUL_USER_PERMISSION | profile:Sales | ApiEnabled | 強い権限 ApiEnabled を与える |
| info | POWERFUL_USER_PERMISSION | profile:Sales | ViewSetup | 強い権限 ViewSetup を与える |
| warning | UNKNOWN_PERMISSION_SET | permissionSetGroup:Invoice_Team | Invoice_Viewer | 権限セット Invoice_Viewer がリポジトリにない |

### カスタム表示ラベル (依存関係のグラフ)

| ラベル | 使っている単位 |
| --- | --- |
| AccountListTitle | apexPage:InvoicePrint, aura:invoiceCard, flow:Account_Wizard, translations:ja |
| Invoice_Approved | translations:ja |
| Invoice_Overdue | flow:Invoice_Status_Update |

| code | 対象 | 参照元 |
| --- | --- | --- |
| UNKNOWN_CUSTOM_LABEL | customLabel:BannerMessage | lwc:newBanner |

### Flow (analyzeFlows)

| Flow | 種類 | 起動 | 対象 | 状態 | 要素 |
| --- | --- | --- | --- | --- | --- |
| Account_Wizard | Flow | - | - | Active | 3 |
| Invoice_Status_Update | AutoLaunchedFlow | RecordAfterSave / CreateAndUpdate | Invoice__c | Active | 5 |

#### 接続 (図のエッジ)

- **Account_Wizard**: $start → Get_Account (connector), Get_Account → Welcome (connector), Get_Account → Welcome (faultConnector), Welcome → Call_Status (connector)
- **Invoice_Status_Update**: $start → Check_Amount (connector), Notify → Log_Error (connector), Notify → Log_Error (faultConnector), Check_Amount → Notify (defaultConnector), Check_Amount → Notify (rules[Medium].connector), Check_Amount → Set_Status (rules[Large].connector), Set_Status → Log_Error (faultConnector)

#### オブジェクトごとの自動化

- Invoice__c: Invoice_Status_Update (RecordAfterSave CreateAndUpdate, 順 20)

| 重要度 | code | 対象の単位 | 対象 | 内容 |
| --- | --- | --- | --- | --- |
| info | NO_FAULT_PATH | Account_Wizard | Call_Status | 要素 Call_Status に失敗時の経路 (faultConnector) がない |
| warning | UNKNOWN_FIELD | Account_Wizard | Account.Unknown__c | 項目 Account.Unknown__c がメタデータにない |
| warning | LWC_NOT_FLOW_SCREEN | Account_Wizard | accountList | LWC accountList の targets に lightning__FlowScreen がない |
| warning | UNKNOWN_LWC | Account_Wizard | missingChart | LWC missingChart がリポジトリにない |
| warning | UNREACHABLE_ELEMENT | Invoice_Status_Update | Orphan | 要素 Orphan は起動からたどれない |
| warning | APEX_NOT_INVOCABLE | Invoice_Status_Update | AccountService | Apex クラス AccountService に @InvocableMethod がない |
| error | UNKNOWN_FLOW_ELEMENT | Invoice_Status_Update | Unknown_Var | 要素・資源 Unknown_Var が Flow の中にない |

### ページレイアウト (analyzeLayouts)

| レイアウト | オブジェクト | 項目 |
| --- | --- | --- |
| Account-Account Layout | Account | Name, Tier__c, Missing__c |
| Invoice__c-Invoice Detail | Invoice__c | Name, Amount__c |
| Invoice__c-Invoice Layout | Invoice__c | Name, Amount__c, Due_Date__c, Status__c, Approved__c, CreatedById, LastModifiedById |

| 重要度 | code | 対象の単位 | 対象 | 内容 |
| --- | --- | --- | --- | --- |
| warning | UNKNOWN_FIELD | Account-Account Layout | Account.Missing__c | 項目 Account.Missing__c がメタデータにない |
| warning | REQUIRED_FIELD_READONLY | Invoice__c-Invoice Detail | Invoice__c.Amount__c | 必須の項目 Invoice__c.Amount__c がレイアウト Invoice__c-Invoice Detail で参照のみ |
| info | FIELD_NOT_ON_LAYOUT | - | Invoice__c.Account__c | 項目 Invoice__c.Account__c はどのレイアウトにもない |
| info | FIELD_NOT_ON_LAYOUT | - | Invoice__c.Is_Overdue__c | 項目 Invoice__c.Is_Overdue__c はどのレイアウトにもない |

### Lightning ページ (analyzeFlexiPages)

| LWC | ページ | リージョン | 渡すプロパティ |
| --- | --- | --- | --- |
| accountList | Invoice_Record_Page (RecordPage) | sidebar | title, pageSize |
| accountRow | Invoice_Record_Page (RecordPage) | sidebar | - |

| 重要度 | code | 対象の単位 | 対象 | 内容 |
| --- | --- | --- | --- | --- |
| warning | UNKNOWN_LWC_PROPERTY | Invoice_Record_Page | accountList.pageSize | LWC accountList の targetConfigs (lightning__RecordPage) にプロパティ pageSize がない |
| warning | LWC_NOT_EXPOSED | Invoice_Record_Page | accountRow | LWC accountRow は isExposed でない |
| warning | LWC_TARGET_MISMATCH | Invoice_Record_Page | accountRow | LWC accountRow の targets に lightning__RecordPage がない |
| warning | UNKNOWN_FIELD | Invoice_Record_Page | Invoice__c.Missing__c | 項目 Invoice__c.Missing__c がメタデータにない |

### オブジェクトごとの自動化 (analyzeAutomation)

| オブジェクト | レコードトリガーフロー | Apex トリガー | 入力規則 |
| --- | --- | --- | --- |
| Account | - | AccountTrigger (after update, before delete, Inactive)<br>ParserTrigger (before insert, before update, before delete, after insert, after update, after delete, after undelete) | Name_Required |
| Invoice__c | Invoice_Status_Update (RecordAfterSave CreateAndUpdate, 順 20) | - | Amount_Positive<br>Due_Date_Required (無効) |

### 種類をまたぐ参照 (依存関係のグラフ)

参照 729 件。参照先ごとの参照元 (標準のもの・自分の単位の中の参照は除く):

| 参照先 | 参照元 |
| --- | --- |
| apexClass:AccountService | permissionSet_Invoice_Manager, profile_Sales, flow_Invoice_Status_Update |
| apexClass:InvoiceController | aura_invoiceCard |
| apexClass:InvoicePrintExt | apexPage_InvoicePrint |
| apexClass:NewHelper | permissionSet_Invoice_Manager |
| apexClass:ParserInterface | class_ParserTest |
| apexClass:PaymentService | permissionSet_Payment_Clerk |
| apexComponent:invoiceHeader | apexPage_InvoicePrint |
| apexTrigger:AccountTrigger | platformEventSubscriberConfig_AccountTriggerConfig |
| aura:invoiceSelectedEvent | aura_invoiceCard |
| customApplication:Invoice_App | profile_Sales, translations_ja |
| customLabel:AccountListTitle | flow_Account_Wizard, apexPage_InvoicePrint, aura_invoiceCard, translations_ja |
| customLabel:BannerMessage | newBanner |
| customLabel:Invoice_Approved | translations_ja |
| customLabel:Invoice_Overdue | flow_Invoice_Status_Update |
| customPermission:Approve_Invoice | permissionSet_Invoice_Manager |
| customPermission:View_Invoice | customPermission_Approve_Invoice |
| customTab:Account_List | customApplication_Invoice_App |
| customTab:Invoice__c | permissionSet_Invoice_Manager, profile_Sales, customApplication_Invoice_App, translations_ja |
| externalCredential:Billing_Auth | namedCredential_Billing_API |
| field:Account.Birthdate__c | class_ParserTest |
| field:Account.Interests__c | class_ParserTest |
| field:Account.Missing__c | layout_Account-Account Layout |
| field:Account.Tier__c | Invoice__c, Account-ja, profile_Sales, flow_Account_Wizard, layout_Account-Account Layout |
| field:Account.Unknown__c | flow_Account_Wizard |
| field:App_Setting__mdt.Value__c | customMetadata_App_Setting.Default, customMetadata_App_Setting.Sandbox |
| field:FAQ__kav.Id | class_ParserTest |
| field:Invoice__c.Account__c | Invoice__c-ja, emailTemplate_Invoice_Templates.Invoice_Sent |
| field:Invoice__c.Amount__c | Invoice__c-ja, permissionSet_Invoice_Manager, permissionSet_Payment_Clerk, flow_Invoice_Status_Update, layout_Invoice__c-Invoice Detail, layout_Invoice__c-Invoice Layout, flexiPage_Invoice_Record_Page, quickAction_Invoice__c.Approve, sharingRules_Invoice__c, apexPage_InvoicePrint, emailTemplate_Invoice_Templates.Invoice_Sent, report_Invoice_Reports.Open_Invoices, approvalProcess_Invoice__c.Large_Invoice_Approval, reportType_Invoices_with_Lines |
| field:Invoice__c.Approved__c | permissionSet_Invoice_Manager, mutingPermissionSet_Invoice_Team_Muted, layout_Invoice__c-Invoice Layout, quickAction_Invoice__c.Approve, pathAssistant_Invoice_Path |
| field:Invoice__c.Due_Date__c | Invoice__c-ja, layout_Invoice__c-Invoice Layout, reportType_Invoices_with_Lines, pathAssistant_Invoice_Path |
| field:Invoice__c.Is_Overdue__c | workflow_Invoice__c |
| field:Invoice__c.Missing__c | permissionSet_Invoice_Manager, flexiPage_Invoice_Record_Page |
| field:Invoice__c.Note__c | Invoice__c-ja |
| field:Invoice__c.Status__c | Invoice__c-ja, profile_Sales, layout_Invoice__c-Invoice Layout, quickAction_Invoice__c.Approve, report_Invoice_Reports.Open_Invoices, workflow_Invoice__c, pathAssistant_Invoice_Path |
| field:Knowledge__kav.Title | class_ParserTest |
| fieldSet:Invoice__c.Summary | Invoice__c-ja |
| flexiPage:Invoice_Record_Page_V2 | customApplication_Invoice_App |
| flow:Invoice_Status_Update | flow_Account_Wizard |
| flow:Login_Check | profile_Sales |
| group:Finance | queue_Invoice_Queue |
| layout:Account-Account Layout | profile_Sales |
| layout:Invoice__c-Invoice Detail | profile_Sales |
| layout:Invoice__c-Invoice Layout | Invoice__c-ja |
| lwc:accountList | flow_Account_Wizard, flexiPage_Invoice_Record_Page, customTab_Account_List, aura_invoiceCard |
| lwc:accountRow | accountList, flexiPage_Invoice_Record_Page |
| lwc:child | broken |
| lwc:errorPanel | accountList |
| lwc:missingChart | flow_Account_Wizard |
| lwc:utils | accountList, accountRow |
| lwcProperty:accountRow.amount | accountList |
| lwcProperty:accountRow.name | accountList |
| lwcProperty:accountRow.recordId | accountList |
| lwcProperty:errorPanel.errors | accountList |
| matchingRule:Account.Account_Name_Match | duplicateRule_Account.Account_Name_Duplicate |
| mutingPermissionSet:Invoice_Team_Muted | permissionSetGroup_Invoice_Team |
| object:Account | class_AccountService, class_ParserInterface, class_ParserTest, trigger_AccountTrigger, trigger_ParserTrigger, anonymous_broken, anonymous_parser, accountList, Invoice__c, Account-ja, profile_Sales, flow_Account_Wizard, duplicateRule_Account.Account_Name_Duplicate, matchingRules_Account |
| object:App_Setting__mdt | customMetadata_App_Setting.Default, customMetadata_App_Setting.Sandbox |
| object:Broken__c | Broken__c-ja |
| object:FAQ__kav | class_ParserTest |
| object:Invoice__c | Invoice_Line__c, Payment__c, Invoice__c-en_US, Invoice__c-ja, permissionSet_Invoice_Manager, permissionSet_Payment_Clerk, mutingPermissionSet_Invoice_Team_Muted, profile_Sales, flow_Invoice_Status_Update, flexiPage_Invoice_Record_Page, customTab_Invoice__c, customApplication_Invoice_App, quickAction_Invoice__c.Approve, sharingRules_Invoice__c, apexPage_InvoicePrint, report_Invoice_Reports.Open_Invoices, workflow_Invoice__c, approvalProcess_Invoice__c.Large_Invoice_Approval, queue_Invoice_Queue, reportType_Invoices_with_Lines, pathAssistant_Invoice_Path, platformEventChannelMember_Invoice_Changes_chn_Invoice_ChangeEvent |
| object:Knowledge__kav | class_ParserTest |
| object:Payment__c | permissionSet_Invoice_Manager, permissionSet_Payment_Clerk, queue_Invoice_Queue |
| object:Receipt__c | permissionSet_Payment_Clerk |
| permissionSet:Invoice_Manager | permissionSetGroup_Invoice_Team |
| permissionSet:Invoice_Viewer | permissionSetGroup_Invoice_Team |
| permissionSet:Payment_Clerk | permissionSetGroup_Invoice_Team |
| platformEventChannel:Invoice_Changes__chn | platformEventChannelMember_Invoice_Changes_chn_Invoice_ChangeEvent |
| queue:Invoice_Queue | assignmentRules_Case, escalationRules_Case |
| recordType:Invoice__c.Standard | Invoice__c-ja, permissionSet_Invoice_Manager |
| report:Invoice_Reports/Open_Invoices | dashboard_Invoice_Dashboards.Invoice_Overview |
| role:CEO | role_Sales_Manager |
| role:Sales_Manager | sharingRules_Invoice__c |
| validationRule:Account.Name_Required | Account-ja |
| validationRule:Invoice__c.Amount_Positive | Invoice__c-ja |
| webLink:Invoice__c.Send_Invoice | Invoice__c-ja |

| code | 参照元 | 対象 |
| --- | --- | --- |
| UNKNOWN_FIELD | site:apexClass:ParserTest:query_cf2d2ee89dceb344 | field:Account.Interests__c |
| UNKNOWN_FIELD | site:apexClass:ParserTest:query_cf2d2ee89dceb344 | field:Account.Birthdate__c |
| UNKNOWN_LWC | site:lwc:accountList:lwcElement_fa191c2761e26688 | lwc:errorPanel |
| UNKNOWN_LWC | site:lwc:broken:lwcElement_dcd2df94fbc96369 | lwc:child |
| UNKNOWN_CUSTOM_LABEL | site:lwc:newBanner:importDeclaration_e988dfac11d6694e | customLabel:BannerMessage |
| UNKNOWN_FIELD | site:objectTranslation:Invoice__c-ja:fieldTranslation_4fb21aac7bf9d56d | field:Invoice__c.Note__c |
| UNKNOWN_FIELD | site:permissionSet:Invoice_Manager:fieldPermission_7a4e2c75d3aeb07a | field:Invoice__c.Missing__c |
| UNKNOWN_OBJECT | site:permissionSet:Payment_Clerk:objectPermission_023909c270126261 | object:Receipt__c |
| UNKNOWN_APEX_CLASS | site:permissionSet:Payment_Clerk:classAccess_4e3e921febc7217b | apexClass:PaymentService |
| UNKNOWN_FLOW | site:profile:Sales:loginFlow_c2a35eeaace313c0 | flow:Login_Check |
| UNKNOWN_PERMISSION_SET | site:permissionSetGroup:Invoice_Team:permissionSetGroup_ca71a1ddc6196f2a | permissionSet:Invoice_Viewer |
| UNKNOWN_FIELD | site:flow:Account_Wizard:flowRecordLookup_7d3e549c22554faf | field:Account.Unknown__c |
| UNKNOWN_LWC | site:flow:Account_Wizard:flowScreen_da78defa1b5d2b8a | lwc:missingChart |
| UNKNOWN_FIELD | site:layout:Account-Account Layout:layoutItem_c766fc743282482a | field:Account.Missing__c |
| UNKNOWN_FIELD | site:flexiPage:Invoice_Record_Page:flexiPageField_760854506638aa36 | field:Invoice__c.Missing__c |
| UNKNOWN_FLEXI_PAGE | site:customApplication:Invoice_App:appActionOverride_14c30017cff80fe0 | flexiPage:Invoice_Record_Page_V2 |
| UNKNOWN_APEX_CLASS | site:apexPage:InvoicePrint:visualforceMarkup_a4462fc44c960e86 | apexClass:InvoicePrintExt |
| UNKNOWN_APEX_CLASS | site:aura:invoiceCard:auraBundle_e4e8002a84c6c7e8 | apexClass:InvoiceController |
| UNKNOWN_AURA | site:aura:invoiceCard:auraRegisterEvent_2adfe1c3e55a764e | aura:invoiceSelectedEvent |
| UNKNOWN_ROLE | site:role:Sales_Manager:role_81175e88a0dc70a1 | role:CEO |

