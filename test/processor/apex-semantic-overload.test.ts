import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseApexUnitFiles } from '../../src/analyzer/parser/Apex/unit';
import { analyzeApexUnit, apexRepositoryIndexOf } from '../../src/analyzer/processor/Apex/semantic';

// オーバーロードを引数の型で絞る (semantic/type.ts の methodCandidatesOf。docs/plan.md 10 章 P4 の段 1)。
// 引数の数で決まらないとき、確実に合わないものを外し、型がぴったり合う引数の多いものを選ぶ

const parse = (name: string, lines: string[]) =>
    parseApexUnitFiles({
        unitType: 'class',
        name,
        filePath: `${name}.cls`,
        source: { fileName: `${name}.cls`, source: lines.join('\n') },
    });

/** 本体 run の呼び出し (書いた順) の、呼び出し先の候補の引数の型 */
const candidatesOf = async (
    units: Awaited<ReturnType<typeof parse>>[],
    target: Awaited<ReturnType<typeof parse>>,
) => {
    const index = apexRepositoryIndexOf(units);
    const analysis = analyzeApexUnit(target, {
        repository: { index, unit: target.result.base.name },
    })!;
    const byId = new Map(analysis.declarations.map((d) => [d.id, d]));
    const run = analysis.bodies.find((b) => b.body.path.at(-1) === 'run')!;
    return run.calls
        .filter((call) => call.kind === 'method')
        .map((call) =>
            call.candidateIds.map((id) => {
                const method = byId.get(id) ?? index.get(id);
                const parameters = method && 'parameterIds' in method ? method.parameterIds : [];
                return parameters
                    .map((p) => {
                        const parameter = byId.get(p) ?? index.get(p);
                        return parameter?.kind === 'parameter'
                            ? JSON.stringify(parameter.type).match(
                                  /"(?:primitiveType|customType)":\[?"([^"]+)"/,
                              )?.[1]
                            : '?';
                    })
                    .join(',');
            }),
        );
};

describe('オーバーロードを引数の型で絞る', () => {
    it('基本の型・文字列・SObject・継承で、数が同じオーバーロードを選び分ける', async () => {
        const unit = await parse('O', [
            'public class O {',
            '    public virtual class Base {}',
            '    public class Child extends Base {}',
            '    Integer calc(Integer a, Integer b) { return a; }',
            '    Decimal calc(Decimal a, Decimal b) { return a; }',
            '    void show(String s) {}',
            '    void show(Integer n) {}',
            '    void save(Account a) {}',
            '    void save(Contact c) {}',
            '    void take(Base b) {}',
            '    void take(String s) {}',
            '    void run(Account acc, Child child, Object any) {',
            '        calc(1, 2);',
            '        calc(1.5, 2.5);',
            "        show('x');",
            '        save(acc);',
            '        take(child);',
            '        show(any.toString());',
            '    }',
            '}',
        ]);
        assert.deepEqual(await candidatesOf([unit], unit), [
            ['Integer,Integer'],
            ['Decimal,Decimal'],
            ['String'],
            ['Account'],
            ['Base'],
            // any.toString() 自体 (Object のメソッド) は単位の中にない。引数の中の呼び出しが先に並ぶ
            [],
            // any.toString() の型は分からないので、どちらも残す
            ['String', 'Integer'],
        ]);
    });

    it('ほかの単位のメソッドのオーバーロードも、引数の型で絞る', async () => {
        const service = await parse('Service', [
            'public class Service {',
            '    public static void save(Account a) {}',
            '    public static void save(Contact c) {}',
            '}',
        ]);
        const caller = await parse('Caller', [
            'public class Caller {',
            '    void run(Contact c) { Service.save(c); }',
            '}',
        ]);
        assert.deepEqual(await candidatesOf([service, caller], caller), [['Contact']]);
    });
});
