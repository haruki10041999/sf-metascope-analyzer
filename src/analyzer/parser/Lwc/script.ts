// LWC の JS / TS の構文解析 (docs/lwc-implementation.md)
import path from 'node:path';

import { parse, type ParseResult, type ParserOptions } from '@babel/parser';
import type { File, SourceLocation } from '@babel/types';

export type ScriptLanguage = 'js' | 'ts';

/** Babel の構文エラー (ast.errors の要素、または parse が throw したもの) */
export type BabelSyntaxError = SyntaxError & {
    code: string;
    reasonCode: string;
    loc: SourceLocation['start'];
    pos: number;
};

export const isBabelSyntaxError = (error: unknown): error is BabelSyntaxError =>
    error instanceof SyntaxError && 'reasonCode' in error && 'loc' in error;

export const getScriptLanguage = (filePath: string): ScriptLanguage =>
    path.extname(filePath).toLowerCase() === '.ts' ? 'ts' : 'js';

/**
 * 3.1.1 の設定。Babel 8 は decorators の decoratorsBeforeExport を持たず、export の前後どちらのデコレーターも読む
 * (LWC Compiler の Babel 7 の decoratorsBeforeExport: true で読めるものは、すべて読める)
 */
export const makeBabelOptions = (language: ScriptLanguage, flow = false): ParserOptions => ({
    sourceType: 'module',
    plugins:
        language === 'ts'
            ? ['typescript', 'decorators']
            : flow
              ? [['flow', { all: true }], 'decorators']
              : ['decorators'],
    // 回復できるエラーは ast.errors に入れて、AST も返す
    errorRecovery: true,
    // コメントは今回は対象外
    attachComment: false,
    // span のない記号・修飾子の位置 (3.2 の eraseTypes が使う)
    tokens: true,
    // 括弧をノードにする (3.2)
    createParenthesizedExpressions: true,
});

export type ScriptParseResult = {
    language: ScriptLanguage;
    /** 回復できない構文エラーのときは null */
    ast: ParseResult<File> | null;
    /** 回復した構文エラー (ast.errors) と、回復できない構文エラー (1 件) */
    syntaxErrors: BabelSyntaxError[];
};

/** 先頭のコメント (と空白・#!) を 1 つずつ読む */
const LEADING_TRIVIA = /^(?:\s+|#![^\n]*|\/\/[^\n]*|\/\*[\s\S]*?\*\/)/;

/**
 * 最初のトークンより前のコメントに @flow があるか (Babel の flow プラグインが見るのと同じ場所。@noflow は含めない)。
 * LWC Compiler は Flow を読まないので、.js は @flow があるときだけ flow プラグインを足す (ないファイルの parse は変えない)
 */
export const hasFlowPragma = (source: string): boolean => {
    let rest = source;
    for (let match = LEADING_TRIVIA.exec(rest); match; match = LEADING_TRIVIA.exec(rest)) {
        if (match[0].startsWith('/') && /@flow\b/.test(match[0])) return true;
        rest = rest.slice(match[0].length);
    }
    return false;
};

/** JS / TS を parse する。Babel の構文エラーは例外にせず返す (それ以外の例外は投げ直す) */
export const parseScript = (source: string, language: ScriptLanguage): ScriptParseResult => {
    try {
        const ast = parse(
            source,
            makeBabelOptions(language, language === 'js' && hasFlowPragma(source)),
        );
        return {
            language,
            ast,
            syntaxErrors: (ast.errors ?? []).filter(isBabelSyntaxError),
        };
    } catch (error) {
        if (isBabelSyntaxError(error)) {
            return { language, ast: null, syntaxErrors: [error] };
        }
        throw error;
    }
};
