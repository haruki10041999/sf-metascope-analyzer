// LWC の JS / TS の構文解析 (docs/lwc-parse-plan.md 3.1.1・3.1.7)
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
export const makeBabelOptions = (language: ScriptLanguage): ParserOptions => ({
    sourceType: 'module',
    plugins: language === 'ts' ? ['typescript', 'decorators'] : ['decorators'],
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

/** JS / TS を parse する。Babel の構文エラーは例外にせず返す (それ以外の例外は投げ直す) */
export const parseScript = (source: string, language: ScriptLanguage): ScriptParseResult => {
    try {
        const ast = parse(source, makeBabelOptions(language));
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
