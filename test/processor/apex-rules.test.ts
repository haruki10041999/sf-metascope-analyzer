import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseApexUnitFiles } from '../../src/analyzer/parser/Apex/unit';
import {
    getApexDataAccess,
    getApexEntryPoints,
    getMetadataFindings,
} from '../../src/analyzer/report';
import { snapshotInputOf } from '../../src/analyzer/report/snapshot';
import { Repository } from '../../src/analyzer/unit';

// アノテーションとクエリの書き方 (processor/Apex/semantic/rules.ts・report/apexEntryPoints.ts。
// docs/plan.md 10 章 P4 の段 1「JSON にあるが使っていない情報」)

const parse = async (name: string, lines: string[]) => {
    const unit = await parseApexUnitFiles({
        unitType: 'class',
        name,
        filePath: `${name}.cls`,
        source: { fileName: `${name}.cls`, source: lines.join('\n') },
    });
    assert.deepEqual(unit.resolvedError, []);
    return { ...unit, filePath: `/repo/${name}.cls` };
};

const repositoryOf = async () =>
    Repository.of(
        '/repo',
        new Map([
            [
                'apexClass',
                [
                    await parse('AccountApi', [
                        "@RestResource(urlMapping='/accounts/*')",
                        'global with sharing class AccountApi {',
                        '    @HttpGet global static Account fetch() { return [SELECT Id FROM Account WITH SECURITY_ENFORCED LIMIT 1]; }',
                        '    @HttpPost global static void create() {}',
                        '}',
                    ]),
                    await parse('AccountService', [
                        'public with sharing class AccountService {',
                        '    @AuraEnabled(cacheable=true)',
                        '    public static List<Account> listAll() { return [SELECT Id FROM Account WITH USER_MODE]; }',
                        "    @InvocableMethod(label='Sync accounts')",
                        '    public static void sync(List<Id> ids) {}',
                        '    @TestVisible public static Integer count;',
                        '    @TestVisible private static Integer hidden;',
                        '    @future public static void push() {',
                        '        new Http().send(new HttpRequest());',
                        '    }',
                        '    @future(callout=true) public static void pushOk() {',
                        '        new Http().send(new HttpRequest());',
                        '    }',
                        '}',
                    ]),
                    await parse('AccountServiceTest', [
                        '@IsTest(SeeAllData=true) private class AccountServiceTest {',
                        '    @IsTest static void lists() { AccountService.listAll(); }',
                        '}',
                    ]),
                ],
            ],
        ]),
    );

describe('Apex のアノテーションとクエリの書き方', () => {
    it('apex.entryPoints: REST・@AuraEnabled・@InvocableMethod・@future を入口として出す', async () => {
        const rows = getApexEntryPoints({ after: await repositoryOf() });
        assert.deepEqual(
            rows.map((r) => {
                const { filePath: _f, sourceKeys: _s, className: _c, ...rest } = r;
                return rest;
            }),
            [
                {
                    member: 'AccountApi.create',
                    kind: 'rest',
                    httpMethod: 'POST',
                    urlMapping: '/accounts/*',
                    usedBy: [],
                },
                {
                    member: 'AccountApi.fetch',
                    kind: 'rest',
                    httpMethod: 'GET',
                    urlMapping: '/accounts/*',
                    usedBy: [],
                },
                {
                    member: 'AccountService.listAll',
                    kind: 'aura',
                    cacheable: true,
                    usedBy: ['apexClass:AccountServiceTest'],
                },
                { member: 'AccountService.push', kind: 'future', callout: false, usedBy: [] },
                { member: 'AccountService.pushOk', kind: 'future', callout: true, usedBy: [] },
                {
                    member: 'AccountService.sync',
                    kind: 'invocable',
                    label: 'Sync accounts',
                    usedBy: [],
                },
            ],
        );
        assert.deepEqual(
            getApexEntryPoints({ after: await repositoryOf() }, { kinds: ['rest'] }).map(
                (r) => r.member,
            ),
            ['AccountApi.create', 'AccountApi.fetch'],
        );
    });

    it('metadata.findings: SeeAllData・不要な @TestVisible・callout=true のない @future の callout・SECURITY_ENFORCED', async () => {
        const findings = getMetadataFindings({ after: await repositoryOf() })
            .filter((f) => f.source === 'apex')
            .map((f) => `${f.code} ${f.unit} ${f.target}`)
            .sort();
        assert.deepEqual(findings, [
            'FUTURE_CALLOUT_NOT_ALLOWED AccountService AccountService.push',
            'QUERY_SECURITY_ENFORCED AccountApi AccountApi.fetch',
            'SEE_ALL_DATA AccountServiceTest AccountServiceTest',
            'TEST_VISIBLE_NOT_NEEDED AccountService AccountService.count',
        ]);
    });

    it('apex.dataAccess: クエリの WITH のアクセスモードを accessLevel に出す', async () => {
        const rows = getApexDataAccess(snapshotInputOf({ after: await repositoryOf() }));
        const levelOf = (member: string) => rows.find((r) => r.member === member)?.accessLevel;
        assert.equal(levelOf('AccountApi.fetch'), 'SECURITY_ENFORCED');
        assert.equal(levelOf('AccountService.listAll'), 'USER_MODE');
    });
});
