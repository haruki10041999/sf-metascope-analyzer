import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { collectErrors, formatErrors, parse, asNode } from './helpers';

type QueryModule = typeof import('../../src/analyzer/types/apex_IR/queryVisitor');
type ClauseModule = typeof import('../../src/analyzer/types/apex_IR/clauseVisitor');
type ListModule = typeof import('../../src/analyzer/types/apex_IR/listVisitor');
type PrimaryModule = typeof import('../../src/analyzer/types/apex_IR/primaryVisitor');
type ValueModule = typeof import('../../src/analyzer/types/apex_IR/valueVisitor');
let query: QueryModule;
let clause: ClauseModule;
let list: ListModule;
let primary: PrimaryModule;
let valueV: ValueModule;

before(async () => {
    query = await import('../../src/analyzer/types/apex_IR/queryVisitor');
    clause = await import('../../src/analyzer/types/apex_IR/clauseVisitor');
    list = await import('../../src/analyzer/types/apex_IR/listVisitor');
    primary = await import('../../src/analyzer/types/apex_IR/primaryVisitor');
    valueV = await import('../../src/analyzer/types/apex_IR/valueVisitor');
});

describe('valueVisitor / locationValue', () => {
    it('GEOLOCATION 形式は value に緯度・経度の並びを持つ', () => {
        const result = asNode(
            new valueV.ValueVisitor().visit(
                parse('GEOLOCATION(37.775, -122.418)', (p) => p.locationValue()),
            ),
        );
        assert.ok(valueV.isLocationValueType(result), result.getType());
        // GEOLOCATION 形式は value に緯度・経度の並びを持つ
        const value = result.getValue();
        assert.ok(Array.isArray(value));
        assert.deepEqual(
            value.map((c) => c.getType()),
            ['coordinateValue', 'coordinateValue'],
        );
    });

    it('フィールド名形式は value に fieldName を持つ', () => {
        const result = asNode(
            new valueV.ValueVisitor().visit(parse('BillingAddress', (p) => p.locationValue())),
        );
        assert.ok(valueV.isLocationValueType(result), result.getType());
        const value = result.getValue();
        assert.ok(value && !Array.isArray(value));
        assert.equal(value.getType(), 'fieldName');
    });
});

describe('queryVisitor / comparisonOperator', () => {
    for (const [source, expected] of [
        ['=', '='],
        ['!=', '!='],
        ['<', '<'],
        ['>', '>'],
        ['<=', '<='],
        ['>=', '>='],
        ['<>', '<>'],
        ['LIKE', 'LIKE'],
        ['IN', 'IN'],
        ['NOT IN', 'NOT IN'],
        ['INCLUDES', 'INCLUDES'],
        ['EXCLUDES', 'EXCLUDES'],
    ] as const) {
        it(`"${source}" → ${expected}`, () => {
            const ctx = parse(source, (p) => p.comparisonOperator());
            const result = asNode(new query.QueryVisitor().visit(ctx));
            assert.ok(query.isComparisonOperatorType(result), result.getType());
            assert.equal(result.getValue(), expected);
        });
    }
});

describe('clauseVisitor', () => {
    it('offsetClause の type は offsetClause', () => {
        const ctx = parse('OFFSET 10', (p) => p.offsetClause());
        const result = asNode(new clause.ClauseVisitor().visit(ctx));
        assert.ok(clause.isOffsetClauseType(result), result.getType());
        assert.equal(result.getType(), 'offsetClause');
        assert.equal(result.getValue(), '10');
    });

    it('limitClause の type は limitClause', () => {
        const ctx = parse('LIMIT 5', (p) => p.limitClause());
        const result = asNode(new clause.ClauseVisitor().visit(ctx));
        assert.equal(result.getType(), 'limitClause');
    });

    it('TYPEOF の elseClause の type は elseClause', () => {
        const ctx = parse('ELSE Name, Id', (p) => p.elseClause());
        const result = asNode(new clause.ClauseVisitor().visit(ctx));
        assert.equal(result.getType(), 'elseClause');
    });
});

describe('listVisitor / fromNameList', () => {
    it('FROM 句のオブジェクト名とエイリアスが組で保持される', () => {
        const ctx = parse('Account a, Contact, Lead l', (p) => p.fromNameList());
        const result = asNode(new list.ListVisitor().visit(ctx));
        assert.ok(list.isFromNameListType(result), result.getType());
        const pairs = result.getValue().map((entry) => {
            assert.ok(list.isFromNameType(entry), entry.getType());
            return [entry.getValue().getType(), entry.getAlias()?.getType() ?? null];
        });
        assert.deepEqual(pairs, [
            ['fieldName', 'soqlId'],
            ['fieldName', null],
            ['fieldName', 'soqlId'],
        ]);
    });
});

describe('listVisitor / fieldList (SOSL)', () => {
    it('入れ子を平坦化しても項目ごとの関数指定が保持される', () => {
        const ctx = parse('Id, TOLABEL(Type), Name', (p) => p.fieldList());
        const result = asNode(new list.ListVisitor().visit(ctx));
        assert.ok(list.isFieldListType(result), result.getType());
        assert.deepEqual(
            result
                .getValue()
                .map((field) => (list.isSoslFieldType(field) ? field.getFunc() : 'error')),
            [null, 'TOLABEL', null],
        );
    });
});

describe('clauseVisitor / forClauses', () => {
    it('FOR 句はソース順に保持される', () => {
        const ctx = parse('FOR REFERENCE FOR VIEW', (p) => p.forClauses());
        const result = asNode(new clause.ClauseVisitor().visit(ctx));
        assert.ok(clause.isForClausesType(result), result.getType());
        assert.deepEqual(result.getValue(), ['REFERENCE', 'VIEW']);
    });

    it('FOR 句が無いクエリの forClause は null', () => {
        const ctx = parse('SELECT Id FROM Account', (p) => p.query());
        const result = asNode(new query.QueryVisitor().visit(ctx));
        assert.ok(query.isNormalQueryType(result), result.getType());
        assert.equal(result.getForClause(), null);
    });
});

describe('clauseVisitor / withClause', () => {
    for (const [source, operator] of [
        ["WITH Name = 'Acme'", null],
        ["WITH NOT Name = 'Acme'", 'NOT'],
        ["WITH Name = 'Acme' OR Industry = 'Tech'", 'OR'],
        ["WITH (Name = 'Acme' OR Industry = 'Tech') AND Type = 'X'", 'AND'],
    ] as const) {
        it(`"${source}" は論理式（operator: ${operator}）として保持される`, () => {
            const result = asNode(
                new clause.ClauseVisitor().visit(parse(source, (p) => p.withClause())),
            );
            assert.ok(clause.isWithClauseType(result), result.getType());
            const value = result.getValue();
            assert.ok(typeof value !== 'string' && value.getType() === 'logicalExpression');
            assert.equal('getOperator' in value ? value.getOperator() : undefined, operator);
            assert.equal(result.getField(), null);
            const errors = collectErrors(result);
            assert.equal(errors.length, 0, formatErrors(errors));
        });
    }

    it('WITH USER_MODE は文字列として保持される', () => {
        const result = asNode(
            new clause.ClauseVisitor().visit(parse('WITH USER_MODE', (p) => p.withClause())),
        );
        assert.ok(clause.isWithClauseType(result), result.getType());
        assert.equal(result.getValue(), 'USER_MODE');
    });
});

describe('listVisitor / selectList', () => {
    it('SELECT 項目の別名が保持される', () => {
        const ctx = parse('Id, COUNT(Id) total, (SELECT Id FROM Contacts) c', (p) =>
            p.selectList(),
        );
        const result = asNode(new list.ListVisitor().visit(ctx));
        assert.ok(list.isSelectListType(result), result.getType());
        const aliases = result
            .getValue()
            .map((entry) =>
                'getAlias' in entry
                    ? (entry.getAlias() as { getValue?: () => unknown } | null)?.getValue?.()
                    : undefined,
            );
        assert.deepEqual(
            aliases.map((alias) =>
                alias && typeof alias === 'object' && 'getValue' in alias
                    ? (alias as { getValue: () => unknown }).getValue()
                    : null,
            ),
            [null, 'total', 'c'],
        );
    });
});

describe('SOQL 全体', () => {
    for (const source of [
        '[SELECT COUNT() FROM Account]',
        '[SELECT COUNT(Id) FROM Account GROUP BY Name HAVING COUNT(Id) > 10]',
        '[SELECT FIELDS(STANDARD) FROM Account LIMIT 200]',
        '[SELECT Id FROM Account WHERE Amount > -1.5]',
    ]) {
        it(`${source} をエラーなしで変換できる`, () => {
            const result = asNode(
                new primary.PrimaryVisitor().visit(parse(source, (p) => p.primary())),
            );
            const errors = collectErrors(result);
            assert.equal(errors.length, 0, formatErrors(errors));
        });
    }
    it('WHERE / ORDER BY / LIMIT / OFFSET を含むクエリをエラーなしで変換できる', () => {
        const ctx = parse(
            "[SELECT Id, Name FROM Account WHERE Name = 'x' AND Id IN :ids ORDER BY Name DESC NULLS LAST LIMIT 10 OFFSET 5]",
            (p) => p.primary(),
        );
        const result = asNode(new primary.PrimaryVisitor().visit(ctx));
        const errors = collectErrors(result);
        assert.equal(errors.length, 0, formatErrors(errors));
    });
});
