# フォルダ単位のメタデータの Diff

`run-folders.ts` が出力する。

## 単位

| id | status |
| --- | --- |
| permissionSet_Broken_Set | unchanged |
| permissionSet_Invoice_Manager | changed |
| permissionSet_Invoice_Viewer | removed |
| permissionSet_Payment_Clerk | added |
| mutingPermissionSet_Invoice_Team_Muted | changed |
| profile_Sales | changed |
| permissionSetGroup_Invoice_Team | changed |
| customLabels_CustomLabels | changed |
| flow_Account_Wizard | changed |
| flow_Invoice_Status_Update | changed |
| layout_Account-Account Layout | changed |
| layout_Invoice__c-Invoice Detail | added |
| layout_Invoice__c-Invoice Layout | changed |
| flexiPage_Invoice_Record_Page | changed |
| customMetadata_App_Setting.Default | changed |
| customMetadata_App_Setting.Sandbox | added |
| customTab_Account_List | added |
| customTab_Invoice__c | changed |
| customApplication_Invoice_App | changed |
| globalValueSet_Invoice_Status | changed |
| standardValueSet_Industry | changed |
| customPermission_Approve_Invoice | changed |
| customPermission_View_Invoice | unchanged |
| quickAction_Invoice__c.Approve | changed |
| sharingRules_Invoice__c | changed |
| apexPage_InvoicePrint | changed |
| apexComponent_invoiceHeader | changed |
| aura_brokenCard | added |
| aura_invoiceCard | changed |
| staticResource_logo | changed |
| emailTemplate_Invoice_Templates.Invoice_Sent | changed |
| report_Invoice_Reports.Open_Invoices | changed |
| dashboard_Invoice_Dashboards.Invoice_Overview | changed |
| translations_ja | changed |
| namedCredential_Billing_API | changed |
| remoteSiteSetting_Billing | changed |
| workflow_Invoice__c | changed |
| approvalProcess_Invoice__c.Large_Invoice_Approval | changed |
| queue_Invoice_Queue | changed |
| group_Finance | changed |
| role_Sales_Manager | changed |

## kind ごとの出現数

| kind | JSON | 差分 (unchanged 以外) |
| --- | --- | --- |
| apexComponent | 2 | 1 |
| apexPage | 2 | 1 |
| appActionOverride | 2 | 1 |
| applicationTranslation | 2 | 0 |
| applicationVisibility | 2 | 0 |
| approvalProcess | 2 | 1 |
| approvalStep | 3 | 1 |
| auraAttribute | 5 | 2 |
| auraBundle | 2 | 1 |
| auraDefinitionBundle | 2 | 1 |
| auraHandler | 1 | 0 |
| auraMethod | 1 | 0 |
| auraRegisterEvent | 2 | 0 |
| categoryGroupVisibility | 2 | 1 |
| classAccess | 6 | 1 |
| customApplication | 2 | 1 |
| customLabel | 6 | 4 |
| customLabels | 2 | 1 |
| customMetadataRecord | 3 | 1 |
| customMetadataValue | 3 | 1 |
| customPermission | 4 | 1 |
| customPermissionAccess | 2 | 0 |
| customTab | 3 | 1 |
| dashboard | 2 | 1 |
| emailTemplate | 2 | 1 |
| error | 3 | 0 |
| fieldPermission | 12 | 6 |
| flexiPage | 2 | 1 |
| flexiPageComponent | 9 | 2 |
| flexiPageField | 3 | 1 |
| flexiPageRegion | 6 | 3 |
| flow | 4 | 2 |
| flowActionCall | 2 | 0 |
| flowAssignment | 3 | 1 |
| flowDecision | 2 | 1 |
| flowFormula | 2 | 1 |
| flowRecordLookup | 1 | 1 |
| flowRecordUpdate | 2 | 1 |
| flowRule | 3 | 2 |
| flowScreen | 2 | 1 |
| flowScreenField | 5 | 2 |
| flowStart | 4 | 1 |
| flowSubflow | 1 | 1 |
| flowVariable | 2 | 1 |
| globalValue | 6 | 3 |
| globalValueSet | 2 | 1 |
| group | 2 | 1 |
| labelTranslation | 4 | 3 |
| layout | 5 | 2 |
| layoutAction | 5 | 2 |
| layoutAssignment | 4 | 2 |
| layoutItem | 22 | 7 |
| layoutRelatedList | 2 | 1 |
| layoutSection | 8 | 1 |
| loginFlow | 2 | 1 |
| loginHours | 2 | 1 |
| loginIpRange | 3 | 1 |
| mutingPermissionSet | 2 | 1 |
| namedCredential | 2 | 1 |
| namedCredentialParameter | 2 | 1 |
| objectPermission | 13 | 4 |
| permissionSet | 4 | 1 |
| permissionSetGroup | 2 | 1 |
| profile | 2 | 1 |
| profileActionOverride | 2 | 0 |
| queue | 2 | 1 |
| queueSobject | 3 | 1 |
| quickAction | 2 | 1 |
| quickActionFieldOverride | 2 | 1 |
| recordTypeVisibility | 2 | 1 |
| remoteSiteSetting | 2 | 1 |
| report | 2 | 1 |
| reportColumn | 6 | 2 |
| requiredPermission | 1 | 0 |
| role | 2 | 1 |
| sharingCriteriaRule | 3 | 2 |
| sharingOwnerRule | 1 | 0 |
| sharingRules | 2 | 1 |
| standardValue | 5 | 2 |
| standardValueSet | 2 | 1 |
| staticResource | 2 | 1 |
| tabSetting | 2 | 0 |
| tabTranslation | 2 | 0 |
| tabVisibility | 2 | 1 |
| translations | 2 | 1 |
| userPermission | 8 | 2 |
| visualforceAttribute | 3 | 2 |
| visualforceMarkup | 4 | 2 |
| workflow | 2 | 1 |
| workflowAlert | 1 | 0 |
| workflowFieldUpdate | 2 | 1 |
| workflowRule | 2 | 1 |
