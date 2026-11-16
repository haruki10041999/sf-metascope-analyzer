import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { FlowParser, PermissionSetParser } from '../../src/analyzer/parser/Metadata';
import { analyzeMetadataRefs } from '../../src/analyzer/processor/Metadata/refs';
import {
    type MetadataWalkContext,
    composeMetadataVisitors,
    initialMetadataWalkContext,
    metadataValuesOf,
    walkMetadataJson,
} from '../../src/analyzer/processor/Metadata/walker';
import type { FlowJson } from '../../src/analyzer/types';

// メタデータの共通の走査 (段階 M1) と、参照の取り出しを 1 本にしたもの (段階 M2)

const NS = 'xmlns="http://soap.sforce.com/2006/04/metadata"';
const keys = (objectKey: string) => ({ objectKey, sourceKey: `${objectKey}-source` });

describe('walkMetadataJson (メタデータの共通の走査)', () => {
    const json = {
        kind: 'workflow',
        fullName: 'Invoice__c',
        sourceKeys: keys('root'),
        rules: [
            {
                kind: 'workflowRule',
                fullName: 'Notify',
                sourceKeys: keys('rule'),
                // 値の木 (kind も sourceKeys もない)
                criteriaItems: [{ field: 'Invoice__c.Status__c', value: 'Sent' }],
                formula: 'Amount__c > 0',
            },
        ],
    };

    it('visits kinds, records and string values with the member, statement, object and path', () => {
        const seen: string[] = [];
        const show = (context: MetadataWalkContext) =>
            `${context.member ?? '-'}|${context.statement?.objectKey ?? '-'}|${context.object ?? '-'}|${context.path.join('.')}`;
        walkMetadataJson(
            json,
            {
                kinds: {
                    workflowRule: (node, c) => void seen.push(`kind ${node.fullName} ${show(c)}`),
                },
                value: (key, value, _owner, c) => {
                    if (key === 'field' || key === 'formula')
                        seen.push(`value ${key}=${value} ${show(c)}`);
                },
            },
            initialMetadataWalkContext('workflow', json, 'Invoice__c'),
        );
        assert.deepEqual(seen, [
            'kind Notify Notify|rule|Invoice__c|rules',
            // 値の木の中は、直前の境界ノード (ルール) とメンバーを引き継ぐ
            'value field=Invoice__c.Status__c Notify|rule|Invoice__c|rules.criteriaItems',
            'value formula=Amount__c > 0 Notify|rule|Invoice__c|rules',
        ]);
    });

    it('composes visitors and skips the children when one returns false', () => {
        const kinds: string[] = [];
        const values: string[] = [];
        walkMetadataJson(
            json,
            composeMetadataVisitors(
                { kinds: { workflowRule: () => false } },
                { record: (node) => void kinds.push(String(node.kind ?? 'value')) },
                { value: (key) => void values.push(key) },
            ),
            initialMetadataWalkContext('workflow', json, 'Invoice__c'),
        );
        assert.deepEqual(kinds, ['workflow', 'workflowRule']);
        assert.deepEqual(values, ['kind', 'fullName']);
    });

    it('collects the values of a property from a value tree', () => {
        assert.deepEqual(
            metadataValuesOf({ a: [{ role: 'CEO' }, { b: { role: 'CFO' } }] }, 'role'),
            ['CEO', 'CFO'],
        );
    });
});

describe('analyzeMetadataRefs (参照の取り出しを 1 本に)', () => {
    it('makes one grants reference for pageAccesses (was uses + grants)', () => {
        const permissionSet = PermissionSetParser.parseSource(
            'permissionsets/X.permissionset-meta.xml',
            `<PermissionSet ${NS}>
                <label>X</label>
                <pageAccesses><apexPage>InvoicePrint</apexPage><enabled>true</enabled></pageAccesses>
            </PermissionSet>`,
        );
        const refs = analyzeMetadataRefs(
            'permissionSet',
            permissionSet.result.base as Record<string, unknown>,
            'X',
        ).filter((r) => r.target === 'InvoicePrint');
        assert.deepEqual(
            refs.map((r) => `${r.kind} ${r.refType}:${r.target}`),
            ['grants apexPage:InvoicePrint'],
        );
    });

    it('makes one reads reference for a field in a Flow formula (was uses + reads)', () => {
        const flow = FlowParser.parseSource(
            'flows/F.flow-meta.xml',
            `<Flow ${NS}>
                <formulas>
                    <name>Is_Big</name>
                    <dataType>Boolean</dataType>
                    <expression>{!$Record.Amount__c} &gt; 100</expression>
                </formulas>
                <label>F</label>
                <processType>AutoLaunchedFlow</processType>
                <start>
                    <object>Invoice__c</object>
                    <recordTriggerType>Update</recordTriggerType>
                    <triggerType>RecordAfterSave</triggerType>
                </start>
                <status>Active</status>
            </Flow>`,
        );
        const json = flow.result.base as FlowJson;
        const refs = analyzeMetadataRefs(
            'flow',
            json as unknown as Record<string, unknown>,
            'F',
        ).filter((r) => r.target === 'Invoice__c.Amount__c');
        assert.deepEqual(
            refs.map((r) => `${r.kind} ${r.refType}:${r.target} ${r.member}`),
            ['reads field:Invoice__c.Amount__c F.Is_Big'],
        );
    });

    it('uses the definition type names as the vocabulary (apexPage / aura / customLabel)', () => {
        const refs = analyzeMetadataRefs(
            'customTab',
            { kind: 'customTab', fullName: 'T', page: 'P', auraComponent: 'c:cmp' },
            'T',
        ).map((r) => `${r.refType}:${r.target}`);
        assert.deepEqual(refs, ['aura:cmp', 'apexPage:P']);
    });
});
