import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseApexUnitFiles, type ApexUnitParseResult } from '../../src/analyzer/parser/Apex';
import { makeApexUnitDiffs } from '../../src/analyzer/processor/Apex/diff/unit';

import { find } from './helpers';

/** クラス A の単位 (ソースだけ) を解析する。単位の解析はファイルを読まない (parser/Apex/unit.ts) */
const parseSource = (source: string): Promise<ApexUnitParseResult> =>
    parseApexUnitFiles({
        unitType: 'class',
        name: 'A',
        filePath: 'A.cls',
        source: { fileName: 'A.cls', source },
    });

const SOURCE = `public class A {
    private Integer first = 1, second = 2;

    public void run() {
        String id = '001000000000001AAA';
        Integer total = first + second;
        Account acc = new Account(Name = 'x');
        Object o = (Object) acc;
        List<List<SObject>> r = [FIND 'Acme' RETURNING Account WITH SNIPPET (target_length = 120)];
    }
}
`;

/** sourceObject に、その objectKey / sourceKey の位置があるか */
const hasSource = (result: ApexUnitParseResult, keys: { objectKey: string; sourceKey: string }) =>
    result.result.sourceObject.some(
        (o) =>
            o.objectKey === keys.objectKey && o.source.some((s) => s.sourceKey === keys.sourceKey),
    );

describe('Apex の JSON: 式・変数の位置', () => {
    it('式 (リテラル・識別子・new・代入・キャスト) と変数 (variants) は sourceKeys を持ち、sourceObject に位置がある', async () => {
        const result = await parseSource(SOURCE);
        const base = result.result.base;
        // 文字列のリテラルは引用符を持たない (段階 A2)
        const literal = find(
            base,
            (n) => n.kind === 'string' && n.value === '001000000000001AAA',
        )[0];
        assert.ok(literal?.sourceKeys, 'literal');
        assert.ok(hasSource(result, literal.sourceKeys));

        const formula = find(base, (n) => n.kind === 'binary' && n.operator === '+')[0];
        assert.ok(formula?.sourceKeys, 'binary');
        const identifier = find(base, (n) => n.kind === 'identifier' && n.name === 'first')[0];
        assert.ok(identifier && hasSource(result, identifier.sourceKeys), 'identifier');
        const newInstance = find(base, (n) => n.kind === 'new')[0];
        assert.ok(newInstance?.sourceKeys, 'new');
        assert.deepEqual(newInstance.newType.customType, ['Account']);
        assert.ok(hasSource(result, newInstance.newType.sourceKeys), 'new の型');
        const assignment = find(newInstance.arg, (n) => n.kind === 'assignment')[0];
        assert.ok(assignment?.sourceKeys, 'assignment');
        const cast = find(base, (n) => n.kind === 'cast')[0];
        assert.ok(cast?.sourceKeys, 'cast');

        const variants = find(base, (n) => n.kind === 'field')[0]?.variants;
        assert.deepEqual(
            variants.map((v: { name: string }) => v.name),
            ['first', 'second'],
        );
        assert.ok(
            variants.every((v: { sourceKeys: { objectKey: string; sourceKey: string } }) =>
                hasSource(result, v.sourceKeys),
            ),
        );
    });

    it('位置だけを変えても Diff は unchanged のまま (式の sourceKeys は値の比較に使わない)', async () => {
        const before = await parseSource(SOURCE);
        const after = await parseSource(`// header\n\n${SOURCE}`);
        const statuses = new Set<string>();
        find(makeApexUnitDiffs([before], [after]), (n) => typeof n.status === 'string').forEach(
            (n) => statuses.add(n.status),
        );
        assert.deepEqual([...statuses], ['unchanged']);
    });

    it('リテラルを変えると、その式だけが changed になる', async () => {
        const before = await parseSource(SOURCE);
        const after = await parseSource(
            SOURCE.replace("'001000000000001AAA'", "'001000000000002AAA'"),
        );
        // 単位・ソースの入れ物の changed は除き、ソースの中身の差分の中で数える
        const [diff] = makeApexUnitDiffs([before], [after]);
        const content = (diff!.content as { fields: { source: { fields: { content: unknown } } } })
            .fields.source.fields.content;
        const changed = find(content, (n) => n.status === 'changed');
        assert.ok(changed.length > 0);
        assert.ok(changed.length < 10, `changed: ${changed.length}`);
    });

    it('sourceObject の context は元のソース (空白・改行を残す)', async () => {
        const result = await parseSource(SOURCE);
        const contexts = result.result.sourceObject.map((o) => o.context);
        assert.ok(contexts.includes('first + second'));
        // メソッドの範囲は修飾子 (public) の後ろから
        assert.ok(contexts.some((c) => c.startsWith('void run() {\n')));
    });

    it('WITH SNIPPET (target_length = n) は targetLength に持つ', async () => {
        const result = await parseSource(SOURCE);
        const snippets = find(result.result.base, (n) => n.mode === 'SNIPPET');
        assert.deepEqual(
            snippets.map(({ sourceKeys: _sourceKeys, ...rest }) => rest),
            [{ kind: 'soslWith', mode: 'SNIPPET', targetLength: '120' }],
        );
        // WITH 句もノードで、位置が sourceObject にある (apex 7)
        assert.ok(snippets.every((n) => hasSource(result, n.sourceKeys)));
    });
});
