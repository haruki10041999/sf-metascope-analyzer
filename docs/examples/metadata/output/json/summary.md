# オブジェクトの parse の結果

`run-parse.ts` が出力する。

## before

| オブジェクト | dataType | fields | validationRules | recordTypes | listViews | fieldSets | compactLayouts | webLinks | businessProcesses | sharingReasons | 読めなかったファイル |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account | object | 1 | 0 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | - |
| App_Setting__mdt | object | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - |
| Broken__c | object | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - |
| Invoice_Line__c | object | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - |
| Invoice__c | object | 6 | 1 | 1 | 0 | 1 | 0 | 1 | 0 | 1 | - |
| Legacy_Item__c | object | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - |
| Opportunity | object | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | - |

### 項目 (analysis)

- **Account** (standard): Tier__c: String
- **App_Setting__mdt** (customMetadata): Value__c: String
- **Broken__c** (custom): Code__c: String
- **Invoice_Line__c** (custom): Invoice__c: Reference → Invoice__c (MasterDetail), Product__c: Reference → Product2 (Lookup), Quantity__c: Integer
- **Invoice__c** (custom): Account__c: Reference → Account (Lookup), Amount__c: Double, Due_Date__c: Date, Is_Overdue__c: Boolean, Note__c: String, Status__c: String
- **Legacy_Item__c** (custom): Invoice__c: Reference → Invoice__c (Lookup)
- **Opportunity** (standard): （項目のファイルなし）

### 参照関係 (analysis)

- Invoice_Line__c.Invoice__c → Invoice__c (MasterDetail)
- Invoice_Line__c.Product__c → Product2 (Lookup)
- Invoice__c.Account__c → Account (Lookup)
- Legacy_Item__c.Invoice__c → Invoice__c (Lookup)

### 翻訳 (objectTranslations)

| 翻訳 | dataType | fields | caseValues | recordTypes | validationRules | webLinks | quickActions | fieldSets | sharingReasons | standardFields | layouts | 読めなかったファイル |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Broken__c-ja | objectTranslation | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - |
| Invoice__c-en_US | objectTranslation | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - |
| Invoice__c-ja | objectTranslation | 5 | 0 | 1 | 1 | 1 | 0 | 1 | 0 | 0 | 1 | - |
| Legacy_Item__c-ja | objectTranslation | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - |

## after

| オブジェクト | dataType | fields | validationRules | recordTypes | listViews | fieldSets | compactLayouts | webLinks | businessProcesses | sharingReasons | 読めなかったファイル |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account | object | 1 | 1 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | - |
| App_Setting__mdt | object | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - |
| Broken__c | object | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | Broken__c/fields/Code__c.field-meta.xml L5: XML_SYNTAX </length> expected but </lenght> found<br>Broken__c/fields/Misplaced__c.field-meta.xml L2: UNEXPECTED_ROOT <CustomField> expected but <ValidationRule> found |
| Invoice_Line__c | object | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - |
| Invoice__c | object | 6 | 2 | 1 | 0 | 1 | 0 | 1 | 0 | 1 | - |
| Opportunity | object | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | - |
| Payment__c | object | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - |

### 項目 (analysis)

- **Account** (standard): Tier__c: String
- **App_Setting__mdt** (customMetadata): Value__c: String
- **Broken__c** (custom): （項目のファイルなし）
- **Invoice_Line__c** (custom): Invoice__c: Reference → Invoice__c (MasterDetail), Product__c: Reference → Product2 (Lookup), Quantity__c: Double
- **Invoice__c** (custom): Account__c: Reference → Account (Lookup), Amount__c: Double, Approved__c: Boolean, Due_Date__c: Date, Is_Overdue__c: Boolean, Status__c: String
- **Opportunity** (standard): （項目のファイルなし）
- **Payment__c** (custom): Invoice__c: Reference → Invoice__c (Lookup), Paid_At__c: DateTime

### 参照関係 (analysis)

- Invoice_Line__c.Invoice__c → Invoice__c (MasterDetail)
- Invoice_Line__c.Product__c → Product2 (Lookup)
- Invoice__c.Account__c → Account (Lookup)
- Payment__c.Invoice__c → Invoice__c (Lookup)

### 翻訳 (objectTranslations)

| 翻訳 | dataType | fields | caseValues | recordTypes | validationRules | webLinks | quickActions | fieldSets | sharingReasons | standardFields | layouts | 読めなかったファイル |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account-ja | objectTranslation | 2 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | - |
| Broken__c-ja | objectTranslation | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | Broken__c-ja/Code__c.fieldTranslation-meta.xml L3: XML_SYNTAX </label> expected but </lable> found |
| Invoice__c-en_US | objectTranslation | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - |
| Invoice__c-ja | objectTranslation | 5 | 0 | 1 | 1 | 1 | 0 | 1 | 0 | 0 | 1 | - |

