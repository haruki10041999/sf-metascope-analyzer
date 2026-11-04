# 翻訳の網羅

`run-diff.ts` が出力する。after の翻訳を同じ時点のオブジェクトと突き合わせ、before と比べて古い翻訳も見る（`analyzeTranslationCoverages`）。翻訳ありのものは件数だけを書き、それ以外を一覧にする。

| 翻訳 | 翻訳あり | 未翻訳 | 翻訳元と同じ | 宙に浮いた翻訳 | 古い翻訳 |
| --- | --- | --- | --- | --- | --- |
| Account-ja | 6 | 1 | 0 | 0 | 0 |
| Broken__c-ja | 0 | 0 | 0 | 0 | 0 |
| Invoice__c-en_US | 0 | 16 | 0 | 0 | 0 |
| Invoice__c-ja | 8 | 5 | 1 | 1 | 2 |

## Account-ja

- **未翻訳** picklistValue `Tier__c.Bronze`: Bronze → -

## Broken__c-ja

（指摘なし）

## Invoice__c-en_US

- **未翻訳** fieldLabel `Account__c`: Account → -
- **未翻訳** fieldLabel `Amount__c`: Amount → -
- **未翻訳** fieldLabel `Approved__c`: Approved → -
- **未翻訳** fieldLabel `Due_Date__c`: Due Date → -
- **未翻訳** fieldLabel `Is_Overdue__c`: Is Overdue → -
- **未翻訳** fieldLabel `Status__c`: Status → -
- **未翻訳** fieldHelp `Amount__c`: 税込みの金額 → -
- **未翻訳** relationshipLabel `Account__c`: Invoices → -
- **未翻訳** picklistValue `Status__c.Draft`: Draft → -
- **未翻訳** picklistValue `Status__c.Overdue`: Overdue → -
- **未翻訳** picklistValue `Status__c.Paid`: Paid (Closed) → -
- **未翻訳** validationRule `Amount_Positive`: Amount must be greater than zero. → -
- **未翻訳** validationRule `Due_Date_Required`: Due date is required. → -
- **未翻訳** recordType `Standard`: Standard → -
- **未翻訳** webLink `Send_Invoice`: Send Invoice → -
- **未翻訳** fieldSet `Summary`: Summary → -

## Invoice__c-ja

- **未翻訳** fieldLabel `Approved__c`: Approved → -
- **翻訳元と同じ** fieldLabel `Due_Date__c`: Due Date → Due Date
- **未翻訳** fieldLabel `Is_Overdue__c`: Is Overdue → -
- **宙に浮いた翻訳** fieldLabel `Note__c`: - → メモ
- **未翻訳** fieldHelp `Amount__c`: 税込みの金額 → -
- **未翻訳** picklistValue `Status__c.Overdue`: Overdue → -
- **古い翻訳** picklistValue `Status__c.Paid`: Paid (Closed) → 支払済み
- **古い翻訳** validationRule `Amount_Positive`: Amount must be greater than zero. → 金額は正の値にしてください。
- **未翻訳** validationRule `Due_Date_Required`: Due date is required. → -

