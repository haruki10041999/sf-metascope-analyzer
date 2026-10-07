import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { collectErrors, formatErrors, parse } from './helpers';

type ExpressionModule = typeof import('../../src/analyzer/types/apex_IR/expressionVisitor');
let expr: ExpressionModule;

before(async () => {
    expr = await import('../../src/analyzer/types/apex_IR/expressionVisitor');
});

const visitExpression = (source: string) =>
    new expr.ExpressionVisitor().visit(parse(source, (p) => p.expression()));

const assertNoErrors = (node: unknown) => {
    const errors = collectErrors(node);
    assert.equal(errors.length, 0, formatErrors(errors));
};

describe('expressionVisitor', () => {
    describe('cmpExpression', () => {
        for (const [source, operator] of [
            ['a < b', '<'],
            ['a > b', '>'],
            ['a <= b', '<='],
            ['a >= b', '>='],
        ] as const) {
            it(`"${source}" の演算子が ${operator} になる`, () => {
                const result = visitExpression(source);
                assert.ok(expr.isCmpExpressionType(result), result.getType());
                assert.equal(result.getOperator(), operator);
                assertNoErrors(result);
            });
        }
    });

    describe('dotExpression', () => {
        it('"a.b" は "." で左辺/右辺を保持する', () => {
            const result = visitExpression('a.b');
            assert.ok(expr.isDotExpressionType(result), result.getType());
            assert.equal(result.getOperator(), '.');
            assertNoErrors(result);
        });

        it('"a?.b" は "?." になる', () => {
            const result = visitExpression('a?.b');
            assert.ok(expr.isDotExpressionType(result), result.getType());
            assert.equal(result.getOperator(), '?.');
        });

        it('"a.foo(1)" は右辺が dotMethodCall になる', () => {
            const result = visitExpression('a.foo(1)');
            assert.ok(expr.isDotExpressionType(result), result.getType());
            assert.equal(result.getRight().getType(), 'dotMethodCall');
            assertNoErrors(result);
        });
    });

    describe('単項/二項演算', () => {
        it('"!flag" は negExpression("!")', () => {
            const result = visitExpression('!flag');
            assert.ok(expr.isNegExpressionType(result), result.getType());
            assert.equal(result.getOperator(), '!');
        });

        it('"a == b" は equalityExpression', () => {
            const result = visitExpression('a == b');
            assert.equal(result.getType(), 'equalityExpression');
            assertNoErrors(result);
        });

        it('"a && b || c" は logOrExpression を頂点にする', () => {
            const result = visitExpression('a && b || c');
            assert.equal(result.getType(), 'logOrExpression');
            assertNoErrors(result);
        });

        it('"x ?? y" は coalExpression', () => {
            const result = visitExpression('x ?? y');
            assert.equal(result.getType(), 'coalExpression');
            assertNoErrors(result);
        });

        it('"c ? 1 : 2" は condExpression', () => {
            const result = visitExpression('c ? 1 : 2');
            assert.equal(result.getType(), 'condExpression');
            assertNoErrors(result);
        });
    });

    describe('SOQL 式', () => {
        it('boundExpression ":x" を変換できる', () => {
            const ctx = parse(':x', (p) => p.boundExpression());
            const result = new expr.ExpressionVisitor().visit(ctx);
            assert.ok(expr.isBoundExpressionType(result), result.getType());
        });

        it('whereConditionalExpression は conditionalExpression と別の type 名を持つ', () => {
            const ctx = parse("Name = 'x'", (p) => p.whereConditionalExpression());
            const result = new expr.ExpressionVisitor().visit(ctx);
            assert.ok(expr.isWhereConditionalExpressionType(result), result.getType());
            assert.equal(result.getType(), 'whereConditionalExpression');
        });
    });
});
