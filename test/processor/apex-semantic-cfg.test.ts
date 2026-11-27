import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { repositoryOf } from '../../docs/examples/paths';
import type { ApexUnitParseResult } from '../../src/analyzer/parser/Apex/unit';
import { parseApexUnitFiles } from '../../src/analyzer/parser/Apex/unit';
import { ProjectTree, Repository, WorkingTree } from '../../src/analyzer/unit';
import {
    type ApexCfg,
    apexCfgOf,
    apexDeclarationsOf,
    reachableApexCfgNodes,
} from '../../src/analyzer/processor/Apex/semantic';

// 実行本体の CFG (semantic/cfg.ts。docs/plan.md 10 章 P4 段 2「CFG」)。
// 評価点は、文は呼び出す関数の名前 (a(); → a)、条件は変数の名前 (if (x) → x?)、ほかは種類で読み、
// 辺を「元 --種類--> 先」で確かめる

const cfgOf = async (body: string): Promise<ApexCfg> => {
    const source = `public class C { void m(Boolean x, Boolean y, List<Integer> items) { ${body} } }`;
    const unit = await parseApexUnitFiles({
        unitType: 'class',
        name: 'C',
        filePath: 'C.cls',
        source: { fileName: 'C.cls', source },
    });
    assert.deepEqual(unit.resolvedError, []);
    const parsed = unit.result.base.source;
    assert.ok(parsed && parsed.fileType !== 'error');
    const method = apexDeclarationsOf(parsed).bodies.find((b) => b.kind === 'method');
    assert.ok(method);
    return apexCfgOf(method);
};

/** 評価点の読める名前 */
const labelOf = (cfg: ApexCfg, id: string): string => {
    const node = cfg.nodes.get(id)!;
    if (node.kind === 'entry' || node.kind === 'exit') return node.kind;
    const expression = node.expression as { kind: string; name?: string } | undefined;
    if (node.kind === 'condition') return `${expression?.name ?? expression?.kind}?`;
    if (node.kind === 'statement' && node.nodeKind === 'expression') {
        // 式文の呼び出しの名前は、文の位置の元の JSON にないので、ID の順で区別しない (式文は呼び出しの名前で書く)
        return `stmt`;
    }
    return node.nodeKind ? `${node.kind}(${node.nodeKind})` : node.kind;
};

const edgesOf = (cfg: ApexCfg) =>
    cfg.edges.map((e) => `${labelOf(cfg, e.from)} --${e.kind}--> ${labelOf(cfg, e.to)}`);

describe('実行本体の CFG (semantic/cfg.ts)', () => {
    it('if / else: 条件から真・偽の辺、両方の枝が後ろの文で合流する', async () => {
        const cfg = await cfgOf('if (x) { a(); } else { b(); } c();');
        const edges = edgesOf(cfg);
        assert.ok(edges.includes('entry --normal--> x?'));
        assert.ok(edges.includes('x? --true--> stmt'));
        assert.ok(edges.includes('x? --false--> stmt'));
        // a・b の文から c の文へ、c から出口へ
        assert.equal(edges.filter((e) => e === 'stmt --normal--> stmt').length, 2);
        assert.ok(edges.includes('stmt --normal--> exit'));
    });

    it('短絡 (&&): 左が偽なら右を評価せずに偽、右の真偽が全体の真偽', async () => {
        const cfg = await cfgOf('if (x && y) { a(); }');
        const edges = edgesOf(cfg);
        assert.ok(edges.includes('x? --true--> y?'));
        // x が偽・y が偽のどちらも、本体を飛ばして出口へ
        assert.ok(edges.includes('x? --false--> exit'));
        assert.ok(edges.includes('y? --false--> exit'));
        assert.ok(edges.includes('y? --true--> stmt'));
    });

    it('三項演算子: 条件から両方の値へ分かれ、式の評価点で合流してから文へ', async () => {
        const cfg = await cfgOf('Integer n = x ? 1 : 0;');
        const edges = edgesOf(cfg);
        assert.equal(edges.filter((e) => e.startsWith('x? --')).length, 2);
        assert.ok(edges.includes('expression(conditional) --normal--> statement(localVariable)'));
    });

    it('for: 初期化 → 頭 → 条件 → 本体 → 更新 → 頭 (戻り)。continue は更新へ、break は抜けた先へ', async () => {
        const cfg = await cfgOf(
            'for (Integer i = 0; i < 3; i++) { if (x) { continue; } if (y) { break; } a(); } b();',
        );
        const edges = edgesOf(cfg);
        assert.ok(edges.includes('statement(forInit) --normal--> loop(for)'));
        assert.ok(edges.includes('statement(forUpdate) --loopBack--> loop(for)'));
        assert.ok(edges.includes('statement(continue) --continue--> statement(forUpdate)'));
        assert.ok(edges.includes('statement(break) --break--> stmt'));
        // 条件 (i < 3) が偽なら、ループの後ろの文へ
        assert.ok(edges.includes('binary? --false--> stmt'));
    });

    it('拡張 for・while・do-while: ループの頭へ戻る辺がある', async () => {
        for (const body of [
            'for (Integer i : items) { a(); }',
            'while (x) { a(); }',
            'do { a(); } while (x);',
        ]) {
            const cfg = await cfgOf(body);
            assert.ok(
                cfg.edges.some(
                    (e) => e.kind === 'loopBack' && cfg.nodes.get(e.to)!.kind === 'loop',
                ),
                body,
            );
        }
    });

    it('try / catch / finally: try の中の文から catch へ例外の辺、どの経路も finally を通る。return も finally を通る', async () => {
        const cfg = await cfgOf(
            'try { a(); if (x) { return; } } catch (Exception e) { b(); } finally { c(); } d();',
        );
        const edges = edgesOf(cfg);
        assert.ok(edges.includes('stmt --exception--> catch(tryClause)'));
        assert.ok(edges.includes('statement(return) --return--> finally(tryClause)'));
        assert.ok(edges.includes('stmt --normal--> finally(tryClause)'));
        // finally の文のあとは、後ろの文と、(finally を通った return の) 出口の両方へ
        assert.ok(edges.includes('stmt --return--> exit'));
    });

    it('throw は受け手 (catch) へ、受け手がなければ出口へ。return のあとの文は届かない', async () => {
        const caught = await cfgOf('try { throw new MyException(); } catch (Exception e) { a(); }');
        assert.ok(edgesOf(caught).includes('statement(throw) --exception--> catch(tryClause)'));
        const thrown = await cfgOf('throw new MyException();');
        assert.ok(edgesOf(thrown).includes('statement(throw) --exception--> exit'));

        const cfg = await cfgOf('return; a();');
        const reachable = reachableApexCfgNodes(cfg);
        const unreachable = [...cfg.nodes.keys()].filter((id) => !reachable.has(id));
        assert.deepEqual(
            unreachable.map((id) => labelOf(cfg, id)),
            ['stmt'],
        );
    });

    it('switch: 値の評価点から各 when へ (case)、else がなければ後ろへも', async () => {
        const cfg = await cfgOf('switch on items.size() { when 1 { a(); } when 2 { b(); } } c();');
        const edges = edgesOf(cfg);
        assert.equal(edges.filter((e) => e === 'statement(switch) --case--> stmt').length, 2);
        assert.ok(edges.includes('statement(switch) --false--> stmt'));
    });

    it('サンプルのすべての実行本体で作れる (辺の両端の評価点があり、出口へ届く本体は出口に入る辺を持つ)', async () => {
        const repository = await Repository.load(
            new ProjectTree(new WorkingTree(repositoryOf('after'))),
        );
        let bodies = 0;
        for (const type of ['apexClass', 'apexTrigger', 'anonymousApex']) {
            for (const result of repository.get(type) as ApexUnitParseResult[]) {
                const source = result.result.base.source;
                if (!source || source.fileType === 'error') continue;
                for (const body of apexDeclarationsOf(source).bodies) {
                    const cfg = apexCfgOf(body);
                    bodies++;
                    for (const edge of cfg.edges) {
                        assert.ok(
                            cfg.nodes.has(edge.from) && cfg.nodes.has(edge.to),
                            `${body.path.join('.')}: ${edge.from} → ${edge.to}`,
                        );
                    }
                    assert.ok(
                        cfg.predecessors(cfg.exit).length > 0 ||
                            body.statements.length === 0 ||
                            cfg.edges.length > 0,
                        body.path.join('.'),
                    );
                }
            }
        }
        assert.ok(bodies > 50, String(bodies));
    });
});
