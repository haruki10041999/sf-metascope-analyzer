import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import type { ApexParserRuleContext } from '@apexdevtools/apex-parser';

import {
    ErrorTypeClass,
    isErrorType,
    isValidClass,
    isValidClassList,
    CommonTypeClass,
} from '../../src/analyzer/types/apex_IR/commonVisitor';
import { parse } from './helpers';

describe('commonVisitor', () => {
    it('ErrorTypeClass は AnalyzerError 型でコードとコンテキスト情報を保持する', () => {
        const error = ErrorTypeClass.create('EXCEPTION', 'FooContext', 'foo', 'message');
        assert.equal(error.getType(), 'AnalyzerError');
        assert.equal(error.getCode(), 'EXCEPTION');
        assert.equal(error.getContextType(), 'FooContext');
        assert.equal(error.getContext(), 'foo');
        assert.equal(error.getParseErrorMessage(), 'message');
        assert.ok(isErrorType(error));
    });

    it('isValidClass は ErrorTypeClass をそのまま通す', () => {
        const error = ErrorTypeClass.create('EXCEPTION', 'FooContext', 'foo', 'message');
        const never = (t: CommonTypeClass): t is ErrorTypeClass => false;
        assert.equal(isValidClass(error, never, 'foo'), error);
    });

    it('isValidClass は想定外の型を TYPE_MISMATCH の ErrorTypeClass に置き換える', () => {
        const never = (t: CommonTypeClass): t is ErrorTypeClass => false;
        const result = isValidClass(new CommonTypeClass('bar'), never, 'foo');
        assert.ok(isErrorType(result));
        assert.equal(result.getCode(), 'TYPE_MISMATCH');
        assert.match(result.getParseErrorMessage(), /想定:foo/);
    });

    it('isValidClassList は空配列で [] を返す', () => {
        const never = (t: CommonTypeClass): t is ErrorTypeClass => false;
        assert.deepEqual(
            isValidClassList(
                [] as ApexParserRuleContext[],
                () => new CommonTypeClass('x'),
                never,
                'x',
            ),
            [],
        );
    });

    it('CommonVisitor.visit に null を渡しても例外にならず NULL_CHILD を返す', async () => {
        const id = await import('../../src/analyzer/types/apex_IR/idVisitor');
        const visitor = new id.IdVisitor();
        const result = visitor.visit(null as unknown as ApexParserRuleContext);
        assert.ok(result instanceof ErrorTypeClass);
        assert.equal(result.getCode(), 'NULL_CHILD');
    });

    it('visit で生成したノードにソース位置（span）が付く', async () => {
        const expr = await import('../../src/analyzer/types/apex_IR/expressionVisitor');
        const result = new expr.ExpressionVisitor().visit(
            parse('a +\n  bb', (p) => p.expression()),
        );
        assert.deepEqual(result.getSpan(), {
            start: { offset: 0, line: 1, column: 0 },
            end: { offset: 8, line: 2, column: 4 },
        });
    });
});
