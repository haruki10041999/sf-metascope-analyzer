import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { type ApexUnitType, parseApexUnitFiles } from '../../src/analyzer/parser/Apex/unit';
import { getApexTests, getApexTriggerHandlers, getObjectUsage } from '../../src/analyzer/report';
import { Repository } from '../../src/analyzer/unit';

// プロジェクトをまたぐ解析 (report/crossProject.ts。docs/plan.md 10 章 P4 の段 1)

const parse = async (unitType: ApexUnitType, name: string, lines: string[]) => {
    const extension = unitType === 'trigger' ? 'trigger' : 'cls';
    const unit = await parseApexUnitFiles({
        unitType,
        name,
        filePath: `${name}.${extension}`,
        source: { fileName: `${name}.${extension}`, source: lines.join('\n') },
    });
    return { ...unit, filePath: `/repo/${name}.${extension}` };
};

const repositoryOf = async () =>
    Repository.of(
        '/repo',
        new Map([
            [
                'apexClass',
                [
                    await parse('class', 'AccountHandler', [
                        'public class AccountHandler {',
                        '    public static void run(List<Account> rows) { Helper.go(); }',
                        '}',
                    ]),
                    await parse('class', 'Helper', [
                        'public class Helper {',
                        '    public static void go() {}',
                        '}',
                    ]),
                    await parse('class', 'Lonely', [
                        'public class Lonely {',
                        '    void x() {}',
                        '}',
                    ]),
                    await parse('class', 'AccountTest', [
                        '@IsTest private class AccountTest {',
                        "    @IsTest static void inserts() { insert new Account(Name = 'x'); }",
                        '}',
                    ]),
                    await parse('class', 'HelperTest', [
                        '@IsTest private class HelperTest {',
                        '    @IsTest static void calls() { Helper.go(); }',
                        '}',
                    ]),
                ],
            ],
            [
                'apexTrigger',
                [
                    await parse('trigger', 'AccountTrg', [
                        'trigger AccountTrg on Account (before insert) {',
                        '    AccountHandler.run(Trigger.new);',
                        '}',
                    ]),
                    // Account の insert では動かない (オブジェクトもイベントも違う)
                    await parse('trigger', 'ContactTrg', [
                        'trigger ContactTrg on Contact (after delete) {',
                        '    Helper.go();',
                        '}',
                    ]),
                ],
            ],
        ]),
    );

describe('プロジェクトをまたぐ解析', () => {
    it('apex.triggerHandlers: トリガーから呼び出しをたどって届くクラスと段数・経路', async () => {
        const rows = getApexTriggerHandlers(
            { after: await repositoryOf() },
            { triggers: ['AccountTrg'] },
        );
        assert.deepEqual(
            rows.map((r) => [r.trigger, r.object, r.events, r.handler, r.depth, r.path]),
            [
                [
                    'AccountTrg',
                    'Account',
                    ['before insert'],
                    'AccountHandler',
                    1,
                    ['AccountHandler'],
                ],
                [
                    'AccountTrg',
                    'Account',
                    ['before insert'],
                    'Helper',
                    2,
                    ['AccountHandler', 'Helper'],
                ],
            ],
        );
    });

    it('apex.tests: 呼び出しでたどるテストと、DML で動くトリガーを通って届くテスト。テストのないものは空', async () => {
        const rows = getApexTests({ after: await repositoryOf() });
        const testsOf = (name: string) =>
            rows.find((r) => r.name === name)!.tests.map((t) => [t.test, t.via, t.depth]);
        // AccountTest の insert Account で AccountTrg (before insert) が動き、そこから AccountHandler → Helper
        assert.deepEqual(testsOf('AccountTrg'), [['AccountTest', 'dml', 1]]);
        assert.deepEqual(testsOf('AccountHandler'), [['AccountTest', 'dml', 2]]);
        assert.deepEqual(testsOf('Helper'), [
            ['HelperTest', 'call', 1],
            ['AccountTest', 'dml', 3],
        ]);
        // オブジェクト・イベントの合わないトリガーと、どこからも届かないクラスは、テストがない
        assert.deepEqual(testsOf('ContactTrg'), []);
        assert.deepEqual(testsOf('Lonely'), []);
        // テストクラスそのものは対象にしない
        assert.ok(!rows.some((r) => r.name === 'AccountTest'));
        // テストのないものだけ
        assert.deepEqual(
            getApexTests({ after: await repositoryOf() }, { untestedOnly: true }).map(
                (r) => r.name,
            ),
            ['Lonely', 'ContactTrg'],
        );
    });

    it('object.usage: オブジェクトごとの、使っている単位と操作', async () => {
        const rows = getObjectUsage({ after: await repositoryOf() }, { objects: ['Account'] });
        const operationsOf = (unit: string) => rows.find((r) => r.unit === unit)?.operations;
        // new Account(...) は作る辺 (creates) で、操作は insert
        assert.deepEqual(operationsOf('AccountTest'), ['insert']);
        assert.deepEqual(operationsOf('AccountTrg'), ['trigger']);
        assert.deepEqual(operationsOf('AccountHandler'), ['use']);
        assert.ok(rows.every((r) => r.object === 'Account'));
    });
});
