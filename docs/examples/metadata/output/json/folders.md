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
| aura_invoiceCard | aura | attributes: 2<br>registerEvents: 1<br>handlers: 1 | - | - |
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

### カスタム表示ラベル (analyzeCustomLabels)

| ラベル | 値 | 使っているところ |
| --- | --- | --- |
| AccountListTitle | 取引先一覧 | lwc:lwc_accountList, flow:flow_Account_Wizard |
| BannerMessage | お知らせ | - |
| Invoice_Overdue | 支払期限を過ぎています | flow:flow_Invoice_Status_Update |

| 重要度 | code | 対象 | 内容 |
| --- | --- | --- | --- |
| info | UNUSED_CUSTOM_LABEL | BannerMessage | カスタム表示ラベル BannerMessage はリポジトリの中で使われていない |

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

### 種類をまたぐ参照 (analyzeMetadataReferences)

参照 45 件。参照先ごとの参照元:

| 参照先 | 参照元 |
| --- | --- |
| apexClass:InvoiceController | aura_invoiceCard |
| apexClass:InvoicePrintExt | apexPage_InvoicePrint |
| aura:invoiceSelectedEvent | aura_invoiceCard |
| customApplication:Invoice_App | profile_Sales, translations_ja |
| customLabel:AccountListTitle | apexPage_InvoicePrint, aura_invoiceCard, translations_ja |
| customLabel:BannerMessage | translations_ja |
| customPermission:Approve_Invoice | permissionSet_Invoice_Manager |
| customTab:Invoice__c | permissionSet_Invoice_Manager, profile_Sales, customApplication_Invoice_App, translations_ja |
| emailTemplate:Invoice_Templates/Invoice_Sent | workflow_Invoice__c |
| field:App_Setting__mdt.Value__c | customMetadata_App_Setting.Default |
| field:Invoice__c.Account__c | emailTemplate_Invoice_Templates.Invoice_Sent |
| field:Invoice__c.Amount__c | quickAction_Invoice__c.Approve, sharingRules_Invoice__c, apexPage_InvoicePrint, report_Invoice_Reports.Open_Invoices, approvalProcess_Invoice__c.Large_Invoice_Approval |
| field:Invoice__c.Due_Date__c | report_Invoice_Reports.Open_Invoices |
| field:Invoice__c.Is_Overdue__c | workflow_Invoice__c |
| field:Invoice__c.Name | emailTemplate_Invoice_Templates.Invoice_Sent |
| field:Invoice__c.Status__c | quickAction_Invoice__c.Approve, workflow_Invoice__c |
| flexiPage:Invoice_Record_Page | customApplication_Invoice_App |
| group:Finance | sharingRules_Invoice__c, queue_Invoice_Queue |
| lwc:accountList | aura_invoiceCard |
| object:App_Setting__mdt | customMetadata_App_Setting.Default |
| object:Invoice__c | customTab_Invoice__c, customApplication_Invoice_App, quickAction_Invoice__c.Approve, sharingRules_Invoice__c, apexPage_InvoicePrint, report_Invoice_Reports.Open_Invoices, workflow_Invoice__c, approvalProcess_Invoice__c.Large_Invoice_Approval, queue_Invoice_Queue |
| report:Invoice_Reports/Open_Invoices | dashboard_Invoice_Dashboards.Invoice_Overview |
| role:Sales_Manager | sharingRules_Invoice__c |
| visualforceComponent:invoiceHeader | apexPage_InvoicePrint |

| code | 参照元 | 対象 |
| --- | --- | --- |
| UNKNOWN_APEX_CLASS | apexPage_InvoicePrint | InvoicePrintExt |
| UNKNOWN_APEX_CLASS | aura_invoiceCard | InvoiceController |
| UNKNOWN_AURA | aura_invoiceCard | invoiceSelectedEvent |

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
| aura_invoiceCard | aura | attributes: 3<br>registerEvents: 1<br>methods: 1 | - | - |
| staticResource_logo | staticResource | - | - | - |
| emailTemplate_Invoice_Templates.Invoice_Sent | emailTemplate | - | - | - |
| report_Invoice_Reports.Open_Invoices | report | params: 1<br>columns: 3 | - | - |
| dashboard_Invoice_Dashboards.Invoice_Overview | dashboard | - | - | - |
| translations_ja | translations | customLabels: 2<br>customTabs: 1<br>customApplications: 1 | - | - |
| namedCredential_Billing_API | namedCredential | namedCredentialParameters: 1 | - | - |
| remoteSiteSetting_Billing | remoteSiteSetting | - | - | - |
| workflow_Invoice__c | workflow | fieldUpdates: 1<br>rules: 1 | - | - |
| approvalProcess_Invoice__c.Large_Invoice_Approval | approvalProcess | allowedSubmitters: 1<br>approvalStep: 2 | - | - |
| queue_Invoice_Queue | queue | queueSobject: 2 | - | - |
| group_Finance | group | - | - | - |
| role_Sales_Manager | role | - | - | - |

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

### カスタム表示ラベル (analyzeCustomLabels)

| ラベル | 値 | 使っているところ |
| --- | --- | --- |
| AccountListTitle | 取引先の一覧 | flow:flow_Account_Wizard |
| Invoice_Overdue | 支払期限を過ぎています | flow:flow_Invoice_Status_Update |
| Invoice_Approved | 承認しました | - |

| 重要度 | code | 対象 | 内容 |
| --- | --- | --- | --- |
| warning | UNKNOWN_CUSTOM_LABEL | BannerMessage | カスタム表示ラベル BannerMessage がリポジトリにない |
| info | UNUSED_CUSTOM_LABEL | Invoice_Approved | カスタム表示ラベル Invoice_Approved はリポジトリの中で使われていない |

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

### 種類をまたぐ参照 (analyzeMetadataReferences)

参照 54 件。参照先ごとの参照元:

| 参照先 | 参照元 |
| --- | --- |
| apexClass:InvoiceController | aura_invoiceCard |
| apexClass:InvoicePrintExt | apexPage_InvoicePrint |
| aura:invoiceSelectedEvent | aura_invoiceCard |
| customApplication:Invoice_App | profile_Sales, translations_ja |
| customLabel:AccountListTitle | apexPage_InvoicePrint, aura_invoiceCard, translations_ja |
| customLabel:Invoice_Approved | translations_ja |
| customPermission:Approve_Invoice | permissionSet_Invoice_Manager |
| customPermission:View_Invoice | customPermission_Approve_Invoice |
| customTab:Account_List | customApplication_Invoice_App |
| customTab:Invoice__c | permissionSet_Invoice_Manager, profile_Sales, customApplication_Invoice_App, translations_ja |
| field:App_Setting__mdt.Value__c | customMetadata_App_Setting.Default, customMetadata_App_Setting.Sandbox |
| field:Invoice__c.Account__c | emailTemplate_Invoice_Templates.Invoice_Sent |
| field:Invoice__c.Amount__c | quickAction_Invoice__c.Approve, sharingRules_Invoice__c, apexPage_InvoicePrint, emailTemplate_Invoice_Templates.Invoice_Sent, report_Invoice_Reports.Open_Invoices, approvalProcess_Invoice__c.Large_Invoice_Approval |
| field:Invoice__c.Approved__c | quickAction_Invoice__c.Approve |
| field:Invoice__c.Is_Overdue__c | workflow_Invoice__c |
| field:Invoice__c.Name | emailTemplate_Invoice_Templates.Invoice_Sent |
| field:Invoice__c.Status__c | quickAction_Invoice__c.Approve, report_Invoice_Reports.Open_Invoices, workflow_Invoice__c |
| flexiPage:Invoice_Record_Page_V2 | customApplication_Invoice_App |
| group:Finance | queue_Invoice_Queue |
| lwc:accountList | customTab_Account_List, aura_invoiceCard |
| object:App_Setting__mdt | customMetadata_App_Setting.Default, customMetadata_App_Setting.Sandbox |
| object:Invoice__c | customTab_Invoice__c, customApplication_Invoice_App, quickAction_Invoice__c.Approve, sharingRules_Invoice__c, apexPage_InvoicePrint, report_Invoice_Reports.Open_Invoices, workflow_Invoice__c, approvalProcess_Invoice__c.Large_Invoice_Approval, queue_Invoice_Queue |
| object:Payment__c | queue_Invoice_Queue |
| report:Invoice_Reports/Open_Invoices | dashboard_Invoice_Dashboards.Invoice_Overview |
| role:CEO | role_Sales_Manager |
| role:Sales_Manager | sharingRules_Invoice__c |
| visualforceComponent:invoiceHeader | apexPage_InvoicePrint |

| code | 参照元 | 対象 |
| --- | --- | --- |
| UNKNOWN_FLEXI_PAGE | customApplication_Invoice_App | Invoice_Record_Page_V2 |
| UNKNOWN_APEX_CLASS | apexPage_InvoicePrint | InvoicePrintExt |
| UNKNOWN_APEX_CLASS | aura_invoiceCard | InvoiceController |
| UNKNOWN_AURA | aura_invoiceCard | invoiceSelectedEvent |
| UNKNOWN_ROLE | role_Sales_Manager | CEO |

