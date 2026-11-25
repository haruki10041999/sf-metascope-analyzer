import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseApexUnitFiles } from '../../src/analyzer/parser/Apex/unit';
import { analyzeApexUnit, apexMetricsOf } from '../../src/analyzer/processor/Apex/semantic';

// 実行本体ごとのメトリクス (semantic/metrics.ts。docs/plan.md 10 章 P4 の段 1)。
// 期待する値は、metrics.ts の冒頭の数え方で手で数えたもの

const metricsOf = async (name: string, lines: string[]) => {
    const unit = await parseApexUnitFiles({
        unitType: 'class',
        name,
        filePath: `${name}.cls`,
        source: { fileName: `${name}.cls`, source: lines.join('\n') },
    });
    assert.deepEqual(unit.resolvedError, []);
    const analysis = analyzeApexUnit(unit);
    assert.ok(analysis);
    return apexMetricsOf(analysis);
};

describe('semantic/metrics.ts の apexMetricsOf', () => {
    it('循環的複雑度・認知的複雑度・文の数・ネスト・SOQL / DML・呼び出しを数える', async () => {
        const metrics = await metricsOf('M', [
            'public class M {',
            '    Integer total;',
            '    public M() { total = 0; }',
            '    public Integer score(List<Account> accounts, Boolean flag) {',
            '        Integer s = 0;',
            '        for (Account a : accounts) {',
            '            if (a.Name != null && a.Name.length() > 3 && flag) {',
            '                s += 1;',
            '            } else if (flag || a.Industry == null) {',
            '                s += 2;',
            '            } else {',
            '                update a;',
            '            }',
            '        }',
            '        try {',
            "            insert new Account(Name = 'x');",
            '        } catch (DmlException e) {',
            '            s = flag ? 1 : 2;',
            '        }',
            '        switch on s {',
            '            when 1 { s++; }',
            '            when 2 { s--; }',
            '            when else { s = 0; }',
            '        }',
            '        List<Account> rows = [SELECT Id FROM Account];',
            '        return s + score(rows, false);',
            '    }',
            '}',
        ]);
        const score = metrics.find((m) => m.member === 'M.score')!;
        assert.deepEqual(
            {
                cyclomatic: score.cyclomatic,
                cognitive: score.cognitive,
                statements: score.statements,
                maxNesting: score.maxNesting,
            },
            {
                // 1 + for + if・else if + && 2 つ + || + catch + 三項 + when 2 つ
                cyclomatic: 11,
                // for 1 + if 2 (深さ 1) + else if 1 + else 1 + && の続き 1 + || 1 + catch 1 + 三項 2 (catch の中) +
                // switch 1 + 再帰 1
                cognitive: 12,
                statements: 15,
                // for の中の if
                maxNesting: 2,
            },
        );
        assert.deepEqual(
            [score.soql, score.soqlInLoop, score.sosl, score.dml, score.dmlInLoop],
            [1, 0, 0, 2, 1],
        );
        assert.equal(score.calls, 2);
        assert.deepEqual(score.callees, ['M.score', 'length']);

        const constructor = metrics.find((m) => m.kind === 'constructor')!;
        assert.deepEqual(
            [
                constructor.member,
                constructor.cyclomatic,
                constructor.cognitive,
                constructor.statements,
            ],
            ['M.M', 1, 0, 1],
        );
    });

    it('getter・setter は同じ member でも本体ごとに分け、入れ子の if は深さを足す', async () => {
        const metrics = await metricsOf('P', [
            'public class P {',
            '    public Integer value {',
            '        get { if (value == null) { if (value == 0) { return 1; } } return value; }',
            '        set { value = v(value); }',
            '    }',
            '    Integer v(Integer x) { return x; }',
            '}',
        ]);
        const getter = metrics.find((m) => m.kind === 'getter')!;
        const setter = metrics.find((m) => m.kind === 'setter')!;
        assert.equal(getter.member, 'P.value');
        assert.equal(setter.member, 'P.value');
        // if 1 + 入れ子の if 2 (深さ 1)
        assert.deepEqual([getter.cyclomatic, getter.cognitive, getter.maxNesting], [3, 3, 2]);
        assert.deepEqual([setter.calls, setter.callees], [1, ['P.v']]);
        assert.equal(getter.calls, 0);
    });
});
