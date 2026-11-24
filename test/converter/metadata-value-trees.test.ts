import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { FlowParser } from '../../src/analyzer/parser/Metadata';
import {
    ApprovalProcessParser,
    QuickActionParser,
    SharingRulesParser,
} from '../../src/analyzer/parser/Metadata/record';
import { analyzeMetadataRefs } from '../../src/analyzer/processor/Metadata/refs';
import { analyzeFlowRefs } from '../../src/analyzer/processor/Metadata/flowRefs';
import {
    type CriterionJson,
    type FlowJson,
    type FxJson,
    criterionTextsOf,
    filterLogicTextOf,
} from '../../src/analyzer/types';
import { p1Shape } from './lwcShape';

// 値の木の中の条件の行・数式・テンプレート (docs/json-redesign-plan.md の段階 M7)

const NS = 'xmlns="http://soap.sforce.com/2006/04/metadata"';

describe('値の木の中の条件の行・数式 (段階 M7)', () => {
    const flow = FlowParser.parseSource(
        'flows/F.flow-meta.xml',
        `<Flow ${NS}>
            <assignments><name>Set</name><label>Set</label>
                <assignmentItems><assignToReference>total</assignToReference><operator>Assign</operator>
                    <value><formulaExpression>{!$Record.Amount__c} * 2</formulaExpression></value></assignmentItems>
            </assignments>
            <decisions><name>Check</name><label>Check</label>
                <rules><name>Big</name><conditionLogic>1 OR 2</conditionLogic>
                    <conditions><leftValueReference>$Record.Amount__c</leftValueReference><operator>GreaterThan</operator>
                        <rightValue><numberValue>100.0</numberValue></rightValue></conditions>
                    <conditions><leftValueReference>total</leftValueReference><operator>EqualTo</operator>
                        <rightValue><elementReference>limit</elementReference></rightValue></conditions>
                    <label>Big</label></rules>
            </decisions>
            <label>F</label>
            <recordLookups><name>Get</name><label>Get</label><object>Account</object>
                <filters><field>Industry</field><operator>EqualTo</operator><value><stringValue>Bank</stringValue></value></filters>
            </recordLookups>
            <start><object>Invoice__c</object></start>
        </Flow>`,
    );
    const json = flow.result.base as FlowJson;

    it('Flow の conditions・filters は criterion、conditionLogic は木', () => {
        const rule = json.elements!.find((e) => e.name === 'Check')!.rules![0]!;
        const conditions = rule.properties!.conditions as unknown as CriterionJson[];
        assert.deepEqual(
            conditions.map((c) => [c.kind, c.operator, c.right?.type, criterionTextsOf(c)]),
            [
                [
                    'criterion',
                    'GreaterThan',
                    'value',
                    { left: '$Record.Amount__c', right: '100.0' },
                ],
                ['criterion', 'EqualTo', 'reference', { left: 'total', right: 'limit' }],
            ],
        );
        assert.equal(filterLogicTextOf(rule.properties!.conditionLogic as never), '1 OR 2');
        const lookup = json.elements!.find((e) => e.name === 'Get')!;
        const [filter] = lookup.properties!.filters as unknown as CriterionJson[];
        assert.deepEqual(p1Shape(filter!.right), {
            type: 'value',
            value: 'Bank',
            valueType: 'stringValue',
        });
        assert.deepEqual(flow.resolvedError, []);
    });

    it('formulaExpression の値は数式の木', () => {
        const assignment = json.elements!.find((e) => e.name === 'Set')!;
        const [item] = assignment.properties!.assignmentItems as unknown as {
            value: { type: string; value: FxJson };
        }[];
        assert.equal(item!.value.type, 'formulaExpression');
        assert.equal(item!.value.value.kind, 'fxBinary');
    });

    it('参照は条件の行と数式の木から取る (以前の文字列のときと同じ)', () => {
        const refs = analyzeFlowRefs(json).map((r) => `${r.element} ${r.refType}:${r.target}`);
        for (const expected of [
            'Set field:Invoice__c.Amount__c',
            'Set element:total',
            'Check field:Invoice__c.Amount__c',
            'Check element:total',
            'Check element:limit',
            'Get object:Account',
            'Get field:Account.Industry',
        ]) {
            assert.ok(refs.includes(expected), expected);
        }
    });

    it('承認の条件の criteriaItems・formula も型の JSON にする', () => {
        const result = ApprovalProcessParser.parseSource(
            'approvalProcesses/Invoice__c.Big.approvalProcess-meta.xml',
            `<ApprovalProcess ${NS}>
                <active>true</active>
                <entryCriteria>
                    <booleanFilter>1 AND 2</booleanFilter>
                    <criteriaItems><field>Invoice__c.Amount__c</field><operation>greaterThan</operation><value>100</value></criteriaItems>
                    <criteriaItems><field>Invoice__c.Status__c</field><operation>equals</operation><value>Open</value></criteriaItems>
                </entryCriteria>
                <label>Big</label>
            </ApprovalProcess>`,
        );
        const entry = (result.result.base as unknown as { entryCriteria: Record<string, unknown> })
            .entryCriteria;
        const items = entry.criteriaItems as CriterionJson[];
        assert.deepEqual(
            items.map((c) => criterionTextsOf(c).left),
            ['Invoice__c.Amount__c', 'Invoice__c.Status__c'],
        );
        assert.equal(filterLogicTextOf(entry.booleanFilter as never), '1 AND 2');
    });
});

describe('値の木の大事なところの kind と、対象のオブジェクト (段階 M8)', () => {
    it('Flow の引数・割り当て・スケジュールの経路は kind と位置を持ち、変数の型はノードの直下', () => {
        const flow = FlowParser.parseSource(
            'flows/G.flow-meta.xml',
            `<Flow ${NS}>
                <actionCalls><name>Send</name><label>Send</label><actionName>Mailer</actionName><actionType>apex</actionType>
                    <inputParameters><name>recordId</name><value><elementReference>$Record.Id</elementReference></value></inputParameters>
                    <outputParameters><assignToReference>result</assignToReference><name>ok</name></outputParameters>
                </actionCalls>
                <label>G</label>
                <start><object>Invoice__c</object>
                    <scheduledPaths><name>Later</name><offsetNumber>1</offsetNumber><offsetUnit>Days</offsetUnit><timeSource>RecordTriggerEvent</timeSource></scheduledPaths>
                </start>
                <variables><name>acc</name><dataType>SObject</dataType><isCollection>false</isCollection>
                    <isInput>true</isInput><isOutput>false</isOutput><objectType>Account</objectType></variables>
            </Flow>`,
        );
        const json = flow.result.base as FlowJson;
        const action = json.elements!.find((e) => e.name === 'Send')!;
        const kinds = (value: unknown) =>
            (value as { kind: string; sourceKeys?: unknown }[]).map((v) => [
                v.kind,
                !!v.sourceKeys,
            ]);
        assert.deepEqual(kinds(action.properties!.inputParameters), [['flowParameter', true]]);
        assert.deepEqual(kinds(action.properties!.outputParameters), [['flowParameter', true]]);
        assert.deepEqual(kinds(json.start!.properties!.scheduledPaths), [
            ['flowScheduledPath', true],
        ]);
        const variable = json.resources!.find((r) => r.name === 'acc')!;
        assert.deepEqual(
            [
                variable.dataType,
                variable.objectType,
                variable.isInput,
                variable.isOutput,
                variable.isCollection,
            ],
            ['SObject', 'Account', true, false, false],
        );
        assert.equal(variable.properties, undefined);
        const refs = analyzeFlowRefs(json).map((r) => `${r.element} ${r.refType}:${r.target}`);
        assert.ok(refs.includes('acc object:Account'));
        assert.ok(refs.includes('Send apexClass:Mailer'));
    });

    it('共有ルールの共有先は kind と位置を持つ (参照は今までどおり)', () => {
        const result = SharingRulesParser.parseSource(
            'sharingRules/Invoice__c.sharingRules-meta.xml',
            `<SharingRules ${NS}>
                <sharingCriteriaRules><fullName>Open</fullName><accessLevel>Read</accessLevel><label>Open</label>
                    <sharedTo><group>Finance</group></sharedTo>
                    <criteriaItems><field>Status__c</field><operation>equals</operation><value>Open</value></criteriaItems>
                </sharingCriteriaRules>
            </SharingRules>`,
        );
        const json = result.result.base as unknown as {
            sharingCriteriaRules: { sharedTo: { kind: string } }[];
        };
        assert.equal(json.sharingCriteriaRules[0]!.sharedTo.kind, 'sharingPrincipals');
        const refs = analyzeMetadataRefs(
            'sharingRules',
            json as unknown as Record<string, unknown>,
            'Invoice__c',
        ).map((r) => `${r.refType}:${r.target}`);
        assert.ok(refs.includes('group:Finance'));
        assert.ok(refs.includes('field:Invoice__c.Status__c'));
    });

    it('クイックアクションの項目の数式は、対象のオブジェクトの項目として読む', () => {
        const result = QuickActionParser.parseSource(
            'quickActions/Invoice__c.Close.quickAction-meta.xml',
            `<QuickAction ${NS}>
                <fieldOverrides><field>Status__c</field><formula>IF(Amount__c &gt; 0, 'Closed', 'Void')</formula></fieldOverrides>
                <label>Close</label><optionsCreateFeedItem>false</optionsCreateFeedItem><type>Update</type>
            </QuickAction>`,
            { name: 'Invoice__c.Close' },
        );
        const refs = analyzeMetadataRefs(
            'quickAction',
            result.result.base as unknown as Record<string, unknown>,
            'Invoice__c.Close',
        ).map((r) => `${r.refType}:${r.target}`);
        assert.ok(refs.includes('field:Invoice__c.Amount__c'), refs.join(', '));
    });
});
