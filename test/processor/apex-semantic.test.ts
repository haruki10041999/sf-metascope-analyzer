import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import { type ApexUnitType, parseApexUnitFiles } from '../../src/analyzer/parser/Apex/unit';
import {
    type ApexSemanticAnalysis,
    analyzeApexUnit,
    apexTypeTextOf,
} from '../../src/analyzer/processor/Apex/semantic';

// Apex の単位 1 つの解析の入口 (src/analyzer/processor/Apex/semantic/analyze.ts。docs/plan.md 10 章 P2)。
// サンプルのリポジトリ (before / after) のすべての Apex を解析し、結果の整合と主な値を確かめる

const REPOSITORY = 'docs/examples/repository';

const UNIT_TYPES: Readonly<Record<string, ApexUnitType>> = {
    '.cls': 'class',
    '.trigger': 'trigger',
    '.apex': 'anonymous',
};

/** サンプルの Apex のソース (相対パス) */
const sampleFiles = (): string[] =>
    (fs.readdirSync(REPOSITORY, { recursive: true }) as string[])
        .map((file) => file.replaceAll('\\', '/'))
        .filter((file) => UNIT_TYPES[path.extname(file)] !== undefined)
        .sort();

const analyzeFile = async (file: string) => {
    const fileName = path.basename(file);
    const extension = path.extname(file);
    const unit = await parseApexUnitFiles({
        unitType: UNIT_TYPES[extension]!,
        name: path.basename(file, extension),
        filePath: fileName,
        source: { fileName, source: fs.readFileSync(path.join(REPOSITORY, file), 'utf8') },
    });
    return { unit, analysis: analyzeApexUnit(unit) };
};

/** 結果の整合 (ID の一意・参照の行き先・呼び出し先の候補) */
const assertConsistent = (file: string, analysis: ApexSemanticAnalysis) => {
    const ids = new Set(analysis.declarations.map((d) => d.id));
    assert.equal(ids.size, analysis.declarations.length, `${file}: 宣言の ID が重複`);
    const methods = new Set(
        analysis.declarations
            .filter((d) => d.kind === 'method' || d.kind === 'interfaceMethod')
            .map((d) => d.id),
    );
    for (const body of analysis.bodies) {
        assert.ok(ids.has(body.body.id), `${file}: 本体 ${body.body.path.join('.')} の宣言がない`);
        for (const access of body.accesses) {
            if (access.target.kind === 'variable' || access.target.kind === 'member') {
                assert.ok(ids.has(access.target.declarationId), `${file}: ${access.name} の行き先`);
            }
        }
        for (const variable of body.variables) {
            assert.ok(
                variable.bodyId === body.body.id || body.body.parameterIds.includes(variable.id),
                `${file}: ${variable.name} は本体 ${body.body.path.join('.')} の変数ではない`,
            );
        }
        for (const call of body.calls) {
            assert.ok(call.returnType, `${file}: ${call.name} の戻り値の型がない`);
            for (const id of call.candidateIds) {
                assert.ok(methods.has(id), `${file}: ${call.name} の候補がメソッドでない`);
            }
        }
    }
};

describe('semantic/analyze.ts の analyzeApexUnit', () => {
    it('サンプルのリポジトリのすべての Apex を解析できる (構文エラーの単位は undefined)', async () => {
        const files = sampleFiles();
        assert.ok(files.length >= 20, `サンプルの Apex が少ない: ${files.length}`);
        for (const file of files) {
            const { unit, analysis } = await analyzeFile(file);
            const broken = unit.result.base.source?.fileType === 'error';
            if (broken) {
                assert.equal(analysis, undefined, `${file}: 構文エラーの単位は解析しない`);
                continue;
            }
            assert.ok(analysis, `${file}: 解析できない`);
            assertConsistent(file, analysis);
        }
    });

    it('AccountService.cls: 本体ごとの変数・クエリ・呼び出しの型', async () => {
        const { analysis } = await analyzeFile(
            'after/force-app/main/default/classes/AccountService.cls',
        );
        assert.ok(analysis);
        assert.equal(analysis.name, 'AccountService');
        assert.equal(analysis.unitType, 'class');
        const bodyOf = (bodyPath: string) => {
            const body = analysis.bodies.find((b) => b.body.path.join('.') === bodyPath);
            assert.ok(body, bodyPath);
            return body;
        };

        // sync: 引数 ids・ループの変数 acc・SOQL のバインド ids
        const sync = bodyOf('AccountService.sync');
        assert.deepEqual(
            sync.variables.map((v) => `${v.kind}:${v.name}`),
            ['parameter:ids', 'localVariable:accounts', 'forEachVariable:acc'],
        );
        assert.equal(sync.queries.length, 1);
        assert.deepEqual(
            sync.queries[0]?.binds.map((b) =>
                b.ref.kind === 'name' ? `${b.ref.name}:${b.ref.target.kind}` : b.ref.kind,
            ),
            ['ids:variable'],
        );
        // acc.Name.trim(): レシーバーは SObject の項目なので、呼び出し先は決められない
        const trim = sync.calls.find((c) => c.name === 'trim');
        assert.ok(trim?.receiverType);
        assert.equal(apexTypeTextOf(trim.receiverType), 'unknown(sObjectField: Account.Name)');
        assert.equal(
            apexTypeTextOf(trim.returnType),
            'unknown(unknownReceiver: sObjectField: Account.Name → trim)',
        );

        // execute: sync(...) は単位の中のメソッドに決まる
        const execute = bodyOf('AccountService.execute');
        const callSync = execute.calls.find((c) => c.name === 'sync');
        const syncDeclaration = analysis.declarations.find(
            (d) => d.kind === 'method' && d.name === 'sync',
        );
        assert.deepEqual(callSync?.candidateIds, [syncDeclaration?.id]);
        assert.equal(callSync && apexTypeTextOf(callSync.returnType), 'void');

        // report: System.debug は System.System の標準メソッド
        const debug = bodyOf('AccountService.report').calls.find((c) => c.name === 'debug');
        assert.equal(
            debug && apexTypeTextOf(debug.returnType),
            'unknown(standardMethod: System.System.debug)',
        );

        // stats: 集計のクエリと、子リレーションのサブクエリ
        const stats = bodyOf('AccountService.stats');
        assert.deepEqual(
            stats.queries.map((q) => `${q.role}:${q.objects.map((o) => o.name).join(',')}`),
            ['query:Account', 'childRelationship:Contacts'],
        );
        assert.equal(stats.queries[0]?.facts.isAggregate, true);
        assert.equal(stats.queries[0]?.facts.usingScope, 'team');
        assert.deepEqual(stats.queries[0]?.facts.forClauses, ['REFERENCE']);

        // getter・setter・初期化ブロック・コンストラクターも本体になる
        const kinds = new Set(analysis.bodies.map((b) => b.body.kind));
        for (const kind of ['method', 'constructor', 'initializer', 'getter', 'setter']) {
            assert.ok(kinds.has(kind as never), `本体の種類 ${kind}`);
        }
    });

    it('AccountTrigger.trigger: ほかの単位の型は名前の並び、標準の型のメンバーは理由つき', async () => {
        const { analysis } = await analyzeFile(
            'after/force-app/main/default/triggers/AccountTrigger.trigger',
        );
        assert.ok(analysis);
        const [trigger] = analysis.bodies;
        assert.equal(trigger?.body.kind, 'trigger');
        const validate = trigger?.calls.find((c) => c.name === 'validate');
        assert.ok(validate);
        // AccountService は別の単位のクラス (単位をまたぐ解決は P3)
        assert.equal(
            apexTypeTextOf(validate.returnType),
            'unknown(unresolvedName: AccountService.validate)',
        );
        assert.ok(validate.argRefs[0]);
    });

    it('リポジトリの型を渡すと、名前空間を書かない標準の型より優先する', async () => {
        const fileName = 'Uses.cls';
        const unit = await parseApexUnitFiles({
            unitType: 'class',
            name: 'Uses',
            filePath: fileName,
            source: {
                fileName,
                source: 'public class Uses { void run() { Test.run(); } }',
            },
        });
        const standard = analyzeApexUnit(unit);
        const withRepository = analyzeApexUnit(unit, {
            isRepositoryType: (p) => p.join('.').toLowerCase() === 'test',
        });
        const returnOf = (analysis: ApexSemanticAnalysis | undefined) => {
            const call = analysis?.bodies[0]?.calls[0];
            return call && apexTypeTextOf(call.returnType);
        };
        assert.equal(returnOf(standard), 'unknown(standardMethod: System.Test.run)');
        assert.equal(returnOf(withRepository), 'unknown(unresolvedName: Test.run)');
    });
});
