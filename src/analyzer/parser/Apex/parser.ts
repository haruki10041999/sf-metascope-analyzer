import fs from 'node:fs/promises';
import path from 'path';

import {
    convertApexUnit,
    ErrorType,
    UnitVisitor,
    makeCompilationUnitJson,
    CompilationUnitJson,
    makeTriggerUnitJson,
    TriggerUnitJson,
    makeAnonymousUnitJson,
    AnonymousUnitJson,
    makeConvertType,
    JsonType,
    SourceJson,
    ErrorJson,
    isErrorJson,
    regenerateSourceObjects,
    StructureJsonType,
    ConvertKeys,
    hash,
    ApexErrorTypeClass,
    SourceSpan,
    ApexMetaJson,
    XmlReadProblem,
    XmlSourceJson,
    XmlSourceRegistry,
    getApexMetaSuffix,
    makeApexMetaJson,
} from '../../types';

import { ApexParserFactory } from '@apexdevtools/apex-parser';

import { collectErrorTypeClasses } from '../../types/apex_IR/commonVisitor';
import { ApexCommonErrorListener, type ApexResolvedErrorEntry } from './errorListener';

import {
    SaveDataInfo,
    ApexResolvedError,
    XmlResolvedError,
    makeJsonSaveData,
    makeMsgPackSaveData,
    readMsgPack,
    readSource,
    readXmlFile,
    toXmlResolvedError,
    toApexResolvedError,
} from '../commons';

export type ApexFileStructureType<T extends { fileType: string } = { fileType: string }> = {
    filePath: string;
    resolvedError: ({ sourceKeys: ConvertKeys } & ApexResolvedError & SourceSpan)[];
    dataType: T['fileType'];
    result: {
        id: string;
        base: Omit<T, 'fileType'>;
        sourceObject: SourceJson[];
    };
};

export type ErrorApexFileStructureType = {
    filePath: string;
    resolvedError: ({ sourceKeys: ConvertKeys } & ApexResolvedError & SourceSpan)[];
    dataType: 'error';
    result: {
        id: string;
        base: ErrorType | ErrorJson;
        sourceObject?: SourceJson[];
    };
};

export type ApexParseResult = ErrorApexFileStructureType | ApexFileStructureType;

export type DiffFileInfo = {
    filePath: string;
    pastParsedResultPath: string;
};

/** クラス・トリガーのメタデータ (-meta.xml) の解析結果。Apex の ApexFileStructureType と同じ形 */
export type ApexMetaFileStructureType = {
    filePath: string;
    resolvedError: XmlResolvedError[];
    dataType: ApexMetaJson['kind'];
    result: {
        /** ファイル名 (<名前>.cls-meta.xml など) */
        id: string;
        base: ApexMetaJson;
        sourceObject: XmlSourceJson[];
    };
};

/** -meta.xml が読めなかったとき */
export type ErrorApexMetaFileStructureType = {
    filePath: string;
    resolvedError: XmlResolvedError[];
    dataType: 'error';
    result: {
        id: string;
        base: ErrorJson;
        sourceObject: XmlSourceJson[];
    };
};

export type ApexMetaParseResult = ApexMetaFileStructureType | ErrorApexMetaFileStructureType;

const APEX_SOURCE_EXTENSIONS = ['.apex', '.cls', '.trigger'];

export class ApexParser {
    /** rootDir の下の Apex のファイル。includeMeta なら、クラス・トリガーのメタデータ (-meta.xml) も含める */
    static async searchApexFiles(
        rootDir: string,
        { includeMeta = true }: { includeMeta?: boolean } = {},
    ): Promise<string[]> {
        const entries = await fs.readdir(rootDir, { recursive: true, withFileTypes: true });

        return entries
            .filter(
                (entry) =>
                    entry.isFile() &&
                    (APEX_SOURCE_EXTENSIONS.includes(path.extname(entry.name).toLowerCase()) ||
                        (includeMeta && getApexMetaSuffix(entry.name) !== undefined)),
            )
            .map((entry) => path.join(entry.parentPath, entry.name));
    }

    /** ファイルの種類で解析を切り替える。-meta.xml は parseApexMeta、それ以外は parseApexClass */
    static async parseApexFile(filePath: string): Promise<ApexParseResult | ApexMetaParseResult> {
        return getApexMetaSuffix(filePath)
            ? ApexParser.parseApexMeta(filePath)
            : ApexParser.parseApexClass(filePath);
    }

    /** クラス・トリガーのメタデータ (<名前>.cls-meta.xml / <名前>.trigger-meta.xml) を読む */
    static async parseApexMeta(filePath: string): Promise<ApexMetaParseResult> {
        const baseName = path.basename(filePath);
        const suffix = getApexMetaSuffix(baseName);
        if (!suffix) {
            throw new Error(`not an Apex metadata file: ${filePath}`);
        }

        // ソース位置のファイルのパスは、実行環境に依らないようファイル名にする
        const file = await readXmlFile(filePath, baseName, baseName.slice(0, -suffix.length));
        const registry = new XmlSourceRegistry();
        const problems: XmlReadProblem[] = [];
        const meta = makeApexMetaJson(suffix, file, registry, problems);
        const resolvedError = problems.map(toXmlResolvedError);
        const sourceObject = registry.toSourceObjects();

        return meta.kind === 'error'
            ? {
                  filePath,
                  resolvedError,
                  dataType: 'error',
                  result: { id: baseName, base: meta, sourceObject },
              }
            : {
                  filePath,
                  resolvedError,
                  dataType: meta.kind,
                  result: { id: baseName, base: meta, sourceObject },
              };
    }

    static async parseApexClass(filePath: string): Promise<ApexParseResult> {
        const baseName = path.basename(filePath);
        const source = await readSource(filePath);
        const errorListener = new ApexCommonErrorListener(source);

        const { parser } = ApexParserFactory.createLexerAndParser(source, errorListener);

        // 拡張子で解析ルールを切り替える
        const extension = path.extname(filePath).toLowerCase();
        const unitContext =
            extension === '.trigger'
                ? parser.triggerUnit()
                : extension === '.apex'
                  ? parser.anonymousUnit()
                  : parser.compilationUnit();
        const unitTypeClass = new UnitVisitor().visit(unitContext);

        // 構文エラーは解析中に集まる。そのあとで IR を作れなかったもの (analyzer) を渡す
        // (構文エラーの位置に重なるものはリスナーが除く。LWC の LwcParser.parseScript と同じ)
        collectErrorTypeClasses(unitTypeClass).forEach((error) =>
            errorListener.analyzerError(error),
        );
        const resolvedErrors: ApexResolvedErrorEntry[] = errorListener.getResolvedErrors();

        const unitConvertType = convertApexUnit(unitTypeClass);

        if (unitConvertType.type === 'error') {
            return {
                filePath: filePath,
                resolvedError: resolvedErrors,
                dataType: 'error',
                result: {
                    id: baseName,
                    base: unitConvertType,
                },
            };
        }

        const { result, sourceObjects } = await makeConvertType(unitConvertType);

        let unit: CompilationUnitJson | TriggerUnitJson | AnonymousUnitJson | ErrorJson;
        if (result.type === 'compilationUnit') {
            unit = makeCompilationUnitJson(result);
        } else if (result.type === 'anonymousUnit') {
            unit = makeAnonymousUnitJson(result);
        } else {
            unit = makeTriggerUnitJson(result);
        }

        const regenerateSource = regenerateSourceObjects(sourceObjects, unit);

        if (isErrorJson(unit)) {
            return {
                filePath: filePath,
                resolvedError: resolvedErrors,
                dataType: 'error',
                result: {
                    id: baseName,
                    base: unit,
                    sourceObject: regenerateSource,
                },
            };
        } else {
            const { fileType, ...rest } = unit;
            return {
                filePath: filePath,
                resolvedError: resolvedErrors,
                dataType: fileType,
                result: {
                    id: baseName,
                    base: rest,
                    sourceObject: regenerateSource,
                },
            };
        }
    }

    // 本番用: 解析結果を msgpackr で <baseDir>/<id>.msgpack に保存する
    static saveApexFile(
        baseDir: string,
        target: ApexParseResult | ApexMetaParseResult,
    ): SaveDataInfo[] {
        const filePath = target.filePath;
        const id = filePath.endsWith('.xml')
            ? `apexMeta_${target.result.id}`
            : `apex_${target.result.id}`;

        return [makeMsgPackSaveData('Apex', baseDir, id, target)];
    }

    //開発者でのデータ確認用
    static saveApexFileForDevelopper(
        baseDir: string,
        target: ApexParseResult | ApexMetaParseResult,
    ): SaveDataInfo[] {
        const filePath = target.filePath;
        const id = filePath.endsWith('.xml')
            ? `apexMeta_${target.result.id}`
            : `apex_${target.result.id}`;
        return [makeJsonSaveData('Apex', baseDir, id, target)];
    }

    // 本番用: saveApexFile で保存した <baseDir>/<id>.msgpack を読み込む
    static async readApexMsgPack(
        baseDir: string,
        id: string,
    ): Promise<ApexParseResult | ApexMetaParseResult> {
        return readMsgPack<
            | ApexFileStructureType<
                  { fileType: string } & (
                      | JsonType<string>
                      | StructureJsonType<string, Record<string, ConvertKeys | ConvertKeys[]>>
                  )
              >
            | ApexMetaFileStructureType
        >(baseDir, id, 'Apex');
    }
}
