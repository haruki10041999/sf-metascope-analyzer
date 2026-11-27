import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseApexUnitFiles } from '../../src/analyzer/parser/Apex/unit';
import {
    analyzeApexUnit,
    apexLoopOperationsOf,
    apexSecurityChecksOf,
    apexUnitFactsOf,
} from '../../src/analyzer/processor/Apex/semantic';

// ★ガバナ制限のリスク (loopOperations.ts) と ★CRUD/FLS・共有の検査 (security.ts)。docs/plan.md 10 章 P4 段 2

const analyze = async (lines: string[]) => {
    const unit = await parseApexUnitFiles({
        unitType: 'class',
        name: 'Svc',
        filePath: 'Svc.cls',
        source: { fileName: 'Svc.cls', source: lines.join('\n') },
    });
    assert.deepEqual(unit.resolvedError, []);
    const analysis = analyzeApexUnit(unit);
    assert.ok(analysis);
    return { analysis, facts: apexUnitFactsOf(analysis) };
};

describe('ループの中の SOQL・DML (loopOperations.ts)', () => {
    it('ループの中の直接の操作と、ループの中から呼んだメソッドの先 (何段でも) の操作', async () => {
        const { analysis, facts } = await analyze([
            'public with sharing class Svc {',
            '    public void run(List<Id> ids) {',
            '        for (Id i : ids) {',
            '            Account a = [SELECT Id FROM Account WHERE Id = :i];',
            '            save(a);',
            '        }',
            '        log();',
            '    }',
            '    void save(Account a) { touch(a); }',
            '    void touch(Account a) { update a; }',
            '    void log() { insert new Task(); }',
            '}',
        ]);
        const rows = apexLoopOperationsOf(analysis, facts).map((o) =>
            [o.member, o.kind, o.via, (o.path ?? []).join('>'), o.operation ?? ''].join(' '),
        );
        assert.deepEqual(rows.sort(), [
            'Svc.run dml call Svc.save>Svc.touch update',
            'Svc.run soql direct  ',
        ]);
    });

    it('届かない文 (return のあと) の操作は除く', async () => {
        const { analysis, facts } = await analyze([
            'public class Svc {',
            '    public void run(List<Id> ids) {',
            '        for (Id i : ids) { continue; insert new Task(); }',
            '    }',
            '}',
        ]);
        assert.deepEqual(apexLoopOperationsOf(analysis, facts), []);
    });
});

describe('CRUD/FLS・共有の検査 (security.ts)', () => {
    it('クエリの WITH・DML の AccessLevel・stripInaccessible で守り方を決め、クラスの共有の宣言を付ける', async () => {
        const { analysis, facts } = await analyze([
            'public inherited sharing class Svc {',
            '    public void a() { List<Account> r = [SELECT Id FROM Account WITH USER_MODE]; }',
            '    public void b() { List<Account> r = [SELECT Id FROM Account WITH SECURITY_ENFORCED]; }',
            '    public void c() { List<Account> r = [SELECT Id FROM Account]; }',
            '    public void d(List<Account> rows) { Database.insert(rows, AccessLevel.USER_MODE); }',
            '    public void e(List<Account> rows) { insert as user rows; }',
            '    public void f(List<Account> rows) {',
            '        SObjectAccessDecision d = Security.stripInaccessible(AccessType.CREATABLE, rows);',
            '        insert d.getRecords();',
            '    }',
            '    public void g(List<Account> rows) { update rows; }',
            '}',
        ]);
        const rows = apexSecurityChecksOf(analysis, facts).map((c) =>
            [c.member, c.kind, c.detail, c.enforcement, c.sharing].join(' '),
        );
        assert.deepEqual(rows.sort(), [
            'Svc.a query soql userMode inherited',
            'Svc.b query soql securityEnforced inherited',
            'Svc.c query soql none inherited',
            'Svc.d dml insert userMode inherited',
            'Svc.e dml insert userMode inherited',
            'Svc.f dml insert stripInaccessible inherited',
            'Svc.g dml update none inherited',
        ]);
    });

    it('共有の宣言のないクラスは sharing が null', async () => {
        const { analysis, facts } = await analyze([
            'public class Svc {',
            '    public void c() { List<Account> r = [SELECT Id FROM Account]; }',
            '}',
        ]);
        assert.deepEqual(
            apexSecurityChecksOf(analysis, facts).map((c) => [c.owner, c.sharing]),
            [['Svc', null]],
        );
    });
});
