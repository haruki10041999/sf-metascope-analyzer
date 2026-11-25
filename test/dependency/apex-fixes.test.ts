import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseApexUnitFiles } from '../../src/analyzer/parser/Apex/unit';
import { getApexDependencies } from '../../src/analyzer/processor/dependency/apex';
import { buildDependencyGraph } from '../../src/analyzer/processor/dependency/graph';

// Apex の依存関係の不具合 (docs/apex-json-review.md 5 章の 1〜3・6・8、Database.insert)。
// docs/json-redesign-plan.md の段階 A0 (JSON は変えない)

const dependenciesOf = async (name: string, lines: string[]) => {
    const source = [...lines].join('\n');
    const unit = await parseApexUnitFiles({
        unitType: 'class',
        name,
        filePath: `${name}.cls`,
        source: { fileName: `${name}.cls`, source },
    });
    assert.deepEqual(unit.resolvedError, []);
    return getApexDependencies(unit);
};

const show = (dependencies: Awaited<ReturnType<typeof dependenciesOf>>) =>
    dependencies.references.map((r) => `${r.kind} ${r.refType}:${r.target} (${r.via})`);

describe('Apex dependency fixes (段階 A0)', () => {
    it('reads the property type and the getter / setter bodies', async () => {
        const refs = show(
            await dependenciesOf('Props', [
                'public class Props {',
                '    public Integer count { get { return [SELECT COUNT() FROM Contact]; } set { reset(); } }',
                '    public Account acc { get; set; }',
                '    public void run() { acc.Name = null; }',
                '    void reset() {}',
                '}',
            ]),
        );
        assert.ok(refs.includes('queries object:Contact (soql.from)'));
        assert.ok(refs.includes('calls apexMethod:Props.reset (call)'));
        assert.ok(refs.includes('uses apexType:Account (property)'));
        // プロパティの型が変数の型になる
        assert.ok(refs.includes('writes apexTypeMember:Account.Name (assignment)'));
    });

    it('references this.f() as a call to the same class', async () => {
        const refs = show(
            await dependenciesOf('Self', [
                'public class Self {',
                '    void run() { this.sync(); super.toString(); }',
                '    void sync() {}',
                '}',
            ]),
        );
        assert.ok(refs.includes('calls apexMethod:Self.sync (call)'));
        assert.ok(!refs.some((r) => /toString|apexTypeMember:(this|super)/i.test(r)));
    });

    it('references dotted types (Database.Batchable<SObject>)', async () => {
        const refs = show(
            await dependenciesOf('Batch', [
                'public class Batch implements Database.Batchable<SObject> {',
                '    Outer.Inner holder;',
                '    void run() { holder.go(); }',
                '}',
            ]),
        );
        assert.ok(refs.includes('implements apexType:Database.Batchable (implements)'));
        assert.ok(refs.includes('implements apexType:SObject (implements)'));
        assert.ok(refs.includes('uses apexType:Outer.Inner (field)'));
        assert.ok(refs.includes('calls apexTypeMember:Outer.Inner.go (call)'));
    });

    it('references DML through Database.insert(records, false)', async () => {
        const refs = show(
            await dependenciesOf('Dml', [
                'public class Dml {',
                '    void run(List<Account> records) {',
                '        Database.insert(records, false);',
                '        System.Database.update(records);',
                '        Database.delete([SELECT Id FROM Contact]);',
                '        Database.upsert(new Invoice__c(), false);',
                '    }',
                '}',
            ]),
        );
        assert.ok(refs.includes('inserts object:Account (Database.insert)'));
        assert.ok(refs.includes('updates object:Account (Database.update)'));
        assert.ok(refs.includes('deletes object:Contact (Database.delete)'));
        assert.ok(refs.includes('upserts object:Invoice__c (Database.upsert)'));
    });

    it('checks FeatureManagement case-insensitively', async () => {
        const refs = show(
            await dependenciesOf('Perm', [
                'public class Perm {',
                "    Boolean run() { return featureManagement.checkPermission('Approve'); }",
                '}',
            ]),
        );
        assert.ok(refs.includes('uses customPermission:Approve (FeatureManagement)'));
    });

    it('references subquery relationships and resolves them to the child object', async () => {
        const dependencies = await dependenciesOf('Sub', [
            'public class Sub {',
            '    void run() {',
            '        List<Account> a = [SELECT Name, (SELECT LastName, Owner.Name FROM Contacts), (SELECT Amount__c FROM Invoices__r), (SELECT Id FROM Unknowns__r) FROM Account];',
            '    }',
            '}',
        ]);
        const refs = show(dependencies);
        assert.ok(refs.includes('reads field:Account.Name (soql.select)'));
        assert.ok(refs.includes('queries childRelationship:Account.Contacts (soql.subquery)'));
        assert.ok(
            refs.includes('reads childRelationshipField:Account.Contacts.LastName (soql.subquery)'),
        );
        // 標準の関係の先 (Owner.Name) は項目にしない (関係の名前 Owner は項目ではない。
        // スキーマを引く参照の解決で決める。docs/plan.md 10 章 P2)
        assert.ok(
            !refs.some((ref) => ref.includes('childRelationshipField:Account.Contacts.Owner')),
        );
        // サブクエリの項目は親のオブジェクトの項目にしない
        assert.ok(!refs.includes('reads field:Account.LastName (soql.select)'));

        const graph = buildDependencyGraph([
            { type: 'apexClass', id: 'class_Sub', dependencies },
            {
                type: 'object',
                id: 'object_Invoice__c',
                dependencies: {
                    definitions: [
                        { defType: 'object', name: 'Invoice__c' },
                        { defType: 'field', name: 'Invoice__c.Amount__c' },
                    ],
                    references: [],
                    childRelationships: [
                        {
                            parent: 'Account',
                            name: 'Invoices__r',
                            child: 'Invoice__c',
                            field: 'Invoice__c.Account__c',
                        },
                    ],
                },
            },
        ]);
        const targets = (kind: string) =>
            graph.edges
                .filter((e) => e.via === 'soql.subquery' && e.kind === kind)
                .map((e) => e.to);
        assert.ok(targets('queries').includes('object:Invoice__c'));
        assert.ok(targets('reads').includes('field:Invoice__c.Amount__c'));
        assert.equal(graph.nodes.get('field:Invoice__c.Amount__c')?.origin, 'repository');
        // 標準の子リレーションは standard、カスタムでリポジトリにないものは missing
        assert.equal(graph.nodes.get('childRelationship:Account.Contacts')?.origin, 'standard');
        assert.equal(graph.nodes.get('childRelationship:Account.Unknowns__r')?.origin, 'missing');
        assert.ok(
            graph.findings.some(
                (f) =>
                    f.code === 'UNKNOWN_CHILD_RELATIONSHIP' &&
                    f.target === 'childRelationship:Account.Unknowns__r',
            ),
        );
    });
});
