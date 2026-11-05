// LWC Compiler による JS / TS の仕様の検証 (docs/lwc-implementation.md)
import { transformSync } from '@lwc/compiler';
import type { File } from '@babel/types';

import { eraseTypes } from './eraseTypes';
import type { ScriptLanguage } from '../script';

/** LWC Compiler の診断・空白にできない TS の構文を、位置を文字位置にそろえたもの */
export type LwcDiagnostic = {
    /** 'LWC1093' など / 'TS_UNSUPPORTED' */
    code: string;
    /** 詳しい種類 (LWC のコード、空白にできない構文の名前) */
    contextType: string;
    level: 'error' | 'warning';
    message: string;
    /** 文字位置 (UTF-16)。位置がなければ null (ファイルの先頭にする) */
    start: number | null;
    end: number | null;
};

// @lwc/errors の DiagnosticLevel (@lwc/errors は直接の依存ではないので値で持つ)
const DIAGNOSTIC_LEVEL_WARNING = 2;

/** @lwc/errors の CompilerDiagnostic / CompilerError の、使う部分 */
type CompilerDiagnosticLike = {
    code: number;
    message: string;
    level: number;
    location?: { line: number; column: number; start?: number; length?: number; index?: number };
};

const isCompilerDiagnostic = (value: unknown): value is CompilerDiagnosticLike =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { code?: unknown }).code === 'number' &&
    typeof (value as { message?: unknown }).message === 'string';

/** 行・列 (1 始まり・0 始まり) を文字位置にする */
const offsetOf = (source: string, line: number, column: number): number => {
    let offset = 0;
    for (let current = 1; current < line; current++) {
        const next = source.indexOf('\n', offset);
        if (next < 0) return source.length;
        offset = next + 1;
    }
    return Math.min(offset + column, source.length);
};

/**
 * メッセージの先頭の "SyntaxError: <絶対パス>: LWC1093: " を除く (実行環境に依存する・code と重なる)。
 * 絶対パスは渡したファイル名で終わるので、その後ろからにする
 */
const cleanMessage = (message: string, filename: string): string => {
    let text = message.split('\n')[0]!;
    const marker = `${filename.replace(/\//g, '\\')}: `;
    const markerPosix = `${filename}: `;
    const at = Math.max(text.lastIndexOf(marker), text.lastIndexOf(markerPosix));
    if (at >= 0) {
        text = text.slice(at + Math.max(marker.length, markerPosix.length));
    }
    return text
        .replace(/^\w*Error: /, '')
        .replace(/^LWC\d+: /, '')
        .trim();
};

const toLwcDiagnostic = (
    diagnostic: CompilerDiagnosticLike,
    source: string,
    filename: string,
): LwcDiagnostic => {
    const code = `LWC${diagnostic.code}`;
    const location = diagnostic.location;
    // start があればそれを使う。構文エラー (LWC1007) は start の代わりに index を持つ
    const start =
        location?.start ??
        location?.index ??
        (location ? offsetOf(source, location.line, location.column) : null);
    const end = start === null ? null : start + (location?.length ?? 0);

    return {
        code,
        contextType: code,
        level: diagnostic.level >= DIAGNOSTIC_LEVEL_WARNING ? 'warning' : 'error',
        message: cleanMessage(diagnostic.message, filename),
        start,
        end,
    };
};

export type ValidateScriptOptions = {
    /** バンドルの中の相対パス (hello/hello.ts)。TS は拡張子を .js にして渡す */
    filePath: string;
    /** バンドル名 (hello) */
    name: string;
    /** 名前空間 (c) */
    namespace?: string;
    language: ScriptLanguage;
    /** TS のとき、構文解析の AST (tokens: true)。渡せば eraseTypes で parse し直さない */
    ast?: File;
};

/**
 * LWC Compiler で仕様を検証する。違反は最初の 1 件だけ例外になるので、1 件しか返らない (warnings は複数)。
 * TS は型を空白にした JS を検証する。空白にできない構文があれば、TS_UNSUPPORTED を返して検証しない
 */
export const validateScript = (source: string, options: ValidateScriptOptions): LwcDiagnostic[] => {
    let code = source;
    let filename = options.filePath;

    if (options.language === 'ts') {
        const erased = eraseTypes(source, options.ast);
        if (erased.unsupported.length > 0) {
            return erased.unsupported.map((item) => ({
                code: 'TS_UNSUPPORTED',
                contextType: item.syntax,
                level: 'error',
                message: `${item.syntax} は型を空白にできないため、LWC の検証をしていません`,
                start: item.start,
                end: item.end,
            }));
        }
        code = erased.code;
        filename = filename.replace(/\.ts$/i, '.js');
    }

    try {
        const result = transformSync(code, filename, {
            name: options.name,
            namespace: options.namespace ?? 'c',
        });
        return (result.warnings ?? []).map((warning) => toLwcDiagnostic(warning, source, filename));
    } catch (error) {
        if (isCompilerDiagnostic(error)) {
            return [toLwcDiagnostic(error, source, filename)];
        }
        throw error;
    }
};
