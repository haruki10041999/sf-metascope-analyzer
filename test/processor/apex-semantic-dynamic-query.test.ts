import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseApexUnitFiles } from '../../src/analyzer/parser/Apex/unit';
import { analyzeApexUnit, apexDynamicQueriesOf } from '../../src/analyzer/processor/Apex/semantic';

// 動的 SOQL の復元 (semantic/dynamicQuery.ts。docs/plan.md 10 章 P4 段 2・9 章の決めたこと:
// 一部が分からなくても確実な部分だけ取り出す。位置は元の呼び出し)

const queriesOf = async (body: string) => {
    const source = `public class C { void m(Boolean flag, String cond, String suffix, String names) { ${body} } }`;
    const unit = await parseApexUnitFiles({
        unitType: 'class',
        name: 'C',
        filePath: 'C.cls',
        source: { fileName: 'C.cls', source },
    });
    assert.deepEqual(unit.resolvedError, []);
    const analysis = analyzeApexUnit(unit);
    assert.ok(analysis);
    return analysis.bodies.flatMap((semantics) => apexDynamicQueriesOf(semantics));
};

const summary = async (body: string) =>
    (await queriesOf(body)).map((q) => [q.restoration, q.objects, q.fields]);

describe('動的 SOQL の復元 (semantic/dynamicQuery.ts)', () => {
    it('文字列がすべて分かれば、FROM のオブジェクトと SELECT の項目', async () => {
        assert.deepEqual(
            await summary(
                "String q = 'SELECT Id, Name, Owner.Name FROM Account WHERE Name = :cond'; List<Account> r = Database.query(q);",
            ),
            [['complete', ['Account'], ['Id', 'Name', 'Owner.Name']]],
        );
    });

    it('+ と += の連結もたどる', async () => {
        assert.deepEqual(
            await summary("String q = 'SELECT Id FROM '; q += 'Contact'; Database.query(q);"),
            [['complete', ['Contact'], ['Id']]],
        );
    });

    it('一部が分からなくても、確実な部分 (区切られた FROM の名前・穴のない SELECT) は取り出す', async () => {
        assert.deepEqual(await summary("Database.query('SELECT Id FROM Account WHERE ' + cond);"), [
            ['partial', ['Account'], ['Id']],
        ]);
        // SELECT に穴があれば項目は取らない (オブジェクトは取る)
        assert.deepEqual(
            await summary("Database.query('SELECT ' + names + ' FROM Lead LIMIT 10');"),
            [['partial', ['Lead'], []]],
        );
    });

    it('名前の直後が分からなければ、名前が続いているかもしれないので取らない', async () => {
        assert.deepEqual(await summary("Database.query('SELECT Id FROM Acc' + suffix);"), [
            ['partial', [], []],
        ]);
    });

    it('サブクエリ (子リレーション) は取らない。分岐で違う文字列は分からない', async () => {
        assert.deepEqual(
            await summary("Database.query('SELECT Id, (SELECT Id FROM Contacts) FROM Account');"),
            [['complete', ['Account'], ['Id']]],
        );
        assert.deepEqual(
            await summary(
                "String q = 'SELECT Id FROM Account'; if (flag) { q = 'SELECT Id FROM Contact'; } Database.query(q);",
            ),
            [['none', [], []]],
        );
    });

    it('SOSL (Search.query) は復元しない', async () => {
        const [query] = await queriesOf("Search.query('FIND {x} RETURNING Account');");
        assert.equal(query?.language, 'sosl');
        assert.equal(query?.restoration, 'none');
    });
});
