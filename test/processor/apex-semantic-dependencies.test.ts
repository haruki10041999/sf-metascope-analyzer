import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import { type ApexUnitType, parseApexUnitFiles } from '../../src/analyzer/parser/Apex/unit';
import { getLegacyApexDependencies as getApexDependencies } from '../../src/analyzer/processor/dependency/apexLegacy';
import type { UnitReference } from '../../src/analyzer/processor/dependency/types';
import {
    analyzeApexUnit,
    apexSemanticDependenciesOf,
} from '../../src/analyzer/processor/Apex/semantic';

// 新しい解析の参照の変換 (src/analyzer/processor/Apex/semantic/dependencies.ts。docs/plan.md 10 章 P2)。
// サンプルのリポジトリのすべての Apex で、今の抽出 (dependency/apex.ts) の参照・定義が、新しい変換にもあることを確かめる

const REPOSITORY = 'docs/examples/repository';
const UNIT_TYPES: Readonly<Record<string, ApexUnitType>> = {
    '.cls': 'class',
    '.trigger': 'trigger',
    '.apex': 'anonymous',
};

/**
 * 今の抽出にだけあってよい参照 (「種類|対象|意味|via|member」)。どれも今の抽出の誤りで、新しい変換は意図して出さない
 * - 標準の関係の先 (Owner.Name を Account.Owner にする)。スキーマを引く参照の解決で決める (docs/plan.md 10 章 P2)
 * - WHERE の別名 (a.Name の a を外さず Account.a にする)
 */
const EXPECTED_ONLY_OLD = new Set([
    'field|Account.Owner|reads|soql.select|ParserTest.relationshipSoql',
    'field|Account.Parent|reads|soql.select|ParserTest.relationshipSoql',
    'field|Account.a|reads|soql.where|ParserTest.relationshipSoql',
    'childRelationshipField|Account.Contacts.Account|reads|soql.subquery|ParserTest.relationshipSoql',
    'field|Contact.Account|reads|soql.select|',
]);

const keyOf = (reference: UnitReference) =>
    [
        reference.refType,
        reference.target,
        reference.kind,
        reference.via,
        reference.from.member ?? '',
    ].join('|');

const sampleFiles = (): string[] =>
    (fs.readdirSync(REPOSITORY, { recursive: true }) as string[])
        .map((file) => file.replaceAll('\\', '/'))
        .filter((file) => UNIT_TYPES[path.extname(file)] !== undefined)
        .sort();

const compare = async (file: string) => {
    const extension = path.extname(file);
    const fileName = path.basename(file);
    const unit = await parseApexUnitFiles({
        unitType: UNIT_TYPES[extension]!,
        name: path.basename(file, extension),
        filePath: fileName,
        source: { fileName, source: fs.readFileSync(path.join(REPOSITORY, file), 'utf8') },
    });
    const analysis = analyzeApexUnit(unit);
    return {
        old: getApexDependencies(unit),
        next: analysis ? apexSemanticDependenciesOf(analysis) : undefined,
    };
};

describe('semantic/dependencies.ts の apexSemanticDependenciesOf', () => {
    it('今の抽出の参照・定義が、新しい変換にもある (意図して出さないものを除く)', async () => {
        const onlyOld: string[] = [];
        const missingDefinitions: string[] = [];
        let compared = 0;
        for (const file of sampleFiles()) {
            const { old, next } = await compare(file);
            if (!next) continue;
            compared++;
            const nextKeys = new Set(next.dependencies.references.map(keyOf));
            for (const key of new Set(old.references.map(keyOf))) {
                if (!nextKeys.has(key)) onlyOld.push(key);
            }
            const nextDefinitions = new Set(
                next.dependencies.definitions.map((d) => `${d.defType}|${d.name}`),
            );
            for (const definition of old.definitions) {
                const key = `${definition.defType}|${definition.name}`;
                if (!nextDefinitions.has(key)) missingDefinitions.push(`${file}: ${key}`);
            }
        }
        assert.ok(compared >= 20, `比べた単位が少ない: ${compared}`);
        assert.deepEqual(missingDefinitions, []);
        assert.deepEqual(
            [...new Set(onlyOld)].filter((key) => !EXPECTED_ONLY_OLD.has(key)),
            [],
        );
        // 意図して出さないものが今の抽出から消えたら、一覧も消す
        assert.deepEqual(
            [...EXPECTED_ONLY_OLD].filter((key) => !onlyOld.includes(key)),
            [],
        );
    });

    it('依存関係には、解決した・標準・名前だけの参照だけを入れる', async () => {
        for (const file of sampleFiles()) {
            const { next } = await compare(file);
            if (!next) continue;
            const converted = new Set(next.dependencies.references.map(keyOf));
            for (const reference of next.references) {
                if (
                    reference.resolution.status === 'candidates' ||
                    reference.resolution.status === 'unknown'
                ) {
                    // 同じ参照が別の場所で解決していることはあるので、場所まで含めて比べる
                    const sameSite = next.dependencies.references.some(
                        (r) =>
                            keyOf(r) === keyOf(reference) &&
                            r.from.expression?.sourceKey === reference.from.expression?.sourceKey,
                    );
                    assert.ok(!sameSite, `${file}: ${keyOf(reference)} が依存関係に入っている`);
                }
            }
            assert.ok(converted.size <= next.references.length);
        }
    });

    it('今の抽出が取りこぼしていた参照を拾う', async () => {
        const { next } = await compare('after/force-app/main/default/classes/ParserTest.cls');
        assert.ok(next);
        const keys = new Set(next.dependencies.references.map(keyOf));
        for (const key of [
            // WHERE の中のサブクエリ (準結合)
            'object|User|queries|soql.from|ParserTest.whereSoql',
            // TYPEOF の WHEN の型ごとの項目
            'field|Opportunity.Amount|reads|soql.select|ParserTest.typeOfSoql',
            // HAVING・GROUP BY の関数の中の項目
            'field|Account.Id|reads|soql.having|ParserTest.aggregateSoql',
            'field|Account.CreatedDate|reads|soql.groupBy|ParserTest.functionSoql',
            // メソッドの戻り値の型をたどった項目 (getAccount().Name)
            'apexTypeMember|Account.Name|reads|member|ParserTest.AccountReader.nameOfAccount',
            // this.x への代入
            'apexTypeMember|ParserTest.name|writes|assignment|ParserTest.ParserTest',
        ]) {
            assert.ok(keys.has(key), key);
        }
        // 標準の関係の先は、変換せずに理由つきで持つ
        const owner = next.references.find((r) => r.target === 'Account.Owner.Name');
        assert.deepEqual(owner?.resolution, {
            status: 'unknown',
            reason: 'relationshipPath',
            detail: 'Owner.Name',
        });
    });

    it('匿名 Apex の DML の対象を、変数の型から決める', async () => {
        const { next } = await compare('after/scripts/apex/parser.apex');
        assert.ok(next);
        const keys = new Set(next.dependencies.references.map(keyOf));
        for (const key of [
            'object|Account|inserts|dml.insert|',
            'object|Account|deletes|dml.delete|',
            'object|Account|inserts|Database.insert|',
        ]) {
            assert.ok(keys.has(key), key);
        }
    });
});
