import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { Repository, WorkingTree, findUnitType } from '../../src/analyzer/unit';

// 分解された形式 (decomposed) を、1 つの XML と同じ JSON に組み立てる

const XML = '<?xml version="1.0" encoding="UTF-8"?>\n';
const NS = 'xmlns="http://soap.sforce.com/2006/04/metadata"';

const FILES_MONOLITHIC: Record<string, string> = {
    'permissionsets/Manager.permissionset-meta.xml': `${XML}<PermissionSet ${NS}>
    <fieldPermissions>
        <editable>true</editable>
        <field>Account.Tier__c</field>
        <readable>true</readable>
    </fieldPermissions>
    <label>Manager</label>
    <objectPermissions>
        <allowRead>true</allowRead>
        <object>Account</object>
    </objectPermissions>
    <userPermissions>
        <enabled>true</enabled>
        <name>ApiEnabled</name>
    </userPermissions>
</PermissionSet>
`,
    'labels/CustomLabels.labels-meta.xml': `${XML}<CustomLabels ${NS}>
    <labels>
        <fullName>Greeting</fullName>
        <language>ja</language>
        <protected>false</protected>
        <shortDescription>Greeting</shortDescription>
        <value>こんにちは</value>
    </labels>
    <labels>
        <fullName>Title</fullName>
        <language>ja</language>
        <protected>false</protected>
        <shortDescription>Title</shortDescription>
        <value>タイトル</value>
    </labels>
</CustomLabels>
`,
};

const FILES_DECOMPOSED: Record<string, string> = {
    'permissionsets/Manager/Manager.permissionset-meta.xml': `${XML}<PermissionSet ${NS}>
    <label>Manager</label>
</PermissionSet>
`,
    'permissionsets/Manager/objectSettings/Account.objectSettings-meta.xml': `${XML}<PermissionSet ${NS}>
    <fieldPermissions>
        <editable>true</editable>
        <field>Account.Tier__c</field>
        <readable>true</readable>
    </fieldPermissions>
    <objectPermissions>
        <allowRead>true</allowRead>
        <object>Account</object>
    </objectPermissions>
</PermissionSet>
`,
    'permissionsets/Manager/Manager.userPermission-meta.xml': `${XML}<PermissionSet ${NS}>
    <userPermissions>
        <enabled>true</enabled>
        <name>ApiEnabled</name>
    </userPermissions>
</PermissionSet>
`,
    'labels/Greeting.label-meta.xml': `${XML}<CustomLabel ${NS}>
    <fullName>Greeting</fullName>
    <language>ja</language>
    <protected>false</protected>
    <shortDescription>Greeting</shortDescription>
    <value>こんにちは</value>
</CustomLabel>
`,
    'labels/Title.label-meta.xml': `${XML}<CustomLabel ${NS}>
    <fullName>Title</fullName>
    <language>ja</language>
    <protected>false</protected>
    <shortDescription>Title</shortDescription>
    <value>タイトル</value>
</CustomLabel>
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

describe('decomposed source format (分解された形式)', () => {
    let tmp: string;
    const writeProject = async (name: string, files: Record<string, string>) => {
        const root = path.join(tmp, name);
        for (const [relative, source] of Object.entries(files)) {
            const file = path.join(root, 'force-app', 'main', 'default', relative);
            await mkdir(path.dirname(file), { recursive: true });
            await writeFile(file, source);
        }
        return root;
    };

    before(async () => {
        tmp = await mkdtemp(path.join(os.tmpdir(), 'decomposed-'));
    });
    after(async () => {
        await rm(tmp, { recursive: true, force: true });
    });

    it('assembles decomposed permission sets and labels into the same JSON as one XML', async () => {
        const types = [findUnitType('permissionSet')!, findUnitType('customLabels')!];
        const [monolithic, decomposed] = await Promise.all([
            writeProject('monolithic', FILES_MONOLITHIC).then((root) =>
                Repository.load(new WorkingTree(root), types),
            ),
            writeProject('decomposed', FILES_DECOMPOSED).then((root) =>
                Repository.load(new WorkingTree(root), types),
            ),
        ]);
        for (const type of ['permissionSet', 'customLabels']) {
            const [a] = monolithic.get(type);
            const [b] = decomposed.get(type);
            assert.ok(a && b, type);
            assert.equal(b.dataType, type);
            assert.equal(b.result.id, a.result.id);
            assert.deepEqual(
                withoutPositions(b.result.base),
                withoutPositions(a.result.base),
                type,
            );
        }
    });

    it('keeps the source position in the decomposed file', async () => {
        const root = await writeProject('positions', FILES_DECOMPOSED);
        const repository = await Repository.load(new WorkingTree(root), [
            findUnitType('permissionSet')!,
        ]);
        const [permissionSet] = repository.get('permissionSet');
        const sourceObject = permissionSet!.result.sourceObject as unknown as {
            sourceKeys: { sourceKey: string };
            source: { filePath: string; start: { line: number } };
        }[];
        const base = permissionSet!.result.base as {
            fieldPermissions: { sourceKeys: { sourceKey: string } }[];
        };
        const key = base.fieldPermissions[0]!.sourceKeys.sourceKey;
        const info = JSON.stringify(sourceObject).includes(key)
            ? JSON.stringify(sourceObject.find((s) => JSON.stringify(s).includes(key)))
            : '';
        assert.match(info, /objectSettings\/Account\.objectSettings-meta\.xml/);
    });
});
