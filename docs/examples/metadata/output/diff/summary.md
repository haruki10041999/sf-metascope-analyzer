# オブジェクトの Diff の結果

`run-diff.ts` が出力する。unchanged 以外の差分だけを並べる。

## Account

- オブジェクト: **changed**（dataType: "object"）

- **changed** object Account (key) — Account/Account.object-meta.xml L2
  - **changed** enableHistory: true → false
  - **changed** field Tier__c (key) — Account/fields/Tier__c.field-meta.xml L2
    - **changed** label: "Tier" → "Customer Tier"
    - **removed** required: false
    - **added** picklistValue Platinum — Account/fields/Tier__c.field-meta.xml L10
  - **added** validationRules
    - validationRule Name_Required — Account/validationRules/Name_Required.validationRule-meta.xml L2
  - **changed** listView AllAccounts (key) — Account/listViews/AllAccounts.listView-meta.xml L2
    - **moved** columns (identical): "ACCOUNT.TYPE" (1 → 2)

## App_Setting__mdt

- オブジェクト: **unchanged**（dataType: "object"）

（中身の差分なし）

## Broken__c

- オブジェクト: **changed**（dataType: "object"）
- 読めなかったファイル **added**: Broken__c/fields/Code__c.field-meta.xml L5 </length> expected but </lenght> found
- 読めなかったファイル **added**: Broken__c/fields/Misplaced__c.field-meta.xml L2 <CustomField> expected but <ValidationRule> found

- **changed** object Broken__c (key) — Broken__c/Broken__c.object-meta.xml L2
  - **removed** field Code__c — Broken__c/fields/Code__c.field-meta.xml L2
  - **added** error — Broken__c/fields/Code__c.field-meta.xml L5
  - **added** error — Broken__c/fields/Misplaced__c.field-meta.xml L2

## Invoice__c

- オブジェクト: **changed**（dataType: "object"）

- **changed** object Invoice__c (key) — Invoice__c/Invoice__c.object-meta.xml L2
  - **changed** field Account__c (key) — Invoice__c/fields/Account__c.field-meta.xml L2
    - **changed** deleteConstraint: "SetNull" → "Restrict"
  - **changed** field Amount__c (key) — Invoice__c/fields/Amount__c.field-meta.xml L2
    - **added** inlineHelpText: "税込みの金額"
    - **changed** precision: 18 → 16
  - **removed** field Note__c — Invoice__c/fields/Note__c.field-meta.xml L2
  - **changed** field Status__c (key) — Invoice__c/fields/Status__c.field-meta.xml L2
    - **removed** picklistValue Sent — Invoice__c/fields/Status__c.field-meta.xml L15
    - **changed** picklistValue Paid (key) — Invoice__c/fields/Status__c.field-meta.xml L15
      - **changed** label: "Paid" → "Paid (Closed)"
    - **added** picklistValue Overdue — Invoice__c/fields/Status__c.field-meta.xml L20
  - **added** field Approved__c — Invoice__c/fields/Approved__c.field-meta.xml L2
  - **changed** validationRule Amount_Positive (key) — Invoice__c/validationRules/Amount_Positive.validationRule-meta.xml L2
    - **changed** errorMessage: "Amount must be positive." → "Amount must be greater than zero."
  - **added** validationRule Due_Date_Required — Invoice__c/validationRules/Due_Date_Required.validationRule-meta.xml L2
  - **changed** recordType Standard (key) — Invoice__c/recordTypes/Standard.recordType-meta.xml L2
    - **changed** recordTypePicklist Status__c (key) — Invoice__c/recordTypes/Standard.recordType-meta.xml L6
      - **removed** values Sent: {"fullName":"Sent","default":false}
      - **added** values Overdue: {"fullName":"Overdue","default":false}
  - **changed** fieldSet Summary (key) — Invoice__c/fieldSets/Summary.fieldSet-meta.xml L2
    - **moved** displayedFields (identical)
  - **changed** webLink Send_Invoice (key) — Invoice__c/webLinks/Send_Invoice.webLink-meta.xml L2
    - **changed** url: "/apex/SendInvoice?id={!Invoice__c.Id}" → "/lightning/cmp/c__sendInvoice?c__id={!Invoice__c.Id}"

## Invoice_Line__c

- オブジェクト: **changed**（dataType: "object"）

- **changed** object Invoice_Line__c (key) — Invoice_Line__c/Invoice_Line__c.object-meta.xml L2
  - **changed** field Quantity__c (key) — Invoice_Line__c/fields/Quantity__c.field-meta.xml L2
    - **changed** scale: 0 → 2

## Legacy_Item__c

- オブジェクト: **removed**（dataType: {"before":"object"}）

## Payment__c

- オブジェクト: **added**（dataType: {"after":"object"}）

# オブジェクトの翻訳

## Account-ja

- 翻訳: **added**（dataType: {"after":"objectTranslation"}）

## Broken__c-ja

- 翻訳: **changed**（dataType: "objectTranslation"）
- 読めなかったファイル **added**: Broken__c-ja/Code__c.fieldTranslation-meta.xml L3 </label> expected but </lable> found

- **changed** objectTranslation (key) — Broken__c-ja/Broken__c-ja.objectTranslation-meta.xml L2
  - **removed** fieldTranslation Code__c — Broken__c-ja/Code__c.fieldTranslation-meta.xml L2
  - **added** error — Broken__c-ja/Code__c.fieldTranslation-meta.xml L3

## Invoice__c-en_US

- 翻訳: **unchanged**（dataType: "objectTranslation"）

（中身の差分なし）

## Invoice__c-ja

- 翻訳: **changed**（dataType: "objectTranslation"）

- **changed** objectTranslation (key) — Invoice__c-ja/Invoice__c-ja.objectTranslation-meta.xml L2
  - **changed** fieldTranslation Account__c (key) — Invoice__c-ja/Account__c.fieldTranslation-meta.xml L2
    - **changed** relationshipLabel: "請求書" → "請求書一覧"
  - **changed** fieldTranslation Status__c (key) — Invoice__c-ja/Status__c.fieldTranslation-meta.xml L2
    - **changed** label: "ステータス" → "状態"
    - **removed** picklistValueTranslation Sent — Invoice__c-ja/Status__c.fieldTranslation-meta.xml L9

## Legacy_Item__c-ja

- 翻訳: **removed**（dataType: {"before":"objectTranslation"}）

