// LWC の CSS (.css) の parse と検証 (docs/lwc-template-stylesheet-plan.md 5 章)。
// ① postcss で構文解析 → JSON (中間表現は作らない) → ② @lwc/style-compiler で LWC の仕様を検証、の順
import path from 'node:path';

import { transform } from '@lwc/style-compiler';
import postcss, { type Root } from 'postcss';

import {
    SpanSourceRegistry,
    makeLwcStylesheetJson,
    makeSpanErrorJson,
    type ErrorJson,
    type LwcStylesheetJson,
    type SpanSourceJson,
} from '../../types';

import { LwcCommonErrorListener, type CssErrorLike, type LwcResolvedError } from './errorListener';

export type LwcStylesheetParseResult = {
    /** バンドルのフォルダの親からの相対パス (hello/hello.css) */
    filePath: string;
    scoped: boolean;
    /** 構文エラーで読めなかったときは ErrorJson (kindType: 'lwcStylesheet') */
    stylesheet: LwcStylesheetJson | ErrorJson;
    sourceObjects: SpanSourceJson[];
    resolvedError: LwcResolvedError[];
};

export type LwcStylesheetOptions = {
    /** js-meta.xml の apiVersion */
    apiVersion?: number;
};

const isCssError = (value: unknown): value is CssErrorLike =>
    value instanceof Error && ('line' in value || 'reason' in value);

/** *.scoped.css か */
export const isScopedStylesheet = (filePath: string) => /\.scoped\.css$/i.test(filePath);

/**
 * ② @lwc/style-compiler の検証。experimentalErrorRecoveryMode ですべての違反を集める
 * (違反があると AggregateError の errors に入る。なければ例外にならない)
 */
const validateStylesheet = (
    source: string,
    filePath: string,
    scoped: boolean,
    options: LwcStylesheetOptions,
): CssErrorLike[] => {
    try {
        const result = transform(source, path.posix.basename(filePath), {
            scoped,
            experimentalErrorRecoveryMode: true,
            ...(options.apiVersion ? { apiVersion: options.apiVersion } : {}),
        });
        return (result.errors ?? []).filter(isCssError);
    } catch (error) {
        if (error instanceof AggregateError) {
            return error.errors.filter(isCssError);
        }
        if (isCssError(error)) {
            return [error];
        }
        return [{ message: error instanceof Error ? error.message : String(error) }];
    }
};

/** 1 つの CSS を読む。filePath はバンドルのフォルダの親からの相対パス */
export const parseStylesheet = (
    filePath: string,
    source: string,
    options: LwcStylesheetOptions = {},
): LwcStylesheetParseResult => {
    const scoped = isScopedStylesheet(filePath);
    const listener = new LwcCommonErrorListener(source);
    const registry = new SpanSourceRegistry();
    const file = { filePath, source };

    // ① 構文解析。構文エラーはファイル全体をエラーにする (postcss は回復しない)
    let root: Root;
    try {
        root = postcss.parse(source, { from: undefined });
    } catch (error) {
        const cssError = isCssError(error) ? error : { message: String(error) };
        listener.cssError('syntax', 'CSS_SYNTAX', 'CssSyntaxError', cssError);
        const [reported] = listener.getResolvedErrors(filePath);
        const stylesheet = makeSpanErrorJson(
            'lwcStylesheet',
            cssError.reason ?? cssError.message,
            reported?.start ?? { offset: 0, line: 1, column: 0 },
            file,
            registry,
        );
        return {
            filePath,
            scoped,
            stylesheet,
            sourceObjects: registry.toSourceObjects(),
            resolvedError: listener.getResolvedErrors(filePath),
        };
    }

    const stylesheet = makeLwcStylesheetJson(root, scoped, file, registry);

    // ② LWC の仕様の検証 (違反があっても JSON は作る)
    validateStylesheet(source, filePath, scoped, options).forEach((error) =>
        listener.cssError('lwc', 'LWC_CSS', 'style-compiler', error),
    );

    return {
        filePath,
        scoped,
        stylesheet,
        sourceObjects: registry.toSourceObjects(),
        resolvedError: listener.getResolvedErrors(filePath),
    };
};
