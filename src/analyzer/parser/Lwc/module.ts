// LWC の JS / TS のモジュールの parse と JSON への変換 (docs/lwc-implementation.md)。
// Apex の parseApexSource (parser/Apex/source.ts) と同じ流れ: ソース → lwc_IR (作れなかったところはリスナーの resolvedError へ) →
// JSON (キーとソース位置の一覧は JSON を作るときに LwcJsonContext が作る。docs/ir-integration.md)
import path from 'node:path';

import {
    LwcJsonContext,
    makeLwcModuleJson,
    type LwcModuleJson,
    type LwcSourceJson,
} from '../../types';
import { buildLwcIr } from '../../types/lwc_IR/commonVisitor';
import { fileTypePair, type FileTypeClass } from '../../types/lwc_IR/standardizedVisitor/file';

import { LwcCommonErrorListener, type LwcResolvedError } from './errorListener';
import { getScriptLanguage, parseScript, type ScriptLanguage } from './script';
import { validateScript } from './validate/javascript';

export type LwcModuleParseOptions = {
    /** 名前空間 (既定は c) */
    namespace?: string;
};

export type LwcModuleParseResult = {
    /** バンドルのフォルダの親からの相対パス (hello/hello.ts) */
    filePath: string;
    language: ScriptLanguage;
    /** ノードの IR。回復できない構文エラーで AST がないときは null */
    ir: FileTypeClass | null;
    resolvedError: LwcResolvedError[];
};

export type LwcModuleConvertResult = {
    /** 回復できない構文エラーで IR がないときは null (理由は resolvedError) */
    module: LwcModuleJson | null;
    /** JSON に残った objectKey / sourceKey だけのソース位置 (filePath 付き) */
    sourceObjects: LwcSourceJson[];
};

/**
 * 1 つの JS / TS を読む。
 * ① Babel (errorRecovery) → ノードの IR → ② 構文エラーがなければ LWC Compiler で検証、の順。
 * filePath はバンドルのフォルダの親からの相対パス (hello/hello.ts)。バンドル名はその親のフォルダ名
 */
export const parseLwcModule = (
    filePath: string,
    source: string,
    options: LwcModuleParseOptions = {},
): LwcModuleParseResult => {
    const language = getScriptLanguage(filePath);
    const listener = new LwcCommonErrorListener(source);

    // ① 構文解析。回復できない構文エラーは IR を作らない
    const { ast, syntaxErrors } = parseScript(source, language);
    syntaxErrors.forEach((error) => listener.babelSyntaxError(error, language));
    if (!ast) {
        return {
            filePath,
            language,
            ir: null,
            resolvedError: listener.getResolvedErrors(filePath),
        };
    }

    // ノードの IR。作れなかったところは木に残さず、リスナーに渡す (構文エラーがあるファイルでは、リスナーは構文エラーだけを出す)
    const built = buildLwcIr(ast, source, [fileTypePair], 'LwcParser');
    const ir = built.result;
    listener.irErrors(built.errors);

    // ② 仕様の検証。構文エラーがあると LWC Compiler (errorRecovery なし) は同じ構文エラーを LWC1007 にするだけなので、しない
    if (!listener.hasSyntaxError()) {
        validateScript(source, {
            filePath,
            name: path.posix.basename(path.posix.dirname(filePath)) || 'unknown',
            ...(options.namespace ? { namespace: options.namespace } : {}),
            language,
            ast,
        }).forEach((diagnostic) => listener.lwcDiagnostic(diagnostic));
    }

    return { filePath, language, ir, resolvedError: listener.getResolvedErrors(filePath) };
};

/**
 * parseLwcModule の結果を JSON にする (Apex の parseApexSource の後半と同じ)。
 * IR v2 → JSON (makeLwcModuleJson。キーとソース位置の一覧は LwcJsonContext が作る)。
 * 回復できない構文エラーで IR がないときは null (JSON にエラーのノードは置かない。構文エラーは parse の resolvedError にある)
 */
export const convertLwcModule = (parsed: LwcModuleParseResult): LwcModuleConvertResult => {
    if (!parsed.ir) {
        return { module: null, sourceObjects: [] };
    }
    const context = new LwcJsonContext(parsed.filePath);
    const module = makeLwcModuleJson(parsed.ir, parsed.language, context);
    return { module, sourceObjects: context.toSourceObjects() };
};
