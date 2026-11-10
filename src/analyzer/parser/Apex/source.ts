// Apex のソース (.cls / .trigger / .apex) 1 つの解析。ファイルシステムには触らない (読み込みは folder.ts)。
// 流れ: ANTLR (リスナーで構文エラーを集める) → apex_IR (作れなかったところはリスナーの resolvedError へ) → JSON
// (docs/ir-integration.md)
import { ApexParserFactory } from '@apexdevtools/apex-parser';

import {
    AnonymousUnitJson,
    CompilationUnitJson,
    SourceJson,
    TriggerUnitJson,
    makeAnonymousUnitJson,
    makeCompilationUnitJson,
    makeTriggerUnitJson,
    regenerateSourceObjects,
} from '../../types';
import { buildApexIr } from '../../types/apex_IR/commonVisitor';
import {
    AnonymousUnitTypeClass,
    CompilationUnitTypeClass,
    TriggerUnitTypeClass,
} from '../../types/apex_IR/unitVisitor';
import { collectSourceObjects } from '../../types/commons/ir';

import { ApexCommonErrorListener, type ApexResolvedErrorEntry } from './errorListener';

/** ソースの種類 (拡張子で決まる) */
export type ApexSourceFileType = 'cls' | 'trigger' | 'anonymous';

type UnitJson = CompilationUnitJson | TriggerUnitJson | AnonymousUnitJson;

/** ソースの JSON。読めなかったとき (IR・JSON を作れなかった) は fileType: 'error' で中身を持たない (理由は resolvedError) */
export type ApexSourceJson =
    | {
          /** ファイル名 (Foo.cls) */
          fileName: string;
          fileType: ApexSourceFileType;
          /** fileType を除いた CompilationUnitJson / TriggerUnitJson / AnonymousUnitJson */
          content: Omit<UnitJson, 'fileType'>;
      }
    | { fileName: string; fileType: 'error' };

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

    // 構文エラーは解析中に集まる。そのあとで IR を作れなかったところ (IrError) を渡す
    // (構文エラーがあるファイルでは、リスナーは構文エラーだけを出す。LWC の parseLwcModule と同じ)
    const built =
        fileType === 'trigger'
            ? buildApexIr(
                  parser.triggerUnit(),
                  (c) => TriggerUnitTypeClass.create(c),
                  'triggerUnit',
              )
            : fileType === 'anonymous'
              ? buildApexIr(
                    parser.anonymousUnit(),
                    (c) => AnonymousUnitTypeClass.create(c),
                    'anonymousUnit',
                )
              : buildApexIr(
                    parser.compilationUnit(),
                    (c) => CompilationUnitTypeClass.create(c),
                    'compilationUnit',
                );
    errorListener.irErrors(built.errors);
    const resolvedError = errorListener
        .getResolvedErrors()
        .map((error) => ({ ...error, filePath: fileName }));

    // unit を作れなかった (ファイル全体が読めない) ときは、中身を持たない (理由は resolvedError)
    const unitNode = built.result;
    if (!unitNode) {
        return {
            source: { fileName, fileType: 'error' },
            sourceObject: [],
            resolvedError,
        };
    }

    const unit: UnitJson =
        unitNode.kind === 'compilationUnit'
            ? makeCompilationUnitJson(unitNode)
            : unitNode.kind === 'anonymousUnit'
              ? makeAnonymousUnitJson(unitNode)
              : makeTriggerUnitJson(unitNode);
    const sourceObject = regenerateSourceObjects(collectSourceObjects(unitNode), unit);
    const { fileType: _fileType, ...content } = unit;
    return { source: { fileName, fileType, content }, sourceObject, resolvedError };
};
