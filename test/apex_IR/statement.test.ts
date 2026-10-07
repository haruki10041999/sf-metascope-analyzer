import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { collectErrors, formatErrors, parse } from './helpers';

type StatementModule = typeof import('../../src/analyzer/types/apex_IR/statementVisitor');
type ValueModule = typeof import('../../src/analyzer/types/apex_IR/valueVisitor');
let stmt: StatementModule;
let value: ValueModule;

before(async () => {
    stmt = await import('../../src/analyzer/types/apex_IR/statementVisitor');
    value = await import('../../src/analyzer/types/apex_IR/valueVisitor');
});

const visitStatement = (source: string) => {
    const result = new stmt.StatementVisitor().visit(parse(source, (p) => p.statement()));
    assert.ok(stmt.isNormalStatementType(result), result.getType());
    return result;
};

describe('statementVisitor', () => {
    for (const [source, type] of [
        ['{ }', 'block'],
        ['if (a) { } else { }', 'ifStatement'],
        ['for (Integer i = 0; i < 10; i++) { }', 'forStatement'],
        ['for (Account a : accounts) { }', 'forStatement'],
        ['while (a) { }', 'whileStatement'],
        ['do { } while (a);', 'doWhileStatement'],
        ['try { } catch (Exception e) { } finally { }', 'tryStatement'],
        ['return x;', 'returnStatement'],
        ['throw e;', 'throwStatement'],
        ['insert acc;', 'insertStatement'],
        ['update acc;', 'updateStatement'],
        ['upsert acc;', 'upsertStatement'],
        ['delete acc;', 'deleteStatement'],
        ['undelete acc;', 'undeleteStatement'],
        ['merge a b;', 'mergeStatement'],
        ['Integer x = 1;', 'localVariableDeclarationStatement'],
        ['x = 1;', 'expressionStatement'],
    ] as const) {
        it(`"${source}" → ${type}`, () => {
            const result = visitStatement(source);
            assert.equal(result.getValue().getType(), type);
            const errors = collectErrors(result);
            assert.equal(errors.length, 0, formatErrors(errors));
        });
    }

    it('switch 文 (リテラル / else / 型) をエラーなしで変換できる', () => {
        const result = visitStatement(
            'switch on x { when 1, 2 { } when Account a { } when else { } }',
        );
        assert.equal(result.getValue().getType(), 'switchStatement');
        const errors = collectErrors(result);
        assert.equal(errors.length, 0, formatErrors(errors));
    });
});

describe('valueVisitor / whenValue', () => {
    it('when リテラルの符号はソース順に保持される', async () => {
        const literal = await import('../../src/analyzer/types/apex_IR/literalVisitor');
        const result = new literal.LiteralVisitor().visit(parse('-1', (p) => p.whenLiteral()));
        assert.ok(literal.isWhenLiteralType(result), result.getType());
        assert.equal(result.getValue(), 1);
        assert.equal(result.getOperator(), '-');
    });

    it('"else" → value が else', () => {
        const result = new value.ValueVisitor().visit(parse('else', (p) => p.whenValue()));
        assert.ok(value.isWhenValueType(result), result.getType());
        assert.equal(result.getValue(), 'else');
    });

    it('"1, 2" → whenLiteral が 2 件', () => {
        const result = new value.ValueVisitor().visit(parse('1, 2', (p) => p.whenValue()));
        assert.ok(value.isWhenValueType(result), result.getType());
        const literals = result.getValue();
        assert.ok(Array.isArray(literals));
        assert.equal(literals.length, 2);
    });

    it('"Account a" → value が id、valueType が typeRef', () => {
        const result = new value.ValueVisitor().visit(parse('Account a', (p) => p.whenValue()));
        assert.ok(value.isWhenValueType(result), result.getType());
        assert.equal(result.getValueType()?.getType(), 'typeRef');
    });
});
