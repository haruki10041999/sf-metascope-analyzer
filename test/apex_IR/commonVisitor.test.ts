import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import type { ApexParserRuleContext } from '@apexdevtools/apex-parser';

import {
    ApexErrorTypeClass,
    isErrorType,
    isApexValidClass,
    isApexValidClassList,
    ApexCommonTypeClass,
} from '../../src/analyzer/types/apex_IR/commonVisitor';
import { parse } from './helpers';

describe('commonVisitor', () => {
    it('ApexErrorTypeClass は AnalyzerError 型でコードとコンテキスト情報を保持する', () => {
        const error = ApexErrorTypeClass.create('EXCEPTION', 'FooContext', 'foo', 'message');
        assert.equal(error.getType(), 'AnalyzerError');
        assert.equal(error.getCode(), 'EXCEPTION');
        assert.equal(error.getContextType(), 'FooContext');
        assert.equal(error.getContext(), 'foo');
        assert.equal(error.getParseErrorMessage(), 'message');
        assert.ok(isErrorType(error));
    });

    it('isApexValidClass は ApexErrorTypeClass をそのまま通す', () => {
        const error = ApexErrorTypeClass.create('EXCEPTION', 'FooContext', 'foo', 'message');
        const never = (t: ApexCommonTypeClass): t is ApexErrorTypeClass => false;
        assert.equal(isApexValidClass(error, never, 'foo'), error);
    });

    it('isApexValidClass は想定外の型を TYPE_MISMATCH の ApexErrorTypeClass に置き換える', () => {
        const never = (t: ApexCommonTypeClass): t is ApexErrorTypeClass => false;
        const result = isApexValidClass(new ApexCommonTypeClass('bar'), never, 'foo');
        assert.ok(isErrorType(result));
        assert.equal(result.getCode(), 'TYPE_MISMATCH');
        assert.match(result.getParseErrorMessage(), /想定:foo/);
    });

    it('isApexValidClassList は空配列で [] を返す', () => {
        const never = (t: ApexCommonTypeClass): t is ApexErrorTypeClass => false;
        assert.deepEqual(
            isApexValidClassList(
                [] as ApexParserRuleContext[],
                () => new ApexCommonTypeClass('x'),
                never,
                'x',
            ),
            [],
        );
    });

    it('ApexCommonVisitor.visit に null を渡しても例外にならず NULL_CHILD を返す', async () => {
        const id = await import('../../src/analyzer/types/apex_IR/idVisitor');
        const visitor = new id.IdVisitor();
        const result = visitor.visit(null as unknown as ApexParserRuleContext);
        assert.ok(result instanceof ApexErrorTypeClass);
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
