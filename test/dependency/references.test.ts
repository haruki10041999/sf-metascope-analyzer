import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { repositoryOf } from '../../docs/examples/paths';
import { getFormulaReferences } from '../../src/analyzer/processor/dependency/formula';
import type { UnitReference } from '../../src/analyzer/processor/dependency/types';
import { getUnitDependencies } from '../../src/analyzer/processor/dependency/units';
import { Repository, WorkingTree } from '../../src/analyzer/unit';

const show = (r: UnitReference) => `${r.kind} ${r.refType}:${r.target} (${r.via})`;

describe('dependency references (単位ごとの定義と参照)', () => {
    let repository: Repository;
    const refsOf = (type: string, id: string) => {
        const unit = repository.get(type).find((r) => r.result.id === id);
        assert.ok(unit, `${type} ${id}`);
        return getUnitDependencies(type, unit);
    };

    before(async () => {
        repository = await Repository.load(new WorkingTree(repositoryOf('after')));
    });

    it('extracts Apex SOQL / DML / calls / types with statement and expression keys', () => {
        const { definitions, references } = refsOf('apexClass', 'class_AccountService');
        const sync = references.filter((r) => r.from.member === 'AccountService.sync').map(show);
        assert.ok(sync.includes('queries object:Account (soql.from)'));
        assert.ok(sync.includes('reads field:Account.Name (soql.select)'));
        assert.ok(sync.includes('reads field:Account.Id (soql.where)'));
        assert.ok(sync.includes('updates object:Account (dml.update)'));
        assert.ok(sync.includes('writes apexTypeMember:Account.Name (assignment)'));
        const all = references.map(show);
        assert.ok(all.includes('extends apexType:BaseService (extends)'));
        assert.ok(all.includes('implements apexType:Schedulable (implements)'));
        assert.ok(all.includes('inserts object:Account (dml.insert)'));
        assert.ok(all.includes('calls apexMethod:AccountService.sync (call)'));
        assert.ok(all.includes('queries object:Contact (sosl.returning)'));
        // 集合のメソッド (accounts.size()) は参照にしない
        assert.ok(!all.some((r) => /\.size \(/.test(r)));
        // 文・式の単位: メソッドの中の参照は、文と式の sourceKeys を持つ
        assert.ok(
            references
                .filter((r) => r.from.member === 'AccountService.sync')
                .every((r) => r.from.statement && r.from.expression),
        );
        const defs = definitions.map((d) => `${d.defType}:${d.name}`);
        assert.ok(defs.includes('apexClass:AccountService'));
        assert.ok(defs.includes('apexClass:AccountService.Wrapper'));
        assert.ok(defs.includes('apexMethod:AccountService.sync'));
        assert.ok(defs.includes('apexProperty:AccountService.MAX_SIZE'));
    });

    it('extracts the trigger object and calls', () => {
        const all = refsOf('apexTrigger', 'trigger_AccountTrigger').references.map(show);
        assert.ok(all.includes('triggers object:Account (trigger.object)'));
        assert.ok(all.includes('calls apexTypeMember:AccountService.validate (call)'));
    });

    it('extracts LWC imports and child components', () => {
        const ids = repository.get('lwc').map((r) => r.result.id);
        const all = ids.flatMap((id) => refsOf('lwc', id).references.map(show));
        assert.ok(all.includes('calls apexMethod:AccountController.getAccounts (import)'));
        assert.ok(all.includes('uses field:Account.Name (import)'));
        assert.ok(all.some((r) => r.startsWith('places lwc:') || r.startsWith('imports lwc:')));
    });

    it('extracts object references (formulas, layouts of members)', () => {
        const account = refsOf('object', 'Account');
        const all = account.references.map(show);
        assert.ok(all.includes('reads field:Account.Name (errorConditionFormula)'));
        assert.ok(all.includes('uses field:Account.Tier__c (compactLayouts.fields)'));
        assert.ok(account.definitions.some((d) => d.defType === 'field'));
    });

    it('extracts metadata references (permissions, layouts, flows, pages)', () => {
        const permissionSet = refsOf(
            'permissionSet',
            'permissionSet_Invoice_Manager',
        ).references.map(show);
        assert.ok(
            permissionSet.includes('grants field:Invoice__c.Amount__c (fieldPermissions.field)'),
        );
        assert.ok(
            permissionSet.includes('grants apexClass:AccountService (classAccesses.apexClass)'),
        );
        const layouts = repository
            .get('layout')
            .flatMap((r) => getUnitDependencies('layout', r).references.map(show));
        assert.ok(layouts.includes('places field:Account.Tier__c (items.field)'));
        const flows = repository
            .get('flow')
            .flatMap((r) => getUnitDependencies('flow', r).references.map(show));
        assert.ok(flows.some((r) => r.startsWith('uses field:Account.Tier__c')));
        const page = repository
            .get('apexPage')
            .flatMap((r) => getUnitDependencies('apexPage', r).references.map(show));
        assert.ok(page.includes('uses apexClass:InvoicePrintExt (markup.extensions)'));
    });
});

describe('formula references (数式の参照の取り出し)', () => {
    it('extracts fields, relationships and global variables, skipping functions and strings', () => {
        const refs = getFormulaReferences(
            'IF(ISPICKVAL(Status__c, "Open.Value") && Account.Owner.Name != $User.LastName, Amount__c * 1.5, $Setup.Config__c.Rate__c) /* Note__c */ + $Label.Hello + Parent__r.Total__c + $Permission.Approve',
            'Invoice__c',
        );
        const show = (r: (typeof refs)[number]) =>
            'object' in r && r.refType === 'field'
                ? `field:${r.object}.${r.field}`
                : `${r.refType}:${'name' in r ? r.name : ''}`;
        assert.deepEqual(refs.map(show), [
            'field:Invoice__c.Status__c',
            'field:Invoice__c.AccountId',
            'globalVariable:$User.LastName',
            'field:Invoice__c.Amount__c',
            'object:Config__c',
            'field:Config__c.Rate__c',
            'customLabel:Hello',
            'field:Invoice__c.Parent__c',
            'customPermission:Approve',
        ]);
    });

    it('does not extract base-object fields without an object', () => {
        assert.deepEqual(
            getFormulaReferences('Amount__c > 0 && $ObjectType.Account.Fields.Name != null'),
            [
                { refType: 'object', name: 'Account' },
                { refType: 'field', object: 'Account', field: 'Name', path: ['Name'] },
            ],
        );
    });
});
