import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseApexUnitFiles } from '../../src/analyzer/parser/Apex/unit';
import { getApexUnusedMethods } from '../../src/analyzer/report';
import { Repository } from '../../src/analyzer/unit';

// 使われていない Apex のメソッド (report/apexUnused.ts。docs/plan.md 10 章 P4 の段 1「プロジェクトをまたぐ解析」)

const parse = async (name: string, lines: string[]) => {
    const unit = await parseApexUnitFiles({
        unitType: 'class',
        name,
        filePath: `${name}.cls`,
        source: { fileName: `${name}.cls`, source: lines.join('\n') },
    });
    return { ...unit, filePath: `/repo/${name}.cls` };
};

const repositoryOf = async () =>
    Repository.of(
        '/repo',
        new Map([
            [
                'apexClass',
                [
                    await parse('Handler', ['public interface Handler { void handle(); }']),
                    await parse('Impl', [
                        'public class Impl implements Handler {',
                        '    public void handle() {}',
                        '}',
                    ]),
                    await parse('Service', [
                        'public class Service {',
                        '    public void run(Handler h) { h.handle(); helper(); Util.used(); }',
                        '    private void helper() {}',
                        '    private void orphan() {}',
                        '    private Integer loop(Integer n) { return n > 0 ? loop(n - 1) : 0; }',
                        '    @AuraEnabled public static String forLwc() { return null; }',
                        '    @InvocableMethod public static void forFlow(List<Id> ids) {}',
                        '    global void forPackage() {}',
                        '}',
                    ]),
                    await parse('Util', [
                        'public class Util {',
                        '    public static void used() {}',
                        '    public static void notUsed() {}',
                        '}',
                    ]),
                    await parse('Job', [
                        'public class Job implements Database.Batchable<SObject>, Schedulable {',
                        '    public Database.QueryLocator start(Database.BatchableContext c) { return null; }',
                        '    public void execute(Database.BatchableContext c, List<SObject> rows) {}',
                        '    public void finish(Database.BatchableContext c) {}',
                        '    public void execute(SchedulableContext c) {}',
                        '    public void extra() {}',
                        '}',
                    ]),
                    await parse('JobTest', [
                        '@IsTest private class JobTest {',
                        '    @IsTest static void runs() {}',
                        '    static void setup() {}',
                        '}',
                    ]),
                ],
            ],
        ]),
    );

describe('apex.unusedMethods (使われていない Apex のメソッド)', () => {
    it('呼ばれていないメソッドを出し、入口 (アノテーション・global・プラットフォームが呼ぶメソッド・テスト) は出さない', async () => {
        const rows = getApexUnusedMethods({ after: await repositoryOf() });
        assert.deepEqual(
            rows.map((r) => [r.member, r.access, r.verdict]),
            [
                // インターフェースの型の変数からの呼び出しの候補 (h.handle()) からだけ呼ばれうる
                ['Impl.handle', 'public', 'candidateOnly'],
                // Batch・Schedulable を実装したクラスでも、プラットフォームが呼ばないメソッドは出す
                ['Job.extra', 'public', 'unused'],
                // 自分を呼ぶだけ (再帰) のメソッドは使われていない
                ['Service.loop', 'private', 'unused'],
                ['Service.orphan', 'private', 'unused'],
                // public でも、どこからも呼ばれていなければ出す
                ['Service.run', 'public', 'unused'],
                // ほかのクラスからも呼ばれていない (Util.used は Service.run から呼ばれる)
                ['Util.notUsed', 'public', 'unused'],
            ],
        );
    });

    it('候補の呼び出しからだけ呼ばれうるもの (candidateOnly) は外せる', async () => {
        const rows = getApexUnusedMethods(
            { after: await repositoryOf() },
            { includeCandidates: false },
        );
        assert.ok(!rows.some((r) => r.verdict === 'candidateOnly'));
        assert.ok(rows.some((r) => r.member === 'Service.orphan'));
    });
});
