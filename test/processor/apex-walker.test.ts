import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseApexUnitFiles, type ApexUnitParseResult } from '../../src/analyzer/parser/Apex/unit';
import { analyzeApexUnit } from '../../src/analyzer/processor/Apex/calls';
import {
    type ApexWalkContext,
    apexVariableOf,
    composeApexVisitors,
    walkApexParseResult,
} from '../../src/analyzer/processor/Apex/walker';
import { makeApexTypeNameOf } from '../../src/analyzer/processor/Apex/semantic/type';
import { getApexDependencies } from '../../src/analyzer/processor/dependency/apex';
import type { TypeJson } from '../../src/analyzer/types/apex/type';

// Apex の共通の走査と派生の情報 (docs/json-redesign-plan.md の段階 A3)

const parse = async (
    source: string,
    unitType: 'class' | 'trigger' = 'class',
): Promise<ApexUnitParseResult> => {
    const name = unitType === 'class' ? 'A' : 'T';
    const fileName = unitType === 'class' ? `${name}.cls` : `${name}.trigger`;
    const unit = await parseApexUnitFiles({
        unitType,
        name,
        filePath: fileName,
        source: { fileName, source },
    });
    assert.deepEqual(unit.resolvedError, []);
    return unit;
};

describe('makeApexTypeNameOf', () => {
    const sourceKeys = { objectKey: 'object', sourceKey: 'source' };

    it('keeps only enclosing types in paths for collection elements', () => {
        assert.deepEqual(
            makeApexTypeNameOf({
                kind: 'type',
                sourceKeys,
                type: 'list',
                elementType: { kind: 'type', sourceKeys, type: 'custom', customType: ['Account'] },
            }),
            [{ kind: 'custom', path: ['list'], name: 'Account' }],
        );
        const type: TypeJson = {
            kind: 'type',
            sourceKeys,
            type: 'map',
            keyType: { kind: 'type', sourceKeys, type: 'primitive', primitiveType: 'Id' },
            valueType: {
                kind: 'type',
                sourceKeys,
                type: 'list',
                elementType: { kind: 'type', sourceKeys, type: 'custom', customType: ['Account'] },
            },
        };
        assert.deepEqual(makeApexTypeNameOf(type), [
            { kind: 'primitive', path: ['mapKey'], name: 'Id' },
            { kind: 'custom', path: ['mapValue', 'list'], name: 'Account' },
        ]);
    });

    it('preserves the custom parent in generic argument paths without changing its path', () => {
        const type: TypeJson = {
            kind: 'type',
            sourceKeys,
            type: 'custom',
            customType: ['Outer', 'Box'],
            generic: [
                { kind: 'type', sourceKeys, type: 'custom', customType: ['Account'] },
                { kind: 'type', sourceKeys, type: 'primitive', primitiveType: 'String' },
            ],
        };
        assert.deepEqual(makeApexTypeNameOf(type), [
            { kind: 'custom', path: [], name: 'Outer.Box' },
            {
                kind: 'custom',
                path: [['Outer', 'Box'], { type: 'customGeneric', index: 1 }],
                name: 'Account',
            },
            {
                kind: 'primitive',
                path: [['Outer', 'Box'], { type: 'customGeneric', index: 2 }],
                name: 'String',
            },
        ]);
    });
});

describe('walkApexJson (Apex の共通の走査)', () => {
    it('keeps the class, member, loop, try and test context', async () => {
        const unit = await parse(`@IsTest
public class A {
    public class Inner {
        void run() {
            for (Integer i = 0; i < 3; i++) {
                try { update acc; } catch (Exception e) { delete acc; }
            }
        }
    }
}`);
        const seen: string[] = [];
        const show = (kind: string, c: ApexWalkContext) =>
            `${kind} ${c.className} ${c.member} loop=${c.loopDepth} try=${c.inTry} test=${c.isTest}`;
        walkApexParseResult(
            unit,
            composeApexVisitors(
                { update: (_, c) => void seen.push(show('update', c)) },
                { delete: (_, c) => void seen.push(show('delete', c)) },
            ),
        );
        assert.deepEqual(seen, [
            'update A.Inner A.Inner.run loop=1 try=true test=true',
            'delete A.Inner A.Inner.run loop=1 try=false test=true',
        ]);
    });

    it('scopes variables to blocks (a variable in a block does not leak)', async () => {
        const unit = await parse(`public class A {
    Contact c;
    void run(Opportunity o) {
        if (true) { Account c = null; c.Name = 'x'; }
        c.LastName = 'y';
        for (Lead l : leads) { }
        l.Company = 'z';
    }
}`);
        const types: string[] = [];
        walkApexParseResult(unit, {
            memberAccess: (node, context) => {
                const name = (node.object as { name?: string }).name ?? '';
                types.push(`${name}:${apexVariableOf(context, name)?.type ?? '-'}`);
            },
        });
        assert.deepEqual(types, ['c:Account', 'c:Contact', 'l:-']);
        // 依存関係も同じスコープで決める (docs/apex-json-review.md 5 章の 7)
        const writes = getApexDependencies(unit)
            .references.filter((r) => r.kind === 'writes')
            .map((r) => r.target);
        assert.deepEqual(writes, ['Account.Name', 'Contact.LastName']);
    });

    it('makes the left side of an assignment a write only (not a read)', async () => {
        const unit = await parse(`public class A {
    void run(Account acc) { acc.Name = acc.Description; }
}`);
        const refs = getApexDependencies(unit).references.map(
            (r) => `${r.kind} ${r.target} (${r.via})`,
        );
        assert.ok(refs.includes('writes Account.Name (assignment)'));
        assert.ok(refs.includes('reads Account.Description (member)'));
        assert.ok(!refs.includes('reads Account.Name (member)'));
    });

    it('attributes declarations to their own member (structure keys use the base key)', async () => {
        const unit = await parse(`public class A {
    public interface I extends Comparable, Schedulable { Account find(Contact c); }
    void run(Lead l) { }
}`);
        const refs = getApexDependencies(unit).references.map(
            (r) =>
                `${r.kind} ${r.target} @${r.from.member} ${r.from.statement?.sourceKey ? 'site' : '-'}`,
        );
        assert.ok(refs.includes('extends Comparable @A.I site'));
        assert.ok(refs.includes('extends Schedulable @A.I site'));
        assert.ok(refs.includes('uses Account @A.I.find site'));
        assert.ok(refs.includes('uses Contact @A.I.find site'));
        assert.ok(refs.includes('uses Lead @A.run site'));
    });
});

describe('analyzeApexUnit (呼び出し・DML・クエリ・トリガーの文脈)', () => {
    it('classifies calls and finds DML and queries with their loop context', async () => {
        const info = analyzeApexUnit(
            await parse(`public class A {
    void run(List<Account> accounts, HttpRequest req) {
        for (Account a : accounts) {
            List<Contact> c = [SELECT Id FROM Contact WHERE AccountId = :a.Id];
            insert a;
        }
        Database.SaveResult[] r = Database.update(accounts, false, AccessLevel.USER_MODE);
        List<SObject> q = Database.query('SELECT Id FROM Lead');
        List<List<SObject>> s = [FIND 'x' RETURNING Account, Lead];
        System.enqueueJob(new Job());
        HttpResponse res = new Http().send(req);
        System.assertEquals(1, 1);
        System.debug('x');
        EventBus.publish(new Changed__e());
        sync(1);
        this.sync(2);
        accounts.size();
    }
    void sync(Integer n) { }
    A() { this(1); }
    A(Integer n) { }
}`),
        );
        assert.deepEqual(
            info.calls.map((c) => `${c.callType} ${c.owner ?? '-'}.${c.method}`),
            [
                'dml Database.update',
                'dynamicQuery Database.query',
                'async System.enqueueJob',
                'callout Http.send',
                'assert System.assertEquals',
                'debug System.debug',
                'publish EventBus.publish',
                'method A.sync',
                'method A.sync',
                'method Account.size',
                'constructor -.this',
            ],
        );
        assert.deepEqual(
            info.dml.map((d) => [
                d.operation,
                d.via,
                d.object,
                d.allOrNone,
                d.accessLevel,
                d.context.loopDepth,
            ]),
            [
                ['insert', 'statement', 'Account', undefined, undefined, 1],
                ['update', 'database', 'Account', false, 'USER_MODE', 0],
            ],
        );
        assert.deepEqual(
            info.queries.map((q) => [q.language, q.objects.join(','), q.context.loopDepth]),
            [
                ['soql', 'Contact', 1],
                ['dynamic', '', 0],
                ['sosl', 'Account,Lead', 0],
            ],
        );
    });

    it('finds the trigger context variables', async () => {
        const info = analyzeApexUnit(
            await parse(
                `trigger T on Account (before insert) {
    if (Trigger.isBefore) { for (Account a : Trigger.new) { } }
}`,
                'trigger',
            ),
        );
        assert.deepEqual(
            info.triggerContexts.map((t) => `${t.variable} ${t.context.member}`),
            ['isBefore T', 'new T'],
        );
    });
});
