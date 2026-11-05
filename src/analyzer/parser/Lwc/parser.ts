// LWC の parser (docs/lwc-parse-plan.md 2.4・3.1.7・4.2)。Apex の parser/Apex/parser.ts と同じ流れ:
// ソース → lwc_IR → converter (CommonType。sourceInfo を持つ) → JSON (sourceInfo を sourceKeys / sourceObject に分ける)。
// いまは JS / TS だけ。HTML / CSS / XML は lwc-parse-plan.md 7 章の順で足す
import fs from 'node:fs/promises';
import path from 'node:path';

import {
    hash,
    makeErrorJson,
    LwcJsonContext,
    makeLwcModuleJson,
    convertLwcFile,
    type ErrorJson,
    type LwcBundleJson,
    type LwcModuleJson,
    type LwcSourceJson,
} from '../../types';
import { collectErrorTypeClasses, visitWithPairs } from '../../types/lwc_IR/commonVisitor';
import {
    fileTypePair,
    isFileType,
    type FileTypeClass,
} from '../../types/lwc_IR/standardizedVisitor/file';
import {
    makeJsonSaveData,
    makeMsgPackSaveData,
    readMsgPack,
    readSource,
    type SaveDataInfo,
} from '../commons';

import { LwcCommonErrorListener, type LwcResolvedError } from './errorListener';
import { getScriptLanguage, parseScript, type ScriptLanguage } from './script';
import { validateScript } from './validate/javascript';

export type LwcScriptParseResult = {
    /** バンドルのフォルダの親からの相対パス (hello/hello.ts) */
    filePath: string;
    language: ScriptLanguage;
    /** ノードの IR。回復できない構文エラーで AST がないときは null */
    ir: FileTypeClass | null;
    resolvedError: LwcResolvedError[];
};

export type LwcSkippedFile = {
    /** バンドルのフォルダの親からの相対パス */
    filePath: string;
    reason: string;
};

export type LwcBundleScriptsParseResult = {
    /** バンドル名 (hello) */
    name: string;
    scripts: LwcScriptParseResult[];
    skippedFiles: LwcSkippedFile[];
    /** scripts の resolvedError をまとめたもの */
    resolvedError: LwcResolvedError[];
};

export type LwcParseOptions = {
    /** 名前空間 (既定は c) */
    namespace?: string;
};

/** バンドルの解析結果 (2.4)。Apex の ApexFileStructureType と同じ形 */
export type LwcBundleStructureType = {
    /** バンドルのフォルダ */
    filePath: string;
    /** バンドルの中のすべてのファイルの診断 (filePath で区別する) */
    resolvedError: LwcResolvedError[];
    dataType: 'lwcBundle';
    result: {
        /** バンドル名 */
        id: string;
        base: LwcBundleJson;
        sourceObject: LwcSourceJson[];
    };
};

/** フォルダが読めない・メインのモジュールがないとき */
export type ErrorLwcBundleStructureType = {
    filePath: string;
    resolvedError: LwcResolvedError[];
    dataType: 'error';
    result: {
        id: string;
        base: ErrorJson;
        sourceObject: LwcSourceJson[];
    };
};

export type LwcBundleParseResult = LwcBundleStructureType | ErrorLwcBundleStructureType;

export type LwcScriptConvertResult = {
    module: LwcModuleJson | ErrorJson;
    /** JSON に残った objectKey / sourceKey だけのソース位置 (filePath 付き) */
    sourceObjects: LwcSourceJson[];
};

const SCRIPT_EXTENSIONS = ['.js', '.ts'];
/** メインのモジュール (<バンドル名>.ts / <バンドル名>.js) か */
const isMainScript = (filePath: string, bundleName: string) =>
    /^.(js|ts)$/i.test(path.posix.basename(filePath).slice(bundleName.length)) &&
    path.posix.basename(filePath).startsWith(bundleName);
const isIgnoredScript = (fileName: string) =>
    /\.test\.[jt]s$/i.test(fileName) || /\.d\.ts$/i.test(fileName);

export class LwcParser {
    /**
     * 1 つの JS / TS を読む。
     * ① Babel (errorRecovery) → ノードの IR → ② 構文エラーがなければ LWC Compiler で検証、の順。
     * filePath はバンドルのフォルダの親からの相対パス (hello/hello.ts)。バンドル名はその親のフォルダ名
     */
    static parseScript(
        filePath: string,
        source: string,
        options: LwcParseOptions = {},
    ): LwcScriptParseResult {
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
    }

    /**
     * バンドルのフォルダから、読む JS / TS を選ぶ (4.2)。
     * 同じ名前の .ts と .js があれば .ts を読み、.js は skippedFiles にする。*.test.*・*.d.ts は読まない。
     * フォルダ (__tests__/ など) の中は読まない
     */
    static async selectScripts(
        bundleDir: string,
    ): Promise<{ files: string[]; skippedFiles: LwcSkippedFile[] }> {
        const name = path.basename(bundleDir);
        const entries = await fs.readdir(bundleDir, { withFileTypes: true });
        const scripts = entries
            .filter(
                (entry) =>
                    entry.isFile() &&
                    SCRIPT_EXTENSIONS.includes(path.extname(entry.name).toLowerCase()) &&
                    !isIgnoredScript(entry.name),
            )
            .map((entry) => entry.name)
            .sort();

        const stems = new Set(
            scripts
                .filter((file) => path.extname(file).toLowerCase() === '.ts')
                .map((file) => file.slice(0, -3)),
        );
        const files: string[] = [];
        const skippedFiles: LwcSkippedFile[] = [];
        for (const file of scripts) {
            const isJs = path.extname(file).toLowerCase() === '.js';
            if (isJs && stems.has(file.slice(0, -3))) {
                skippedFiles.push({
                    filePath: `${name}/${file}`,
                    reason: `compiled from ${file.slice(0, -3)}.ts`,
                });
            } else {
                files.push(path.join(bundleDir, file));
            }
        }
        return { files, skippedFiles };
    }

    /**
     * parseScript の結果を JSON にする (Apex の parseApexClass の後半と同じ)。
     * IR → CommonType (convertLwcFile。sourceInfo を持つ) → JSON (makeLwcModuleJson。sourceInfo を sourceKeys / sourceObject に分ける)。
     * 回復できない構文エラーで IR がないときは、その構文エラーのキーで ErrorJson にする
     */
    static async convertScript(script: LwcScriptParseResult): Promise<LwcScriptConvertResult> {
        if (!script.ir) {
            const keys = script.resolvedError[0]?.sourceKeys ?? {
                objectKey: `error_${hash(script.filePath)}`,
                sourceKey: `error_${hash(script.filePath)}`,
            };
            return { module: makeErrorJson(keys, 'lwcModule'), sourceObjects: [] };
        }
        // converter の出力は sourceInfo を持ったまま。JSON を作る段階で sourceKeys と sourceObject に分ける
        const commonType = convertLwcFile(script.ir, script.filePath);
        const context = new LwcJsonContext(script.filePath);
        const module = makeLwcModuleJson(commonType, script.language, context);
        return { module, sourceObjects: context.toSourceObjects() };
    }

    /**
     * バンドル (lwc/<名前>/ のフォルダ) を読む (2.4)。いまは JS / TS のモジュールだけ。
     * フォルダが読めない・メインのモジュール (<名前>.ts / .js) がないときは dataType: 'error'
     */
    static async parseLwcBundle(
        bundleDir: string,
        options: LwcParseOptions = {},
    ): Promise<LwcBundleParseResult> {
        const name = path.basename(bundleDir);
        const errorResult = (reason: string): ErrorLwcBundleStructureType => ({
            filePath: bundleDir,
            resolvedError: [],
            dataType: 'error',
            result: {
                id: name,
                base: makeErrorJson(
                    { objectKey: `error_${hash(reason)}`, sourceKey: `error_${hash(bundleDir)}` },
                    'lwcBundle',
                ),
                sourceObject: [],
            },
        });

        let parsed: LwcBundleScriptsParseResult;
        try {
            parsed = await LwcParser.parseBundleScripts(bundleDir, options);
        } catch {
            return errorResult('bundle folder cannot be read');
        }
        if (!parsed.scripts.some((script) => isMainScript(script.filePath, name))) {
            return { ...errorResult('main module not found'), resolvedError: parsed.resolvedError };
        }

        const modules: LwcBundleJson['modules'] = [];
        const sourceObject: LwcSourceJson[] = [];
        for (const script of parsed.scripts) {
            const { module, sourceObjects } = await LwcParser.convertScript(script);
            modules.push({
                fileName: path.posix.basename(script.filePath),
                main: isMainScript(script.filePath, name),
                module,
            });
            sourceObject.push(...sourceObjects);
        }

        return {
            filePath: bundleDir,
            resolvedError: parsed.resolvedError,
            dataType: 'lwcBundle',
            result: {
                id: name,
                base: {
                    name,
                    namespace: options.namespace ?? 'c',
                    modules,
                    skippedFiles: parsed.skippedFiles,
                },
                sourceObject,
            },
        };
    }

    // 本番用: 解析結果を msgpackr で <baseDir>/lwc_<バンドル名>.msgpack に保存する (Apex の saveApexFile と同じ)
    static saveLwcBundle(baseDir: string, target: LwcBundleParseResult): SaveDataInfo[] {
        return [makeMsgPackSaveData('Lwc', baseDir, `lwc_${target.result.id}`, target)];
    }

    // 開発者でのデータ確認用
    static saveLwcBundleForDevelopper(
        baseDir: string,
        target: LwcBundleParseResult,
    ): SaveDataInfo[] {
        return [makeJsonSaveData('Lwc', baseDir, `lwc_${target.result.id}`, target)];
    }

    // 本番用: saveLwcBundle で保存した <baseDir>/<id>.msgpack を読み込む
    static async readLwcMsgPack(baseDir: string, id: string): Promise<LwcBundleParseResult> {
        return readMsgPack<LwcBundleParseResult>(baseDir, id, 'Lwc');
    }

    /** バンドルのフォルダの JS / TS をすべて読む */
    static async parseBundleScripts(
        bundleDir: string,
        options: LwcParseOptions = {},
    ): Promise<LwcBundleScriptsParseResult> {
        const name = path.basename(bundleDir);
        const { files, skippedFiles } = await LwcParser.selectScripts(bundleDir);
        const scripts: LwcScriptParseResult[] = [];
        for (const file of files) {
            const source = await readSource(file);
            scripts.push(LwcParser.parseScript(`${name}/${path.basename(file)}`, source, options));
        }
        return {
            name,
            scripts,
            skippedFiles,
            resolvedError: scripts.flatMap((script) => script.resolvedError),
        };
    }
}
