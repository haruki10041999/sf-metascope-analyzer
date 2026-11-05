// LWC のテンプレート (.html) の parse と検証 (docs/lwc-template-stylesheet-plan.md 6.1・6.6)。
// ① parse5 で構文解析 → JSON (中間表現は作らない)、② @lwc/template-compiler で LWC のテンプレートとして検証。
// HTML の構文エラーも template-compiler が LWC1058 などで返すので、parse5 の onParseError は使わない (6.6.1)
import { parse } from '@lwc/template-compiler';
import { parseFragment } from 'parse5';

import {
    SpanSourceRegistry,
    makeLwcTemplateJson,
    type ErrorJson,
    type LwcTemplateJson,
    type SpanSourceJson,
} from '../../types';

import { LwcCommonErrorListener, type LwcResolvedError } from './errorListener';
import type { LwcDiagnostic } from './validate/javascript';

export type LwcTemplateParseResult = {
    /** バンドルのフォルダの親からの相対パス (hello/hello.html) */
    filePath: string;
    /** ルートの <template> がないときは ErrorJson (kindType: 'lwcTemplate') */
    template: LwcTemplateJson | ErrorJson;
    sourceObjects: SpanSourceJson[];
    resolvedError: LwcResolvedError[];
};

export type LwcTemplateParseOptions = {
    /** バンドル名 (template-compiler の name) */
    name?: string;
    /** 名前空間 (既定は c) */
    namespace?: string;
    /** js-meta.xml の apiVersion */
    apiVersion?: number;
};

// @lwc/errors の DiagnosticLevel (Fatal / Error / Warning / Log)
const LEVEL_WARNING = 2;
const LEVEL_LOG = 3;

/** HTML として・テンプレートとして読めないもの (phase syntax にする) */
const SYNTAX_CODES = [1058, 1075, 1078, 1079];

type TemplateWarning = ReturnType<typeof parse>['warnings'][number];

/** template-compiler の診断 → LwcDiagnostic (位置は start と length の文字位置) */
const toDiagnostic = (warning: TemplateWarning): LwcDiagnostic => {
    const code = `LWC${warning.code}`;
    const message = warning.message
        .replace(/^Invalid expression \{[\s\S]*?\} - /, '')
        .replace(/^LWC\d+: /, '')
        .trim();
    // LWC1058 は parse5 のエラーコード (Invalid HTML syntax: <コード>. For more ...)
    const parse5Code =
        warning.code === 1058 ? /Invalid HTML syntax: ([\w-]+)/.exec(message)?.[1] : undefined;
    const start = warning.location?.start ?? null;
    return {
        code,
        contextType: parse5Code ?? code,
        level: warning.level >= LEVEL_WARNING ? 'warning' : 'error',
        message,
        start,
        end: start === null ? null : start + (warning.location?.length ?? 0),
    };
};

/** ② @lwc/template-compiler の検証 (例外は投げず、すべての違反を warnings に返す) */
export const validateTemplate = (
    source: string,
    options: LwcTemplateParseOptions = {},
): { diagnostic: LwcDiagnostic; syntax: boolean }[] => {
    const { warnings } = parse(source, {
        ...(options.name ? { name: options.name } : {}),
        namespace: options.namespace ?? 'c',
        // lwc:component / lwc:on を違反にしない (使ってよいかはこちらで見る。6.6.2)
        enableDynamicComponents: true,
        enableLwcOn: true,
        ...(options.apiVersion ? { apiVersion: options.apiVersion } : {}),
    });
    return warnings
        .filter((warning) => warning.level < LEVEL_LOG)
        .map((warning) => ({
            diagnostic: toDiagnostic(warning),
            syntax: SYNTAX_CODES.includes(warning.code),
        }));
};

/** 1 つのテンプレートを読む。filePath はバンドルのフォルダの親からの相対パス */
export const parseTemplate = (
    filePath: string,
    source: string,
    options: LwcTemplateParseOptions = {},
): LwcTemplateParseResult => {
    const listener = new LwcCommonErrorListener(source);
    const registry = new SpanSourceRegistry();

    // ① 構文解析 (parse5 は回復して必ず木を返す)
    const fragment = parseFragment(source, { sourceCodeLocationInfo: true });
    const template = makeLwcTemplateJson(fragment, { filePath, source }, registry, {
        ...(options.namespace ? { namespace: options.namespace } : {}),
    });

    // ② LWC のテンプレートとしての検証 (違反があっても JSON は作る)
    validateTemplate(source, options).forEach(({ diagnostic, syntax }) =>
        listener.lwcDiagnostic(diagnostic, syntax ? 'syntax' : 'lwc'),
    );

    return {
        filePath,
        template,
        sourceObjects: registry.toSourceObjects(),
        resolvedError: listener.getResolvedErrors(filePath),
    };
};
