import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseApexUnitFiles } from '../../src/analyzer/parser/Apex/unit';
import {
    type ApexDataflow,
    type ApexVariableAccess,
    analyzeApexBodies,
    apexDataflowOf,
    apexDeclarationsOf,
} from '../../src/analyzer/processor/Apex/semantic';

// 実行本体の値の解析 (semantic/dataflow.ts。到達定義と定数伝播。docs/plan.md 10 章 P4 段 2)。
// 最後の use(v) の v の読みに届く定義と値を確かめる

const flowOf = async (body: string) => {
    const source = `public class C { void m(Boolean flag, Integer p) { ${body} } }`;
    const unit = await parseApexUnitFiles({
        unitType: 'class',
        name: 'C',
        filePath: 'C.cls',
        source: { fileName: 'C.cls', source },
    });
    assert.deepEqual(unit.resolvedError, []);
    const parsed = unit.result.base.source;
    assert.ok(parsed && parsed.fileType !== 'error');
    const analysis = analyzeApexBodies(apexDeclarationsOf(parsed)).find(
        (a) => a.body.kind === 'method',
    );
    assert.ok(analysis);
    const flow = apexDataflowOf(analysis);
    /** 名前の変数の、最後の読み */
    const lastRead = (name: string): ApexVariableAccess => {
        const reads = analysis.accesses.filter(
            (a) => a.name === name && (a.access === 'read' || a.access === 'readWrite'),
        );
        const last = reads[reads.length - 1];
        assert.ok(last, `no read of ${name}`);
        return last;
    };
    return { flow, lastRead };
};

const valueOf = (flow: ApexDataflow, access: ApexVariableAccess) => {
    const value = flow.valueOf(access);
    return value.kind === 'constant' ? value.value : `unknown:${value.reason}`;
};

describe('値の解析 (semantic/dataflow.ts)', () => {
    it('直列: 代入で値が変わり、x++ は更新前の値、++x は更新後の値', async () => {
        const { flow, lastRead } = await flowOf(
            'Integer x = 1; Integer old = x++; Integer y = 5; Integer z = ++y; x = 10; use(old); use(z); use(x);',
        );
        assert.equal(valueOf(flow, lastRead('old')), 1);
        assert.equal(valueOf(flow, lastRead('z')), 6);
        assert.equal(valueOf(flow, lastRead('x')), 10);
    });

    it('分岐: 両方の枝で同じ定数なら定数、違えば unknown (届く定義は両方)', async () => {
        const same = await flowOf('Integer a; if (flag) { a = 1; } else { a = 1; } use(a);');
        assert.equal(valueOf(same.flow, same.lastRead('a')), 1);
        const differ = await flowOf('Integer a = 0; if (flag) { a = 1; } use(a);');
        assert.equal(valueOf(differ.flow, differ.lastRead('a')), 'unknown:branches');
        assert.equal(differ.flow.reachingDefinitions(differ.lastRead('a')).length, 2);
    });

    it('三項: 条件が分からなければ、両方の値が同じときだけ定数', async () => {
        const { flow, lastRead } = await flowOf(
            'final Integer count = flag ? 1 : 0; final Integer one = flag ? 1 : 1; use(count); use(one);',
        );
        assert.equal(valueOf(flow, lastRead('count')), 'unknown:branches');
        assert.equal(valueOf(flow, lastRead('one')), 1);
        // 届く定義は宣言の初期値 1 つ (値の由来は初期値の式)
        assert.equal(flow.reachingDefinitions(lastRead('count'))[0]?.kind, 'initializer');
    });

    it('片方の枝が return したら、残った経路の値を使う', async () => {
        const { flow, lastRead } = await flowOf(
            'Integer a = 1; if (flag) { a = 2; return; } use(a);',
        );
        assert.equal(valueOf(flow, lastRead('a')), 1);
    });

    it('ループ: 戻りの辺の定義も届く (ループの中の再代入で unknown)。文字列の連結は定数', async () => {
        const loop = await flowOf('Integer i = 0; while (flag) { i = i + 1; } use(i);');
        assert.equal(loop.flow.reachingDefinitions(loop.lastRead('i')).length, 2);
        assert.notEqual(typeof valueOf(loop.flow, loop.lastRead('i')), 'number');
        const text = await flowOf("String q = 'SELECT Id FROM '; q = q + 'Account'; use(q);");
        assert.equal(valueOf(text.flow, text.lastRead('q')), 'SELECT Id FROM Account');
    });

    it('例外の経路: try の中の代入は、catch の中の読みにも、代入前の値とともに届く', async () => {
        const { flow, lastRead } = await flowOf(
            'Integer a = 1; try { a = 2; work(); } catch (Exception e) { use(a); }',
        );
        const definitions = flow.reachingDefinitions(lastRead('a'));
        assert.equal(definitions.length, 2);
        assert.equal(valueOf(flow, lastRead('a')), 'unknown:branches');
    });

    it('引数・呼び出しの結果は unknown (理由つき)', async () => {
        const { flow, lastRead } = await flowOf(
            'Integer a = p; Integer b = compute(); use(a); use(b);',
        );
        assert.equal(valueOf(flow, lastRead('a')), 'unknown:parameter');
        assert.equal(valueOf(flow, lastRead('b')), 'unknown:call');
    });
});
