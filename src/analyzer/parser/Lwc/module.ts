// LWC の JS / TS のモジュールの parse と JSON への変換 (docs/lwc-parse-plan.md 3.1)。
// Apex の parseApexSource (parser/Apex/source.ts) と同じ流れ: ソース → lwc_IR → converter (CommonType。sourceInfo を持つ) →
// JSON (sourceInfo を sourceKeys / sourceObject に分ける)
import path from 'node:path';

import {
    LwcJsonContext,
    convertLwcFile,
    hash,
    makeErrorJson,
    makeLwcModuleJson,
    type ErrorJson,
    type LwcModuleJson,
    type LwcSourceJson,
} from '../../types';
import { collectErrorTypeClasses, visitWithPairs } from '../../types/lwc_IR/commonVisitor';
import {
    fileTypePair,
    isFileType,
    type FileTypeClass,
} from '../../types/lwc_IR/standardizedVisitor/file';

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
    module: LwcModuleJson | ErrorJson;
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

    // ノードの IR。構文エラーの位置に重なる LwcErrorTypeClass はリスナーが除く
    const visited = visitWithPairs(ast, source, [fileTypePair], 'LwcParser');
    const ir = isFileType(visited) ? visited : null;
    collectErrorTypeClasses(visited).forEach((error) => listener.analyzerError(error));

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
 * IR → CommonType (convertLwcFile。sourceInfo を持つ) → JSON (makeLwcModuleJson。sourceInfo を sourceKeys / sourceObject に分ける)。
 * 回復できない構文エラーで IR がないときは、その構文エラーのキーで ErrorJson にする
 */
export const convertLwcModule = (parsed: LwcModuleParseResult): LwcModuleConvertResult => {
    if (!parsed.ir) {
        const keys = parsed.resolvedError[0]?.sourceKeys ?? {
            objectKey: `error_${hash(parsed.filePath)}`,
            sourceKey: `error_${hash(parsed.filePath)}`,
        };
        return { module: makeErrorJson(keys, 'lwcModule'), sourceObjects: [] };
    }
    const commonType = convertLwcFile(parsed.ir, parsed.filePath);
    const context = new LwcJsonContext(parsed.filePath);
    const module = makeLwcModuleJson(commonType, parsed.language, context);
    return { module, sourceObjects: context.toSourceObjects() };
};
