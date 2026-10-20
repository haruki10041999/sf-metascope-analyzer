import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import * as converter from '../../src/analyzer/types/apex/converter';
import {
    CommonTypeClass,
    ErrorTypeClass,
    NormalIdTypeClass,
} from '../../src/analyzer/types/apex_IR';
import { UnitVisitor } from '../../src/analyzer/types/apex_IR/unitVisitor';
import { ErrorInfo, SourceSlot } from '../../src/analyzer/types/apex/converter/commons';
import { parse } from '../apex_IR/helpers';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object';

const getRule = (factory: unknown, errors: ErrorInfo[]) => {
    assert.ok(typeof factory === 'function');
    const slot: SourceSlot = () => undefined;
    const rule: unknown = Reflect.apply(factory, undefined, [slot, errors]);
    assert.ok(isRecord(rule));
    assert.ok(typeof rule.isValid === 'function');
    assert.ok(typeof rule.construct === 'function');
    return { isValid: rule.isValid, construct: rule.construct };
};

const validate = (predicate: unknown, value: unknown): boolean => {
    assert.ok(typeof predicate === 'function');
    return Reflect.apply(predicate, undefined, [value]) === true;
};

const factories = Object.entries(converter).filter(
    ([name]) => /^make.+Rule$/.test(name) && !/^makeBase/.test(name),
);
const exportsByName: Record<string, unknown> = converter;

describe('converter output types', () => {
    it('every converter rule exports its output predicate', () => {
        assert.ok(factories.length > 0);
        for (const [name] of factories) {
            const predicate = exportsByName[`is${name.slice(4, -4)}Type`];
            assert.equal(typeof predicate, 'function', name);
            assert.equal(validate(predicate, null), false, name);
            assert.equal(validate(predicate, { type: 1 }), false, name);
        }
    });

    it('id predicates validate values separately from the IR rule predicates', () => {
        assert.equal(converter.isIdType({ type: 'id', value: 'Account' }), true);
        assert.equal(converter.isIdType({ type: 'id', value: 1 }), false);
        assert.equal(converter.isIdType({ value: 'Account' }), false);
        const id = NormalIdTypeClass.create(parse('Account', (parser) => parser.id()));
        const rule = converter.makeIdRule(() => undefined);
        assert.equal(rule.isValid(id), true);
        assert.equal(rule.isValid({ type: 'id', value: 'Account' }), false);
        assert.equal(converter.isIdType(rule.construct(id)), true);
        assert.equal(
            converter.isSoqlIdType({
                type: 'soqlId',
                value: { type: 'id', value: 'Account' },
            }),
            true,
        );
        assert.equal(converter.isSoqlIdType({ type: 'soqlId', value: 'Account' }), false);
        assert.equal(converter.isSoslIdType({ type: 'soslId', value: [] }), true);
        assert.equal(converter.isSoslIdType({ type: 'soslId', value: 'Account' }), false);
    });

    it('literal and list predicates validate their concrete attributes', () => {
        const literal = { type: 'literal', value: '1', valueType: 'INTEGER' };
        assert.equal(converter.isLiteralType(literal), true);
        assert.equal(converter.isLiteralType({ ...literal, value: 1 }), false);
        assert.equal(converter.isLiteralType({ ...literal, valueType: null }), false);
        assert.equal(
            converter.isLiteralType({
                ...literal,
                value: { errorCode: 'TYPE_MISMATCH', index: 1 },
            }),
            true,
        );
        assert.equal(converter.isExpressionListType({ type: 'expressionList', value: [] }), true);
        assert.equal(
            converter.isExpressionListType({ type: 'expressionList', value: 'invalid' }),
            false,
        );
    });

    const examples = [
        ['ParserTest.cls', 'compilation'],
        ['ParserTrigger.trigger', 'trigger'],
        ['parser.apex', 'anonymous'],
    ] as const;

    for (const [file, kind] of examples) {
        it(`${file}: converted IR nodes pass their output predicates`, async () => {
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

            const errors: ErrorInfo[] = [];
            let checked = 0;
            for (const [name, factory] of factories) {
                const rule = getRule(factory, errors);
                const target = [...nodes.values()].find(
                    (node) => Reflect.apply(rule.isValid, undefined, [node]) === true,
                );
                if (!target) continue;
                const output: unknown = Reflect.apply(rule.construct, undefined, [target]);
                const predicate = exportsByName[`is${name.slice(4, -4)}Type`];
                assert.equal(validate(predicate, output), true, `${file}: ${name}`);
                assert.ok(isRecord(output));
                assert.equal(output.type, target.getType(), name);
                assert.equal(validate(predicate, { ...output, type: null }), false, name);
                checked++;
            }
            assert.ok(checked > 50, `Only checked ${checked} converter rules for ${file}`);
            assert.deepEqual(errors, []);
        });
    }
});
