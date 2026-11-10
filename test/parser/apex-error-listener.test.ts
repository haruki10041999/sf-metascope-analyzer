import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { ApexParserFactory } from '@apexdevtools/apex-parser';

import { ApexCommonErrorListener } from '../../src/analyzer/parser/Apex/errorListener';
import { buildApexIr } from '../../src/analyzer/types/apex_IR/commonVisitor';
import { CompilationUnitTypeClass } from '../../src/analyzer/types/apex_IR/unitVisitor';
import { IrError } from '../../src/analyzer/types/commons/ir';

const parseUnit = (source: string) => {
    const listener = new ApexCommonErrorListener(source);
    const { parser } = ApexParserFactory.createLexerAndParser(source, listener);
    const built = buildApexIr(
        parser.compilationUnit(),
        (c) => CompilationUnitTypeClass.create(c),
        'compilationUnit',
    );
    return { listener, built };
};

const errorAt = (offset: number) =>
    new IrError('UNSUPPORTED_CONTEXT', 'FooContext', 'x', 'message', {
        context: 'x',
        start: { offset, line: 1, column: offset },
        end: { offset: offset + 1, line: 1, column: offset + 1 },
    });

describe('ApexCommonErrorListener (phase と IR のエラー)', () => {
    it('構文エラーがあれば、irErrors は IR のエラーを出さず、構文エラーだけを出す', () => {
        const { listener, built } = parseUnit(`public class A { void m() { Integer x = ; } }`);
        listener.irErrors([...built.errors, errorAt(5)]);
        assert.deepEqual(
            listener.getResolvedErrors().map((e) => e.phase),
            ['syntax'],
        );
    });

    it('構文エラーは phase: syntax。構文エラーの位置に重なる IR のエラーは出さない', () => {
        const { listener, built } = parseUnit(`public class A { void m() { if () { } } }`);
        built.errors.forEach((error) => listener.analyzerError(error));
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
