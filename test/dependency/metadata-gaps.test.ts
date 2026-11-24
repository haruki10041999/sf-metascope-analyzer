import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { FlexiPageParser, FlowParser } from '../../src/analyzer/parser/Metadata';
import { MetadataParser } from '../../src/analyzer/parser/Metadata/parser';
import { makeFlexiPageComponentDiff } from '../../src/analyzer/processor/Metadata/diff/page';
import { makeValueSetDiff } from '../../src/analyzer/processor/Metadata/diff/field';
import { analyzeFlowRefs } from '../../src/analyzer/processor/Metadata/flowRefs';
import type { UnitReference } from '../../src/analyzer/processor/dependency/types';
import { getUnitDependencies } from '../../src/analyzer/processor/dependency/units';
import type {
    CustomFieldJson,
    FlexiPageJson,
    FlowJson,
    RecordTypeJson,
    WebLinkJson,
} from '../../src/analyzer/types';

// どこにも出ずに消えていた情報と、参照にしていなかったもの (docs/json-redesign-plan.md の段階 M3。
// docs/metadata-json-review.md 3.1 の 3・7)

const NS = 'xmlns="http://soap.sforce.com/2006/04/metadata"';

const show = (r: UnitReference) => `${r.kind} ${r.refType}:${r.target} (${r.via})`;

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

describe('object: 消えていた情報と、レコードタイプ・ボタンの参照', () => {
    const result = objectOf({
        'Invoice__c.object-meta.xml': OBJECT,
        'fields/City__c.field-meta.xml': `<CustomField ${NS}>
            <fullName>City__c</fullName><label>City</label><type>Picklist</type>
            <valueSet>
                <controllingField>Region__c</controllingField>
                <valueSetDefinition><value><fullName>Tokyo</fullName><default>false</default><label>Tokyo</label></value></valueSetDefinition>
                <valueSettings><controllingFieldValue>West</controllingFieldValue><controllingFieldValue>East</controllingFieldValue><valueName>Tokyo</valueName></valueSettings>
            </valueSet>
        </CustomField>`,
        'recordTypes/Standard.recordType-meta.xml': `<RecordType ${NS}>
            <fullName>Standard</fullName><active>true</active><label>Standard</label>
            <businessProcess>Sales_Process</businessProcess>
            <compactLayoutAssignment>Summary</compactLayoutAssignment>
            <picklistValues><picklist>City__c</picklist><values><fullName>Tokyo</fullName><default>false</default></values></picklistValues>
            <unknownSetting>x</unknownSetting>
        </RecordType>`,
        'webLinks/Print.webLink-meta.xml': `<WebLink ${NS}>
            <fullName>Print</fullName><availability>online</availability><displayType>button</displayType>
            <height>600</height><linkType>page</linkType><masterLabel>Print</masterLabel>
            <openType>newWindow</openType><page>InvoicePrint</page><protected>false</protected>
        </WebLink>`,
    });
    const json = result.result.base as unknown as {
        fields: CustomFieldJson[];
        recordTypes: RecordTypeJson[];
        webLinks: WebLinkJson[];
    };

    it('reads the dependent picklist mapping (valueSettings) and diffs it as a set', () => {
        const valueSet = json.fields.find((f) => f.apiName === 'City__c')!.valueSet!;
        // 1 組はノード (metadata 8)。位置を除いて比べる
        const [setting] = valueSet.valueSettings!;
        assert.ok(setting);
        const { sourceKeys: _sourceKeys, ...body } = setting;
        assert.deepEqual(body, {
            kind: 'picklistValueSetting',
            valueName: 'Tokyo',
            controllingFieldValues: ['West', 'East'],
        });
        // 制御項目の値の並べ替えは差分にならない。値を足すと差分になる
        const reordered = {
            ...valueSet,
            valueSettings: [{ ...setting, controllingFieldValues: ['East', 'West'] }],
        };
        const statuses = (diff: unknown) =>
            (diff as { status: string }[]).map((item) => item.status);
        assert.deepEqual(statuses(makeValueSetDiff(valueSet, reordered).valueSettings), [
            'unchanged',
        ]);
        const added = {
            ...valueSet,
            valueSettings: [{ ...setting, controllingFieldValues: ['East', 'West', 'North'] }],
        };
        assert.deepEqual(statuses(makeValueSetDiff(valueSet, added).valueSettings), [
            'removed',
            'added',
        ]);
    });

    it('keeps unread elements of object children in skippedElements and reads webLink.page', () => {
        assert.deepEqual(json.recordTypes[0]!.skippedElements, ['unknownSetting']);
        assert.equal(json.webLinks[0]!.page, 'InvoicePrint');
        assert.deepEqual(json.webLinks[0]!.skippedElements, ['height']);
    });

    it('references the business process, compact layout and picklists of a record type, and the button page', () => {
        const refs = getUnitDependencies('object', result).references.map(show);
        for (const expected of [
            'uses businessProcess:Invoice__c.Sales_Process (recordType.businessProcess)',
            'uses compactLayout:Invoice__c.Summary (recordType.compactLayoutAssignment)',
            'uses field:Invoice__c.City__c (recordType.picklistValues)',
            'uses apexPage:InvoicePrint (webLink.page)',
        ]) {
            assert.ok(refs.includes(expected), expected);
        }
    });
});

describe('FlexiPage: 部品の属性の値の並び (valueList)', () => {
    it('reads valueList as valueLists and diffs it by name', () => {
        const parse = (fields: string) =>
            FlexiPageParser.parseSource(
                'flexipages/P.flexipage-meta.xml',
                `<FlexiPage ${NS}>
                    <flexiPageRegions>
                        <itemInstances><componentInstance>
                            <componentInstanceProperties><name>relatedListApiName</name><value>Contacts</value></componentInstanceProperties>
                            <componentInstanceProperties><name>fieldNames</name><valueList>${fields}</valueList></componentInstanceProperties>
                            <componentName>lst:dynamicRelatedList</componentName>
                            <identifier>list1</identifier>
                        </componentInstance></itemInstances>
                        <name>main</name><type>Region</type>
                    </flexiPageRegions>
                    <masterLabel>P</masterLabel><type>RecordPage</type>
                </FlexiPage>`,
            );
        const item = (value: string) => `<valueListItems><value>${value}</value></valueListItems>`;
        const before = (parse(item('Name') + item('Email')).result.base as FlexiPageJson)
            .components![0]!;
        const after = (parse(item('Name') + item('Phone')).result.base as FlexiPageJson)
            .components![0]!;
        assert.deepEqual(before.valueLists, { fieldNames: ['Name', 'Email'] });
        assert.deepEqual(before.attributes, { relatedListApiName: 'Contacts', fieldNames: '' });
        const diff = makeFlexiPageComponentDiff(before, after);
        assert.ok(diff.status === 'changed' && 'fields' in diff);
        assert.ok(diff.fields.valueLists?.fieldNames);
    });
});

describe('Flow: 使っているものは解析で出す', () => {
    const flow = FlowParser.parseSource(
        'flows/F.flow-meta.xml',
        `<Flow ${NS}>
            <dynamicChoiceSets><name>statuses</name><dataType>Picklist</dataType>
                <picklistField>Status__c</picklistField><picklistObject>Invoice__c</picklistObject></dynamicChoiceSets>
            <dynamicChoiceSets><name>accounts</name><dataType>String</dataType>
                <displayField>Name</displayField><object>Account</object><valueField>Id</valueField></dynamicChoiceSets>
            <label>F</label>
            <processType>AutoLaunchedFlow</processType>
            <start><object>Invoice__c</object><triggerType>RecordAfterSave</triggerType><recordTriggerType>Update</recordTriggerType>
                <filterFormula>ISCHANGED({!$Record.Amount__c})</filterFormula></start>
            <status>Active</status>
            <variables><name>acc</name><dataType>SObject</dataType><isCollection>false</isCollection>
                <isInput>false</isInput><isOutput>false</isOutput><objectType>Contact</objectType></variables>
        </Flow>`,
    );
    const json = flow.result.base as FlowJson;

    it('does not keep references in the JSON', () => {
        assert.ok(!JSON.stringify(json).includes('"references"'));
    });

    it('references the variable objectType and the dynamic choice sets', () => {
        const refs = analyzeFlowRefs(json).map((r) => `${r.element} ${r.refType}:${r.target}`);
        for (const expected of [
            'acc object:Contact',
            'statuses object:Invoice__c',
            'statuses field:Invoice__c.Status__c',
            'accounts object:Account',
            'accounts field:Account.Name',
            'accounts field:Account.Id',
        ]) {
            assert.ok(refs.includes(expected), expected);
        }
    });

    it('reads start.filterFormula as a formula (one reads reference, not uses + reads)', () => {
        const refs = getUnitDependencies('flow', flow)
            .references.filter((r) => r.target === 'Invoice__c.Amount__c')
            .map(show);
        assert.deepEqual(refs, ['reads field:Invoice__c.Amount__c (formula.filterFormula)']);
    });
});
