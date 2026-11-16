import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MetadataParser } from '../../src/analyzer/parser/Metadata/parser';
import {
    type CustomObjectJson,
    type ListViewJson,
    criterionTextsOf,
    filterLogicTextOf,
    parseFilterLogic,
} from '../../src/analyzer/types';

// 条件の行の共通の形と booleanFilter の木 (docs/json-redesign-plan.md の段階 M5。docs/metadata-json-review.md 5.2)

const NS = 'xmlns="http://soap.sforce.com/2006/04/metadata"';

const objectOf = (files: Record<string, string>) =>
    MetadataParser.parseObjectSource(
        'Invoice__c',
        Object.entries(files).map(([relative, source]) => ({
            fileName: relative.split('/').pop()!,
            filePath: `Invoice__c/${relative}`,
            source,
        })),
    );

const OBJECT = `<CustomObject ${NS}><label>Invoice</label></CustomObject>`;

const LIST_VIEW = (booleanFilter: string) => `<ListView ${NS}>
    <fullName>Open</fullName>
    <booleanFilter>${booleanFilter}</booleanFilter>
    <filterScope>Everything</filterScope>
    <filters><field>Status__c</field><operation>equals</operation><value>Open,Draft</value></filters>
    <filters><field>Account__r.Name</field><operation>contains</operation><value>Acme</value></filters>
    <filters><field>Amount__c</field><operation>greaterThan</operation><value>0</value></filters>
    <label>Open</label>
</ListView>`;

describe('条件の行と booleanFilter (段階 M5)', () => {
    it('booleanFilter を木にする (AND は OR より強く、同じ演算子の並びは 1 つにまとめる)', () => {
        assert.deepEqual(parseFilterLogic('1 AND (2 OR NOT 3) and 4'), {
            type: 'and',
            operands: [
                { type: 'row', index: 1 },
                {
                    type: 'or',
                    operands: [
                        { type: 'row', index: 2 },
                        { type: 'not', operand: { type: 'row', index: 3 } },
                    ],
                },
                { type: 'row', index: 4 },
            ],
        });
        assert.deepEqual(parseFilterLogic('1 OR 2 AND 3'), {
            type: 'or',
            operands: [
                { type: 'row', index: 1 },
                {
                    type: 'and',
                    operands: [
                        { type: 'row', index: 2 },
                        { type: 'row', index: 3 },
                    ],
                },
            ],
        });
        assert.equal(filterLogicTextOf(parseFilterLogic('(1 OR 2) AND 3')), '(1 OR 2) AND 3');
        assert.throws(() => parseFilterLogic('1 AND'));
        assert.throws(() => parseFilterLogic('(1 OR 2'));
    });

    it('リストビューの検索条件は criterion の並び、booleanFilter は木', () => {
        const result = objectOf({
            'Invoice__c.object-meta.xml': OBJECT,
            'listViews/Open.listView-meta.xml': LIST_VIEW('1 AND (2 OR 3)'),
        });
        const object = result.result.base as CustomObjectJson;
        const listView = object.listViews![0] as ListViewJson;
        assert.deepEqual(
            listView.filters!.map((f) => [f.kind, f.operator, criterionTextsOf(f)]),
            [
                ['criterion', 'equals', { left: 'Status__c', right: 'Open,Draft' }],
                ['criterion', 'contains', { left: 'Account__r.Name', right: 'Acme' }],
                ['criterion', 'greaterThan', { left: 'Amount__c', right: '0' }],
            ],
        );
        assert.equal(filterLogicTextOf(listView.booleanFilter!), '1 AND (2 OR 3)');
        assert.deepEqual(result.resolvedError, []);
    });

    it('読めない booleanFilter は文字列のまま持ち、resolvedError に FILTER_LOGIC_SYNTAX を出す', () => {
        const result = objectOf({
            'Invoice__c.object-meta.xml': OBJECT,
            'listViews/Open.listView-meta.xml': LIST_VIEW('1 AND (2 OR'),
        });
        const object = result.result.base as CustomObjectJson;
        assert.equal((object.listViews![0] as ListViewJson).booleanFilter, '1 AND (2 OR');
        assert.deepEqual(
            result.resolvedError.map((e) => [e.code, e.contextType]),
            [['FILTER_LOGIC_SYNTAX', 'booleanFilter']],
        );
    });

    it('参照の絞り込みの右辺が別の項目なら field (数式の名前)', () => {
        const result = objectOf({
            'Invoice__c.object-meta.xml': OBJECT,
            'fields/Account__c.field-meta.xml': `<CustomField ${NS}>
                <fullName>Account__c</fullName>
                <lookupFilter><active>true</active>
                    <filterItems><field>Account.OwnerId</field><operation>equals</operation><valueField>$User.Id</valueField></filterItems>
                </lookupFilter>
                <referenceTo>Account</referenceTo><type>Lookup</type>
            </CustomField>`,
        });
        const object = result.result.base as CustomObjectJson;
        const field = object.fields!.find((f) => f.apiName === 'Account__c')!;
        const [item] = field.lookupFilter!.filterItems;
        assert.equal(item!.right?.type, 'field');
        assert.deepEqual(criterionTextsOf(item!), { left: 'Account.OwnerId', right: '$User.Id' });
    });
});

describe('レコードタイプ・ビジネスプロセスの選択リスト値 (段階 M8)', () => {
    it('使える選択リスト値は picklistValueSelection (kind と位置を持つ)', () => {
        const result = objectOf({
            'Invoice__c.object-meta.xml': OBJECT,
            'recordTypes/Std.recordType-meta.xml': `<RecordType ${NS}>
                <fullName>Std</fullName><active>true</active><label>Std</label>
                <picklistValues><picklist>Status__c</picklist>
                    <values><fullName>Open</fullName><default>true</default></values>
                    <values><fullName>Paid</fullName><default>false</default></values>
                </picklistValues>
            </RecordType>`,
        });
        const object = result.result.base as CustomObjectJson;
        const values = object.recordTypes![0]!.picklistValues![0]!.values!;
        assert.deepEqual(
            values.map((v) => [v.kind, v.fullName, v.default, !!v.sourceKeys]),
            [
                ['picklistValueSelection', 'Open', true, true],
                ['picklistValueSelection', 'Paid', false, true],
            ],
        );
    });
});
