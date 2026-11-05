// Apex のソース (.cls / .trigger / .apex) 1 つの解析。ファイルシステムには触らない (読み込みは folder.ts)。
// 流れ: ANTLR (リスナーで構文エラーを集める) → apex_IR → converter (CommonType) → JSON
import { ApexParserFactory } from '@apexdevtools/apex-parser';

import {
    AnonymousUnitJson,
    CompilationUnitJson,
    ErrorJson,
    ErrorType,
    SourceJson,
    TriggerUnitJson,
    UnitVisitor,
    convertApexUnit,
    isErrorJson,
    makeAnonymousUnitJson,
    makeCompilationUnitJson,
    makeConvertType,
    makeTriggerUnitJson,
    regenerateSourceObjects,
} from '../../types';
import { collectErrorTypeClasses } from '../../types/apex_IR/commonVisitor';

import { ApexCommonErrorListener, type ApexResolvedErrorEntry } from './errorListener';

/** ソースの種類 (拡張子で決まる) */
export type ApexSourceFileType = 'cls' | 'trigger' | 'anonymous';

type UnitJson = CompilationUnitJson | TriggerUnitJson | AnonymousUnitJson;

/** ソースの JSON。読めなかったとき (IR・JSON を作れなかった) は fileType: 'error' */
export type ApexSourceJson =
    | {
          /** ファイル名 (Foo.cls) */
          fileName: string;
          fileType: ApexSourceFileType;
          /** fileType を除いた CompilationUnitJson / TriggerUnitJson / AnonymousUnitJson */
          content: Omit<UnitJson, 'fileType'>;
      }
    | { fileName: string; fileType: 'error'; content: ErrorType | ErrorJson };

/** ソースの構文エラー・IR を作れなかったところ。単位の中で区別できるよう filePath (ファイル名) を持つ */
export type ApexSourceResolvedError = ApexResolvedErrorEntry & { filePath: string };

export type ApexSourceParseResult = {
    source: ApexSourceJson;
    sourceObject: SourceJson[];
    resolvedError: ApexSourceResolvedError[];
};

const SOURCE_FILE_TYPES: Record<string, ApexSourceFileType> = {
    '.cls': 'cls',
    '.trigger': 'trigger',
    '.apex': 'anonymous',
};

/** ファイル名からソースの種類を決める (Apex のソースでなければ undefined) */
export const getApexSourceFileType = (fileName: string): ApexSourceFileType | undefined => {
    const dot = fileName.lastIndexOf('.');
    return dot < 0 ? undefined : SOURCE_FILE_TYPES[fileName.slice(dot).toLowerCase()];
};

/** ソース 1 つを解析する。fileName (Foo.cls) の拡張子で解析ルールを切り替える */
export const parseApexSource = async (
    fileName: string,
    source: string,
): Promise<ApexSourceParseResult> => {
    const fileType = getApexSourceFileType(fileName);
    if (!fileType) {
        throw new Error(`not an Apex source file: ${fileName}`);
    }
    const errorListener = new ApexCommonErrorListener(source);
    const { parser } = ApexParserFactory.createLexerAndParser(source, errorListener);
    const unitContext =
        fileType === 'trigger'
            ? parser.triggerUnit()
            : fileType === 'anonymous'
              ? parser.anonymousUnit()
              : parser.compilationUnit();
    const unitTypeClass = new UnitVisitor().visit(unitContext);

    // 構文エラーは解析中に集まる。そのあとで IR を作れなかったもの (analyzer) を渡す
    // (構文エラーの位置に重なるものはリスナーが除く。LWC の parseLwcModule (parser/Lwc/module.ts) と同じ)
    collectErrorTypeClasses(unitTypeClass).forEach((error) => errorListener.analyzerError(error));
    const resolvedError = errorListener
        .getResolvedErrors()
        .map((error) => ({ ...error, filePath: fileName }));

    const unitConvertType = convertApexUnit(unitTypeClass);
    if (unitConvertType.type === 'error') {
        return {
            source: { fileName, fileType: 'error', content: unitConvertType },
            sourceObject: [],
            resolvedError,
        };
    }

    const { result, sourceObjects } = await makeConvertType(unitConvertType);
    const unit: UnitJson | ErrorJson =
        result.type === 'compilationUnit'
            ? makeCompilationUnitJson(result)
            : result.type === 'anonymousUnit'
              ? makeAnonymousUnitJson(result)
              : makeTriggerUnitJson(result);
    const sourceObject = regenerateSourceObjects(sourceObjects, unit);

    if (isErrorJson(unit)) {
        return {
            source: { fileName, fileType: 'error', content: unit },
            sourceObject,
            resolvedError,
        };
    }
    const { fileType: _fileType, ...content } = unit;
    return { source: { fileName, fileType, content }, sourceObject, resolvedError };
};
