import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { ApexParserFactory } from '@apexdevtools/apex-parser';

import { ApexCommonErrorListener } from '../../src/analyzer/parser/Apex/errorListener';
import {
    ApexErrorTypeClass,
    collectErrorTypeClasses,
} from '../../src/analyzer/types/apex_IR/commonVisitor';
import { UnitVisitor } from '../../src/analyzer/types/apex_IR/unitVisitor';
import { collectErrors } from '../apex_IR/helpers';

const parseUnit = (source: string) => {
    const listener = new ApexCommonErrorListener(source);
    const { parser } = ApexParserFactory.createLexerAndParser(source, listener);
    const ir = new UnitVisitor().visit(parser.compilationUnit());
    return { listener, ir };
};

const errorAt = (offset: number) => {
    const error = ApexErrorTypeClass.create('UNSUPPORTED_CONTEXT', 'FooContext', 'x', 'message');
    error.setSpan({
        context: 'x',
        start: { offset, line: 1, column: offset },
        end: { offset: offset + 1, line: 1, column: offset + 1 },
    });
    return error;
};

describe('ApexCommonErrorListener (phase と IR のエラー)', () => {
    it('getChildNodes でたどった IR のエラーは、プロパティを直接たどった結果と同じ', () => {
        const { ir } = parseUnit(`public class A { void m() { Integer x = ; } }`);
        assert.deepEqual(collectErrorTypeClasses(ir), collectErrors(ir));
        assert.equal(collectErrorTypeClasses(ir).length, 1);
    });

    it('構文エラーは phase: syntax。構文エラーの位置に重なる IR のエラーは出さない', () => {
        const { listener, ir } = parseUnit(`public class A { void m() { if () { } } }`);
        collectErrorTypeClasses(ir).forEach((error) => listener.analyzerError(error));
        assert.deepEqual(
            listener.getResolvedErrors().map((e) => [e.phase, e.code, e.start.column]),
            [['syntax', 'UNRESOLVED', 32]],
        );
    });

    it('構文エラーと重ならない IR のエラーは phase: analyzer として、位置の順に出す', () => {
        const { listener } = parseUnit(`public class A { void m() { Integer x = ; } }`);
        listener.analyzerError(errorAt(5));
        assert.deepEqual(
            listener.getResolvedErrors().map((e) => [e.phase, e.code, e.start.offset]),
            [
                ['analyzer', 'UNSUPPORTED_CONTEXT', 5],
                ['syntax', 'UNRESOLVED', 40],
            ],
        );
        assert.ok(listener.hasSyntaxError());
    });
});
