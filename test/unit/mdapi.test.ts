import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { Repository, WorkingTree, findUnitType, locateUnits } from '../../src/analyzer/unit';

// メタデータ API の形式 (src/ の下に package.xml と、-meta.xml の付かないファイル) を、sfdx の形式と同じ JSON にする

const XML = '<?xml version="1.0" encoding="UTF-8"?>\n';
const NS = 'xmlns="http://soap.sforce.com/2006/04/metadata"';

const WORKFLOW = `${XML}<Workflow ${NS}>
    <fieldUpdates>
        <fullName>Set_Status</fullName>
        <field>Status__c</field>
        <literalValue>Open</literalValue>
        <name>Set Status</name>
        <operation>Literal</operation>
    </fieldUpdates>
</Workflow>
`;
const LABELS = `${XML}<CustomLabels ${NS}>
    <labels>
        <fullName>Greeting</fullName>
        <language>ja</language>
        <protected>false</protected>
        <shortDescription>Greeting</shortDescription>
        <value>こんにちは</value>
    </labels>
</CustomLabels>
`;
const PERMISSION_SET = `${XML}<PermissionSet ${NS}>
    <label>Manager</label>
    <objectPermissions>
        <allowRead>true</allowRead>
        <object>Invoice__c</object>
    </objectPermissions>
</PermissionSet>
`;
const FIELD = `<fullName>Amount__c</fullName>
        <label>Amount</label>
        <type>Currency</type>
        <precision>18</precision>
        <scale>2</scale>`;
const OBJECT_META = `<label>Invoice</label>
    <pluralLabel>Invoices</pluralLabel>
    <sharingModel>ReadWrite</sharingModel>`;

const SFDX: Record<string, string> = {
    'force-app/main/default/workflows/Invoice__c.workflow-meta.xml': WORKFLOW,
    'force-app/main/default/labels/CustomLabels.labels-meta.xml': LABELS,
    'force-app/main/default/permissionsets/Manager.permissionset-meta.xml': PERMISSION_SET,
    'force-app/main/default/objects/Invoice__c/Invoice__c.object-meta.xml': `${XML}<CustomObject ${NS}>
    ${OBJECT_META}
</CustomObject>
`,
    'force-app/main/default/objects/Invoice__c/fields/Amount__c.field-meta.xml': `${XML}<CustomField ${NS}>
        ${FIELD}
</CustomField>
`,
};

const MDAPI: Record<string, string> = {
    'src/package.xml': `${XML}<Package ${NS}><version>62.0</version></Package>\n`,
    'src/workflows/Invoice__c.workflow': WORKFLOW,
    'src/labels/CustomLabels.labels': LABELS,
    'src/permissionsets/Manager.permissionset': PERMISSION_SET,
    'src/objects/Invoice__c.object': `${XML}<CustomObject ${NS}>
    <fields>
        ${FIELD}
    </fields>
    ${OBJECT_META}
</CustomObject>
`,
};

/** 位置 (sourceKey) を除いた JSON。objectKey は中身の hash なので残す */
const withoutPositions = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(withoutPositions);
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value)
                .filter(([key]) => key !== 'sourceKey')
                .map(([key, child]) => [key, withoutPositions(child)]),
        );
    }
    return value;
};

describe('metadata API source format (メタデータ API の形式)', () => {
    let tmp: string;
    const writeProject = async (name: string, files: Record<string, string>) => {
        const root = path.join(tmp, name);
        for (const [relative, source] of Object.entries(files)) {
            const file = path.join(root, relative);
            await mkdir(path.dirname(file), { recursive: true });
            await writeFile(file, source);
        }
        return root;
    };

    before(async () => {
        tmp = await mkdtemp(path.join(os.tmpdir(), 'mdapi-'));
    });
    after(async () => {
        await rm(tmp, { recursive: true, force: true });
    });

    it('reads the same JSON as the sfdx source format', async () => {
        const typeNames = ['workflow', 'customLabels', 'permissionSet', 'object'];
        const types = typeNames.map((type) => findUnitType(type)!);
        const [sfdx, mdapi] = await Promise.all([
            writeProject('sfdx', SFDX).then((root) =>
                Repository.load(new WorkingTree(root), types),
            ),
            writeProject('mdapi', MDAPI).then((root) =>
                Repository.load(new WorkingTree(root), types),
            ),
        ]);
        for (const type of typeNames) {
            const [a] = sfdx.get(type);
            const [b] = mdapi.get(type);
            assert.ok(a && b, type);
            assert.equal(b.dataType, a.dataType, type);
            assert.equal(b.result.id, a.result.id, type);
            assert.deepEqual(
                withoutPositions(b.result.base),
                withoutPositions(a.result.base),
                type,
            );
        }
    });

    it('does not treat sfdx companion files as metadata API units', () => {
        const located = locateUnits([
            'force-app/main/default/staticresources/logo.resource',
            'force-app/main/default/staticresources/logo.resource-meta.xml',
            'force-app/main/default/pages/P.page',
            'force-app/main/default/pages/P.page-meta.xml',
        ]);
        assert.deepEqual(located.get('staticResource'), [
            'force-app/main/default/staticresources/logo.resource-meta.xml',
        ]);
        assert.deepEqual(located.get('apexPage'), ['force-app/main/default/pages/P.page-meta.xml']);
    });
});
