import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import { type ApexUnitType, parseApexUnitFiles } from '../../src/analyzer/parser/Apex/unit';
import { analyzeApexUnit as legacyFactsOf } from '../../src/analyzer/processor/Apex/calls';
import { analyzeApexUnit, apexUnitFactsOf } from '../../src/analyzer/processor/Apex/semantic';

// 単位の呼び出し・DML・クエリ (semantic/facts.ts。docs/plan.md 10 章 P2「古い処理からの移行」)。
// サンプルのリポジトリのすべての Apex で、以前の解析 (Apex/calls.ts) の結果が、新しい解析にもあることを確かめる

const REPOSITORY = 'docs/examples/repository';
const UNIT_TYPES: Readonly<Record<string, ApexUnitType>> = {
    '.cls': 'class',
    '.trigger': 'trigger',
    '.apex': 'anonymous',
};

type Fact = {
    kind: 'call' | 'dml' | 'query' | 'trigger';
    sourceKey: string;
    /** 比べる中身 (owner・member・object を除く) */
    body: string;
    owner?: string;
    member?: string;
    object?: string;
};

const sampleFiles = (): string[] =>
    (fs.readdirSync(REPOSITORY, { recursive: true }) as string[])
        .map((file) => file.replaceAll('\\', '/'))
        .filter((file) => UNIT_TYPES[path.extname(file)] !== undefined)
        .sort();

const factsOf = async (file: string) => {
    const extension = path.extname(file);
    const fileName = path.basename(file);
    const unitName = path.basename(file, extension);
    const unit = await parseApexUnitFiles({
        unitType: UNIT_TYPES[extension]!,
        name: unitName,
        filePath: fileName,
        source: { fileName, source: fs.readFileSync(path.join(REPOSITORY, file), 'utf8') },
    });
    const analysis = analyzeApexUnit(unit);
    if (!analysis) return undefined;
    const old = legacyFactsOf(unit);
    const next = apexUnitFactsOf(analysis);
    const context = (c: { member?: string | undefined; isTest: boolean }, inLoop: boolean) => ({
        ...(c.member ? { member: c.member } : {}),
        body: `${inLoop}|${c.isTest}`,
    });
    const flatten = (
        facts: {
            calls: readonly {
                sourceKeys: { sourceKey: string };
                callType: string;
                owner?: string;
                method: string;
                context: { member?: string | undefined; isTest: boolean };
            }[];
            dml: readonly {
                sourceKeys: { sourceKey: string };
                operation: string;
                via: string;
                object?: string;
                allOrNone?: boolean;
                accessLevel?: string;
                context: { member?: string | undefined; isTest: boolean };
            }[];
            queries: readonly {
                sourceKeys: { sourceKey: string };
                language: string;
                objects: string[];
                context: { member?: string | undefined; isTest: boolean };
            }[];
            triggerContexts: readonly {
                sourceKeys: { sourceKey: string };
                variable: string;
                context: { member?: string | undefined };
            }[];
        },
        inLoop: (context: object) => boolean,
    ): Fact[] => [
        ...facts.calls.map((c): Fact => {
            const { member, body } = context(c.context, inLoop(c.context));
            return {
                kind: 'call',
                sourceKey: c.sourceKeys.sourceKey,
                body: `${c.callType}|${c.method}|${body}`,
                ...(c.owner ? { owner: c.owner.toLowerCase() } : {}),
                ...(member ? { member } : {}),
            };
        }),
        ...facts.dml.map((d): Fact => {
            const { member, body } = context(d.context, inLoop(d.context));
            return {
                kind: 'dml',
                sourceKey: d.sourceKeys.sourceKey,
                body: `${d.operation}|${d.via}|${d.allOrNone ?? ''}|${d.accessLevel ?? ''}|${body}`,
                ...(d.object ? { object: d.object } : {}),
                ...(member ? { member } : {}),
            };
        }),
        ...facts.queries.map((q): Fact => {
            const { member, body } = context(q.context, inLoop(q.context));
            return {
                kind: 'query',
                sourceKey: q.sourceKeys.sourceKey,
                body: `${q.language}|${q.objects.join(',')}|${body}`,
                ...(member ? { member } : {}),
            };
        }),
        ...facts.triggerContexts.map((t): Fact => ({
            kind: 'trigger',
            sourceKey: t.sourceKeys.sourceKey,
            body: t.variable,
            ...(t.context.member ? { member: t.context.member } : {}),
        })),
    ];
    return {
        unitName,
        old: flatten(old, (c) => (c as { loopDepth: number }).loopDepth > 0),
        next: flatten(next, (c) => (c as { inLoop: boolean }).inLoop),
    };
};

/**
 * 以前の解析と違ってよいもの (どれも新しい解析の方が正しい):
 * - owner: レシーバーがコレクション・分からない式のとき、以前は書いた文字 (acc.name・names) を持ち主にしていた。
 *   新しい解析は型で決める (コレクションは なし、String の変数は String)。リポジトリの型に当たる持ち主は変えない
 *   (呼び出しの流れは、リポジトリの型に当たる持ち主だけを使う)
 * - member: トリガー・匿名 Apex の中のメソッドは、以前は単位名 (か なし)。新しい解析は 単位名.メソッド
 *   (依存関係の参照の member と同じ)
 * - object: 匿名 Apex の直下の変数の型が、以前は分からなかった (DML の対象)
 */
const allowedDifference = (
    old: Fact,
    next: Fact,
    unitName: string,
    repositoryTypes: Set<string>,
) => {
    if (old.kind !== next.kind || old.body !== next.body) return false;
    const ownerOk =
        old.owner === next.owner ||
        (!repositoryTypes.has(old.owner ?? '') && !repositoryTypes.has(next.owner ?? ''));
    const memberOk =
        old.member === next.member ||
        ((old.member === undefined || old.member === unitName) &&
            next.member?.startsWith(`${unitName}.`) === true);
    const objectOk =
        old.object === next.object || (old.object === undefined && next.object !== undefined);
    return ownerOk && memberOk && objectOk;
};

const same = (a: Fact, b: Fact) =>
    a.kind === b.kind &&
    a.body === b.body &&
    a.owner === b.owner &&
    a.member === b.member &&
    a.object === b.object;

const show = (fact: Fact) =>
    [
        fact.kind,
        fact.sourceKey,
        fact.body,
        fact.owner ?? '',
        fact.member ?? '',
        fact.object ?? '',
    ].join('|');

describe('semantic/facts.ts の apexUnitFactsOf', () => {
    it('以前の解析の呼び出し・DML・クエリが、新しい解析にもある (正しくしたものを除く)', async () => {
        const files = sampleFiles();
        const repositoryTypes = new Set(
            files
                .filter((f) => f.endsWith('.cls'))
                .map((f) => path.basename(f, '.cls').toLowerCase()),
        );
        const problems: string[] = [];
        let allowed = 0;
        let compared = 0;
        for (const file of files) {
            const facts = await factsOf(file);
            if (!facts) continue;
            compared++;
            const nextByKey = new Map(facts.next.map((f) => [`${f.kind}|${f.sourceKey}`, f]));
            for (const old of facts.old) {
                const next = nextByKey.get(`${old.kind}|${old.sourceKey}`);
                if (next && same(old, next)) continue;
                if (next && allowedDifference(old, next, facts.unitName, repositoryTypes)) {
                    allowed++;
                    continue;
                }
                problems.push(`${file}: ${show(old)} → ${next ? show(next) : '(なし)'}`);
            }
        }
        if (process.env.FACTS_DEBUG) console.log(`allowed ${allowed}`, problems);
        assert.ok(compared >= 20, `比べた単位が少ない: ${compared}`);
        assert.deepEqual(problems, []);
    });
});
