import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import * as converter from '../../src/analyzer/types/apex/converter';
import { makeConvertType } from '../../src/analyzer/types/apex/commons';
import { ApexCommonTypeClass, ApexErrorTypeClass } from '../../src/analyzer/types/apex_IR';
import { IdVisitor } from '../../src/analyzer/types/apex_IR/idVisitor';
import { LiteralVisitor } from '../../src/analyzer/types/apex_IR/literalVisitor';
import { UnitVisitor } from '../../src/analyzer/types/apex_IR/unitVisitor';
import { parse } from '../apex_IR/helpers';

import { find } from './helpers';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object';

const sourceInfo = {
    context: 'Account',
    start: { offset: 0, line: 1, column: 0 },
    end: { offset: 7, line: 1, column: 7 },
};

const exportsByName: Record<string, unknown> = converter;

/** IR の type ('ifStatement') → 出力の判定関数 (isIfStatementType) */
const predicateOf = (type: string) => {
    const predicate = exportsByName[`is${type[0]!.toUpperCase()}${type.slice(1)}Type`];
    return typeof predicate === 'function' ? (predicate as (value: unknown) => boolean) : null;
};

/** 部分木の IR のノードを、type ごとに 1 つ集める */
const collectNodes = (root: unknown) => {
    const nodes = new Map<string, ApexCommonTypeClass>();
    const visit = (value: ApexCommonTypeClass) => {
        if (!(value instanceof ApexErrorTypeClass) && !nodes.has(value.getType())) {
            nodes.set(value.getType(), value);
        }
        value.getChildNodes().forEach(visit);
    };
    if (root instanceof ApexCommonTypeClass) visit(root);
    return nodes;
};

const convertSource = (source: string) => {
    const unit = new UnitVisitor().visit(parse(source, (parser) => parser.compilationUnit()));
    return converter.convertApexUnit(unit);
};

describe('converter output types', () => {
    it('判定関数は type のリテラルと sourceInfo の有無で判定する', () => {
        assert.equal(converter.isIdType({ type: 'id', sourceInfo, value: 'Account' }), true);
        assert.equal(converter.isIdType({ type: 'id', value: 'Account' }), false);
        assert.equal(converter.isIdType({ sourceInfo, value: 'Account' }), false);
        assert.equal(converter.isIdType({ type: 'soqlId', sourceInfo, value: 'Account' }), false);
        assert.equal(converter.isErrorType({ type: 'error', sourceInfo }), true);
    });

    it('IR のクラスから converter の出力を作る (IR のフィールドをそのまま写す)', () => {
        const id = new IdVisitor().visit(parse('Account', (parser) => parser.id()));
        const output = converter.convertApexTypeClass(id);
        assert.equal(converter.isIdType(output), true);
        assert.equal((output as { value: unknown }).value, 'Account');
        assert.deepEqual(output.sourceInfo, sourceInfo);
    });

    it('unit 以外を convertApexUnit に渡すと例外', () => {
        const id = new IdVisitor().visit(parse('Account', (parser) => parser.id()));
        assert.throws(() => converter.convertApexUnit(id), /Unsupported type: id/);
    });

    it('IR と名前が違うフィールド (APEX_CONVERT_OVERRIDES) を直す', () => {
        const result = convertSource(`public class A {
    void m() {
        Integer x = 1;
        if (x > 0) { x = 2; } else if (x < 0) { x = 3; } else { x = 4; }
        try { this(); } finally { run(); }
    }
}`);
        const types = (type: string) => find(result, (n) => n.type === type);
        // content → init
        assert.ok(types('variableDeclarator').every((n) => 'init' in n && !('content' in n)));
        // if / else if / else は { condition, block }
        const [ifStatement] = types('ifStatement');
        assert.deepEqual(
            (ifStatement!.value as { condition: unknown }[]).map((v) =>
                typeof v.condition === 'string'
                    ? v.condition
                    : (v.condition as { type: string }).type,
            ),
            ['parExpression', 'parExpression', 'else'],
        );
        // value → block
        assert.ok(types('tryStatement').every((n) => 'block' in n && !('value' in n)));
        assert.ok(types('finallyBlock').every((n) => 'block' in n && !('value' in n)));
        // this(...) は value が 'this' で reference を持たない。run() は reference を持つ
        const calls = types('methodCall');
        assert.ok(calls.some((n) => n.value === 'this' && !('reference' in n)));
        assert.ok(calls.some((n) => 'reference' in n));
        // FIND {...} の検索語 (soslLiteralAlt はほかの規則から使われないので、規則を直接 parse する)
        const alt = new LiteralVisitor().visit(
            parse('[FIND {Acme} RETURNING Account]', (parser) => parser.soslLiteralAlt()),
        );
        const altOutput = converter.convertApexTypeClass(alt) as { type: string; value: unknown };
        assert.equal(altOutput.type, 'soslLiteralAlt');
        assert.equal(altOutput.value, 'Acme');
    });

    it('objectKey はキーの順序に依らない', async () => {
        const a = { type: 'x', sourceInfo, left: 1, right: 2, operator: '+' };
        const b = { type: 'x', sourceInfo, operator: '+', right: 2, left: 1 };
        const [ka, kb] = await Promise.all([makeConvertType(a), makeConvertType(b)]);
        assert.equal(ka.result.objectKey, kb.result.objectKey);
    });

    const examples = [
        ['ParserTest.cls', 'compilation'],
        ['ParserTrigger.trigger', 'trigger'],
        ['parser.apex', 'anonymous'],
    ] as const;

    for (const [file, kind] of examples) {
        it(`${file}: IR の各ノードの変換結果が出力の判定関数を通る`, async () => {
            const source = await readFile(
                new URL(`../../docs/examples/apex-ir/${file}`, import.meta.url),
                'utf8',
            );
            const context = parse(source, (parser) => {
                if (kind === 'compilation') return parser.compilationUnit();
                if (kind === 'trigger') return parser.triggerUnit();
                return parser.anonymousUnit();
            });
            const nodes = collectNodes(new UnitVisitor().visit(context));

            let checked = 0;
            for (const [type, node] of nodes) {
                const predicate = predicateOf(type);
                if (!predicate) continue;
                const output = converter.convertApexTypeClass(node);
                assert.equal(predicate(output), true, `${file}: ${type}`);
                assert.ok(isRecord(output));
                assert.equal(output.type, type);
                assert.ok(isRecord(output.sourceInfo), type);
                assert.equal(predicate({ ...output, type: null }), false, type);
                assert.equal(predicate({ ...output, sourceInfo: null }), false, type);
                assert.deepEqual(
                    find(output, (n) => n.type === 'error'),
                    [],
                    type,
                );
                checked++;
            }
            assert.ok(checked > 50, `Only checked ${checked} node types for ${file}`);
        });
    }
});
