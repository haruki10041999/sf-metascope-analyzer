import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { repositoryOf } from '../../docs/examples/paths';
import {
    AuraParser,
    DuplicateRuleParser,
    FlowParser,
    LightningMessageChannelParser,
    MatchingRulesParser,
    PathAssistantParser,
    PermissionSetParser,
    PlatformEventChannelMemberParser,
    PlatformEventSubscriberConfigParser,
    ReportTypeParser,
    SettingsParser,
    WorkflowParser,
} from '../../src/analyzer/parser/Metadata';
import { MetadataParser } from '../../src/analyzer/parser/Metadata/parser';
import type { MetadataFileParseResult } from '../../src/analyzer/parser/Metadata/folder';
import { analyzeMetadataReferences } from '../../src/analyzer/processor/Metadata/referenceAnalysis';
import {
    type GraphUnit,
    buildDependencyGraph,
} from '../../src/analyzer/processor/dependency/graph';
import type { UnitReference } from '../../src/analyzer/processor/dependency/types';
import { getUnitDependencies } from '../../src/analyzer/processor/dependency/units';
import type { AuraBundleJson, FlowJson, SettingsJson } from '../../src/analyzer/types';
import { Repository, WorkingTree } from '../../src/analyzer/unit';

// メタデータの参照の残り (docs/json-gaps.md 5 章の 5・6): 権限の行・Flow のアクションと $Permission・
// レポートタイプの列・Aura のメッセージチャネル・オブジェクトの翻訳・単位がなかった種類

const NS = 'xmlns="http://soap.sforce.com/2006/04/metadata"';

const show = (r: UnitReference) => `${r.kind} ${r.refType}:${r.target} (${r.via})`;

const refsOf = (result: MetadataFileParseResult) =>
    getUnitDependencies(result.dataType, result).references.map(show);

const graphUnit = (result: MetadataFileParseResult): GraphUnit => ({
    type: result.dataType,
    id: result.result.id,
    dependencies: getUnitDependencies(result.dataType, result),
});

describe('metadata references (権限・Flow・レポートタイプ・Aura)', () => {
    it('turns the remaining permission rows into grants', () => {
        const permissionSet = PermissionSetParser.parseSource(
            'permissionsets/Ops.permissionset-meta.xml',
            `<PermissionSet ${NS}>
                <customMetadataTypeAccesses><enabled>true</enabled><name>App_Setting__mdt</name></customMetadataTypeAccesses>
                <customSettingAccesses><enabled>true</enabled><name>Billing_Config__c</name></customSettingAccesses>
                <externalCredentialPrincipalAccesses><enabled>true</enabled><externalCredentialPrincipal>Billing_Auth-Named_Principal</externalCredentialPrincipal></externalCredentialPrincipalAccesses>
                <externalDataSourceAccesses><enabled>true</enabled><externalDataSource>Billing_Data</externalDataSource></externalDataSourceAccesses>
                <flowAccesses><enabled>true</enabled><flow>Invoice_Status_Update</flow></flowAccesses>
                <label>Ops</label>
            </PermissionSet>`,
        );
        const refs = refsOf(permissionSet);
        for (const expected of [
            'grants object:App_Setting__mdt (customMetadataTypeAccesses.name)',
            'grants object:Billing_Config__c (customSettingAccesses.name)',
            'grants externalCredential:Billing_Auth (externalCredentialPrincipalAccesses.externalCredentialPrincipal)',
            'grants externalDataSource:Billing_Data (externalDataSourceAccesses.externalDataSource)',
            'grants flow:Invoice_Status_Update (flowAccesses.flow)',
        ]) {
            assert.ok(refs.includes(expected), expected);
        }
    });

    it('extracts Flow actions, $Permission / $Setup and custom notification types', () => {
        const flow = FlowParser.parseSource(
            'flows/Notify.flow-meta.xml',
            `<Flow ${NS}>
                <actionCalls>
                    <name>Send_Alert</name>
                    <actionName>Invoice__c.Invoice_Sent_Alert</actionName>
                    <actionType>emailAlert</actionType>
                </actionCalls>
                <actionCalls>
                    <name>Log_Call</name>
                    <actionName>Account.LogCall</actionName>
                    <actionType>quickAction</actionType>
                </actionCalls>
                <actionCalls>
                    <name>Add_Pet</name>
                    <actionName>PetStore.addPet</actionName>
                    <actionType>externalService</actionType>
                </actionCalls>
                <decisions>
                    <name>Can_Approve</name>
                    <rules>
                        <name>Yes</name>
                        <conditionLogic>and</conditionLogic>
                        <conditions>
                            <leftValueReference>$Permission.Approve_Invoice</leftValueReference>
                            <operator>EqualTo</operator>
                            <rightValue><booleanValue>true</booleanValue></rightValue>
                        </conditions>
                        <conditions>
                            <leftValueReference>$Setup.Billing_Config__c.Enabled__c</leftValueReference>
                            <operator>EqualTo</operator>
                            <rightValue><booleanValue>true</booleanValue></rightValue>
                        </conditions>
                    </rules>
                </decisions>
                <label>Notify</label>
                <recordLookups>
                    <name>Get_Type</name>
                    <filters>
                        <field>DeveloperName</field>
                        <operator>EqualTo</operator>
                        <value><stringValue>Invoice_Overdue</stringValue></value>
                    </filters>
                    <object>CustomNotificationType</object>
                </recordLookups>
            </Flow>`,
        );
        const json = flow.result.base as FlowJson;
        const decision = json.elements!.find((e) => e.name === 'Can_Approve')!;
        // JSON の references: $Permission はカスタム権限 (global ではない)
        assert.deepEqual(
            decision.references!.filter((r) => r.refType !== 'element'),
            [
                { refType: 'customPermission', value: 'Approve_Invoice' },
                { refType: 'object', value: 'Billing_Config__c' },
                { refType: 'field', value: 'Billing_Config__c.Enabled__c' },
            ],
        );
        const refs = refsOf(flow);
        for (const expected of [
            'uses workflowAlert:Invoice__c.Invoice_Sent_Alert (flow.flowActionCall)',
            'uses quickAction:Account.LogCall (flow.flowActionCall)',
            'uses externalServiceRegistration:PetStore (flow.flowActionCall)',
            'uses customPermission:Approve_Invoice (flow.flowDecision)',
            'uses field:Billing_Config__c.Enabled__c (flow.flowDecision)',
            'uses customNotificationType:Invoice_Overdue (flow.flowRecordLookup)',
        ]) {
            assert.ok(refs.includes(expected), expected);
        }
        assert.ok(!refs.some((r) => r.includes('globalVariable:$Permission')));

        // メールアラートは、ワークフローの単位の子 (workflowAlert:<オブジェクト>.<名前>) に決まる
        const workflow = WorkflowParser.parseSource(
            'workflows/Invoice__c.workflow-meta.xml',
            `<Workflow ${NS}>
                <alerts><fullName>Invoice_Sent_Alert</fullName><senderType>CurrentUser</senderType></alerts>
            </Workflow>`,
        );
        const graph = buildDependencyGraph([graphUnit(workflow), graphUnit(flow)]);
        const alert = graph.nodes.get('workflowAlert:Invoice__c.Invoice_Sent_Alert')!;
        assert.equal(alert.origin, 'repository');
        assert.equal(alert.parent, 'workflow:Invoice__c');
        assert.ok(graph.edges.some((e) => e.to === alert.id));
    });

    it('turns report type columns on the base object into field references', () => {
        const reportType = ReportTypeParser.parseSource(
            'reportTypes/Invoices.reportType-meta.xml',
            `<ReportType ${NS}>
                <baseObject>Invoice__c</baseObject>
                <label>Invoices</label>
                <sections>
                    <columns><checkedByDefault>true</checkedByDefault><field>Amount__c</field><table>Invoice__c</table></columns>
                    <columns><checkedByDefault>false</checkedByDefault><field>Quantity__c</field><table>Invoice__c.Lines__r</table></columns>
                    <masterLabel>Invoices</masterLabel>
                </sections>
            </ReportType>`,
        );
        const refs = refsOf(reportType);
        assert.ok(refs.includes('uses object:Invoice__c (baseObject)'));
        assert.ok(refs.includes('uses field:Invoice__c.Amount__c (sections.columns)'));
        // 関係をたどった table (Invoice__c.Lines__r) の列は、オブジェクトが分からないので参照にしない
        assert.ok(!refs.some((r) => r.includes('Quantity__c')));
    });

    it('reads lightning:messageChannel in Aura markup and resolves it to the channel', () => {
        const aura = AuraParser.parseSource(
            'aura/invoiceListener/invoiceListener.cmp',
            `<aura:component>
                <lightning:messageChannel type="Invoice_Selected__c" aura:id="channel" onMessage="{!c.handle}"/>
                <div><lightning:messageChannel type="ns__Other__c"/></div>
            </aura:component>`,
            { name: 'invoiceListener' },
        );
        assert.deepEqual((aura.result.base as AuraBundleJson).messageChannels, [
            'Invoice_Selected__c',
            'ns__Other__c',
        ]);
        assert.ok(refsOf(aura).includes('uses messageChannel:Invoice_Selected (messageChannels)'));

        const channel = LightningMessageChannelParser.parseSource(
            'messageChannels/Other.messageChannel-meta.xml',
            `<LightningMessageChannel ${NS}><masterLabel>Other</masterLabel></LightningMessageChannel>`,
        );
        // チャネルの解析結果があれば確かめる。名前空間付きは確かめない
        const analysis = analyzeMetadataReferences({ metadata: [aura, channel] });
        assert.deepEqual(
            analysis.findings.map((f) => `${f.code}:${f.target}`),
            ['UNKNOWN_MESSAGE_CHANNEL:Invoice_Selected'],
        );
    });
});

describe('metadata references (単位がなかった種類)', () => {
    it('reads org settings as a value tree (root element is <name>Settings)', () => {
        const settings = SettingsParser.parseSource(
            'settings/Case.settings-meta.xml',
            `<CaseSettings ${NS}>
                <defaultCaseOwner>Invoice_Queue</defaultCaseOwner>
                <emailToCase><enableEmailToCase>true</enableEmailToCase></emailToCase>
            </CaseSettings>`,
        );
        assert.equal(settings.result.id, 'settings_Case');
        const json = settings.result.base as SettingsJson;
        assert.equal(json.fullName, 'Case');
        assert.deepEqual(json.properties, {
            defaultCaseOwner: 'Invoice_Queue',
            emailToCase: { enableEmailToCase: true },
        });
        // ルート要素が違えば読まない (理由は resolvedError。JSON のノードにはしない)
        const wrong = SettingsParser.parseSource(
            'settings/Case.settings-meta.xml',
            `<SecuritySettings ${NS}/>`,
        );
        assert.equal(wrong.dataType, 'error');
        assert.equal(wrong.resolvedError[0]!.code, 'UNEXPECTED_ROOT');
    });

    it('extracts path assistant, duplicate rule and platform event references', () => {
        const path = PathAssistantParser.parseSource(
            'pathAssistants/Invoice_Path.pathAssistant-meta.xml',
            `<PathAssistant ${NS}>
                <active>true</active>
                <entityName>Invoice__c</entityName>
                <fieldName>Status__c</fieldName>
                <masterLabel>Invoice Path</masterLabel>
                <pathAssistantSteps><fieldNames>Due_Date__c</fieldNames><picklistValueName>Draft</picklistValueName></pathAssistantSteps>
                <recordTypeName>Standard</recordTypeName>
            </PathAssistant>`,
        );
        const pathRefs = refsOf(path);
        for (const expected of [
            'uses object:Invoice__c (entityName)',
            'uses field:Invoice__c.Status__c (fieldName)',
            'uses recordType:Invoice__c.Standard (recordTypeName)',
            'uses field:Invoice__c.Due_Date__c (pathAssistantSteps.fieldNames)',
        ]) {
            assert.ok(pathRefs.includes(expected), expected);
        }

        const matching = MatchingRulesParser.parseSource(
            'matchingRules/Account.matchingRule-meta.xml',
            `<MatchingRules ${NS}>
                <matchingRules>
                    <fullName>Account_Name_Match</fullName>
                    <label>Account Name Match</label>
                    <matchingRuleItems><fieldName>Name</fieldName><matchingMethod>Exact</matchingMethod></matchingRuleItems>
                    <ruleStatus>Active</ruleStatus>
                </matchingRules>
            </MatchingRules>`,
        );
        const duplicate = DuplicateRuleParser.parseSource(
            'duplicateRules/Account.Dup.duplicateRule-meta.xml',
            `<DuplicateRule ${NS}>
                <duplicateRuleMatchRules>
                    <matchRuleSObjectType>Account</matchRuleSObjectType>
                    <matchingRule>Account_Name_Match</matchingRule>
                </duplicateRuleMatchRules>
                <duplicateRuleMatchRules>
                    <matchRuleSObjectType>Account</matchRuleSObjectType>
                    <matchingRule>Missing_Match</matchingRule>
                </duplicateRuleMatchRules>
                <isActive>true</isActive>
                <masterLabel>Dup</masterLabel>
                <operationsOnInsert>Alert</operationsOnInsert>
                <operationsOnInsert>Report</operationsOnInsert>
            </DuplicateRule>`,
        );
        assert.deepEqual(
            (duplicate.result.base as { operationsOnInsert?: string[] }).operationsOnInsert,
            ['Alert', 'Report'],
        );
        assert.ok(
            refsOf(matching).includes('uses field:Account.Name (matchingRules.matchingRuleItems)'),
        );
        const graph = buildDependencyGraph([graphUnit(matching), graphUnit(duplicate)]);
        assert.equal(
            graph.nodes.get('matchingRule:Account.Account_Name_Match')!.origin,
            'repository',
        );
        assert.deepEqual(
            graph.findings.map((f) => f.target),
            ['matchingRule:Account.Missing_Match'],
        );

        const member = PlatformEventChannelMemberParser.parseSource(
            'platformEventChannelMembers/M.platformEventChannelMember-meta.xml',
            `<PlatformEventChannelMember ${NS}>
                <eventChannel>Invoice_Changes__chn</eventChannel>
                <selectedEntity>Invoice__ChangeEvent</selectedEntity>
            </PlatformEventChannelMember>`,
        );
        assert.deepEqual(refsOf(member), [
            'uses platformEventChannel:Invoice_Changes__chn (eventChannel)',
            'uses object:Invoice__c (selectedEntity)',
        ]);
        const subscriber = PlatformEventSubscriberConfigParser.parseSource(
            'PlatformEventSubscriberConfigs/C.platformEventSubscriberConfig-meta.xml',
            `<PlatformEventSubscriberConfig ${NS}>
                <batchSize>100</batchSize>
                <platformEventConsumer>InvoicePaidTrigger</platformEventConsumer>
            </PlatformEventSubscriberConfig>`,
        );
        assert.deepEqual(refsOf(subscriber), [
            'uses apexTrigger:InvoicePaidTrigger (platformEventConsumer)',
        ]);
    });

    it('reads eventType / publishBehavior of platform events', () => {
        const result = MetadataParser.parseObjectSource('Invoice_Paid__e', [
            {
                fileName: 'Invoice_Paid__e.object-meta.xml',
                filePath: 'Invoice_Paid__e/Invoice_Paid__e.object-meta.xml',
                source: `<CustomObject ${NS}>
                    <deploymentStatus>Deployed</deploymentStatus>
                    <eventType>HighVolume</eventType>
                    <label>Invoice Paid</label>
                    <pluralLabel>Invoice Paid</pluralLabel>
                    <publishBehavior>PublishAfterCommit</publishBehavior>
                </CustomObject>`,
            },
        ]);
        assert.equal(result.dataType, 'object');
        if (result.dataType !== 'object') return;
        const object = result.result.base;
        assert.equal(object.objectType, 'platformEvent');
        assert.equal(object.eventType, 'HighVolume');
        assert.equal(object.publishBehavior, 'PublishAfterCommit');
        assert.equal(object.skippedElements, undefined);
    });
});

describe('metadata references (サンプル)', () => {
    let repository: Repository;

    before(async () => {
        repository = await Repository.load(new WorkingTree(repositoryOf('after')));
    });

    const refsOfUnit = (type: string, id: string) => {
        const unit = repository.get(type).find((r) => r.result.id === id);
        assert.ok(unit, `${type} ${id}`);
        return getUnitDependencies(type, unit).references.map(show);
    };

    it('turns object translations into references to what they translate', () => {
        const refs = refsOfUnit('objectTranslation', 'Invoice__c-ja');
        for (const expected of [
            'uses object:Invoice__c (objectApiName)',
            'uses field:Invoice__c.Amount__c (fields)',
            'uses fieldSet:Invoice__c.Summary (fieldSets)',
            'uses layout:Invoice__c-Invoice Layout (layouts)',
            'uses recordType:Invoice__c.Standard (recordTypes)',
            'uses validationRule:Invoice__c.Amount_Positive (validationRules)',
            'uses webLink:Invoice__c.Send_Invoice (webLinks)',
        ]) {
            assert.ok(refs.includes(expected), expected);
        }
    });

    it('extracts the rules of the sample (queues and criteria fields)', () => {
        assert.deepEqual(refsOfUnit('assignmentRules', 'assignmentRules_Case'), [
            'uses object:Case (fullName)',
            'uses field:Case.Origin (assignmentRule.ruleEntry)',
            'uses queue:Invoice_Queue (assignmentRule.ruleEntry)',
        ]);
        assert.ok(
            refsOfUnit('escalationRules', 'escalationRules_Case').includes(
                'uses queue:Invoice_Queue (escalationRule.ruleEntry)',
            ),
        );
    });
});
