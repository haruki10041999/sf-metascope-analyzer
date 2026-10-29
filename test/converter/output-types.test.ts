import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import * as converter from '../../src/analyzer/types/apex/converter';
import { CommonTypeClass, ErrorTypeClass } from '../../src/analyzer/types/apex_IR';
import { IdVisitor } from '../../src/analyzer/types/apex_IR/idVisitor';
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

type AssignRule = {
    isValid: (target: unknown) => boolean;
    construct: (target: unknown) => unknown;
};

const isAssignRule = (value: unknown): value is AssignRule =>
    isRecord(value) && typeof value.isValid === 'function' && typeof value.construct === 'function';

const exportsByName: Record<string, unknown> = converter;

// makeXxxAssignRule と、その出力を判定する isXxxType の組
const rules = Object.entries(converter).flatMap(([name, rule]) => {
    const match = name.match(/^make(.+)AssignRule$/);
    const predicate = match ? exportsByName[`is${match[1]}Type`] : undefined;
    return match && isAssignRule(rule) && typeof predicate === 'function'
        ? [{ name, rule, predicate: predicate as (value: unknown) => boolean }]
        : [];
});

describe('converter output types', () => {
    it('変換ルールごとに出力の判定関数があり、type / sourceInfo のない値を弾く', () => {
        assert.ok(rules.length > 50);
        for (const { name, predicate } of rules) {
            assert.equal(predicate(null), false, name);
            assert.equal(predicate({ type: 1, sourceInfo }), false, name);
        }
    });

    it('判定関数は type のリテラルと sourceInfo の有無で判定する', () => {
        assert.equal(converter.isIdType({ type: 'id', sourceInfo, value: 'Account' }), true);
        assert.equal(converter.isIdType({ type: 'id', value: 'Account' }), false);
        assert.equal(converter.isIdType({ sourceInfo, value: 'Account' }), false);
        assert.equal(converter.isIdType({ type: 'soqlId', sourceInfo, value: 'Account' }), false);
        assert.equal(converter.isErrorType({ type: 'error', sourceInfo }), true);
    });

    it('IR のクラスから converter の出力を作る', () => {
        const id = new IdVisitor().visit(parse('Account', (parser) => parser.id()));
        const rule = converter.makeIdAssignRule;
        assert.equal(rule.isValid(id), true);
        assert.equal(rule.isValid({ type: 'id', sourceInfo, value: 'Account' }), false);

        const output = rule.construct(id as never);
        assert.equal(converter.isIdType(output), true);
        assert.equal(output.value, 'Account');
        assert.deepEqual(output.sourceInfo, sourceInfo);
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
            const unit = new UnitVisitor().visit(context);
            const nodes = new Map<string, CommonTypeClass>();
            const seen = new Set<object>();
            const visit = (value: unknown) => {
                if (!isRecord(value) || seen.has(value)) return;
                seen.add(value);
                if (value instanceof CommonTypeClass && !(value instanceof ErrorTypeClass)) {
                    if (!nodes.has(value.getType())) nodes.set(value.getType(), value);
                }
                Object.values(value).forEach(visit);
            };
            visit(unit);

            let checked = 0;
            for (const { name, rule, predicate } of rules) {
                const target = [...nodes.values()].find((node) => rule.isValid(node));
                if (!target) continue;
                const output = rule.construct(target);
                assert.equal(predicate(output), true, `${file}: ${name}`);
                assert.ok(isRecord(output));
                assert.equal(output.type, target.getType(), name);
                assert.ok(isRecord(output.sourceInfo), name);
                assert.equal(predicate({ ...output, type: null }), false, name);
                assert.equal(predicate({ ...output, sourceInfo: null }), false, name);
                assert.deepEqual(find(output, (n) => n.type === 'error'), [], name);
                checked++;
            }
            assert.ok(checked > 50, `Only checked ${checked} converter rules for ${file}`);
        });
    }
});
