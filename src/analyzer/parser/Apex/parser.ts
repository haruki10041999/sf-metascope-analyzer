import fs, { mkdir, writeFile } from 'node:fs/promises';
import path from 'path';
import { pathToFileURL } from 'node:url';

import { Packr } from 'msgpackr';

import {
    assignMultiClass,
    CompilationUnitType,
    makeCompilationUnitAssignRule,
    TriggerUnitType,
    makeTriggerUnitAssignRule,
    AnonymousUnitType,
    makeAnonymousUnitAssignRule,
    ErrorType,
    makeErrorAssignRule,
    UnitVisitor,
    CommonErrorListener,
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
    TypeJson,
    SoqlJson,
    SoslJson,
    DotMethodCallJson,
    MethodCallJson,
    StructureJson,
    ConvertKeys,
    hash,
    ErrorTypeClass,
    SourceSpan,
} from '../../types';

import { ApexParserFactory } from '@apexdevtools/apex-parser';

type ResolvedErrorType = {
    code: string;
    contextType: string;
    context: string;
    errorMessage: string;
};

export type ErrorFileStructureType = {
    filePath: string;
    resolvedError: ({ sourceKeys: ConvertKeys } & ResolvedErrorType & SourceSpan)[];
    dataType: 'error';
    result: {
        id: string;
        base: ErrorType | ErrorJson;
        sourceObject?: SourceJson[];
    };
};

export type FileStructureType<T extends { fileType: string } = { fileType: string }> = {
    filePath: string;
    resolvedError: ({ sourceKeys: ConvertKeys } & ResolvedErrorType & SourceSpan)[];
    dataType: T['fileType'];
    result: {
        id: string;
        base: Omit<T, 'fileType'>;
        sourceObject: SourceJson[];
    };
};

export type SaveDataInfo = {
    outputPath: URL;
    data: unknown;
};

export const makeResolvedError = (
    target: ErrorTypeClass,
): { sourceKeys: ConvertKeys } & ResolvedErrorType & SourceSpan => {
    const resolvedErrorType: ResolvedErrorType = {
        code: target.getCode(),
        contextType: target.getContextType(),
        context: target.getContext(),
        errorMessage: target.getParseErrorMessage(),
    };

    const sourceSpan = target.getSpan()!;
    const sourceKeys: ConvertKeys = {
        objectKey: hash(resolvedErrorType),
        sourceKey: hash(sourceSpan),
    };

    return {
        sourceKeys: sourceKeys,
        ...resolvedErrorType,
        ...sourceSpan,
    };
};

// 本番保存用。records (同じキー構成をまとめる msgpackr 独自拡張) を使い、サイズと読み込み速度を優先する。
// structures (構造定義の共有) は使わないため、1 ファイル単体で読み込める。
// records を使うので msgpackr 以外の MessagePack 実装では読めない点に注意。
const packr = new Packr({ useRecords: true });

export class ApexParser {
    static async searchApexFiles(rootDir: string): Promise<string[]> {
        const entries = await fs.readdir(rootDir, { recursive: true, withFileTypes: true });

        return entries
            .filter(
                (entry) =>
                    entry.isFile() &&
                    ['.apex', '.cls', '.trigger'].includes(path.extname(entry.name).toLowerCase()),
            )
            .map((entry) => path.join(entry.parentPath, entry.name));
    }

    static async parseApexClass(
        filePath: string,
    ): Promise<ErrorFileStructureType | FileStructureType> {
        const baseName = path.basename(filePath);
        const source = await fs.readFile(filePath, 'utf-8');
        const errorListener = new CommonErrorListener(source);

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

        // 構文エラーは解析後にしか集まらないため、ここで取得する
        const unResolvedError = errorListener.getErrors();

        const resolvedErrors: ({ sourceKeys: ConvertKeys } & ResolvedErrorType & SourceSpan)[] =
            unResolvedError.map((error) => makeResolvedError(error));

        const unitConvertType = assignMultiClass(unitTypeClass, [
            makeCompilationUnitAssignRule,
            makeTriggerUnitAssignRule,
            makeAnonymousUnitAssignRule,
            makeErrorAssignRule,
        ]);

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

    // 本番用: FileStructureType を msgpackr で <baseDir>/<id>.msgpack に保存する
    static saveApexFile(baseDir: string, target: FileStructureType): SaveDataInfo[] {
        // 末尾が '/' でないと相対 URL が親ディレクトリ基準で解決されるため、必ず付ける
        const outputDirectory = pathToFileURL(path.join(baseDir, path.sep));
        const encodingData = packr.pack(target);

        return [
            {
                outputPath: new URL(`./${target.result.id}.msgpack`, outputDirectory),
                data: encodingData,
            },
        ];
    }

    //開発者でのデータ確認用
    static saveApexFileForDevelopper(baseDir: string, target: FileStructureType): SaveDataInfo[] {
        // 末尾が '/' でないと相対 URL が親ディレクトリ基準で解決されるため、必ず付ける
        const outputDirectory = pathToFileURL(path.join(baseDir, path.sep));

        return [
            {
                outputPath: new URL(`./${target.result.id}.json`, outputDirectory),
                data: `${JSON.stringify(target, null, 2)}\n`,
            },
        ];
    }

    // 本番用: saveApexFile で保存した <baseDir>/<id>.msgpack を読み込む
    static async readApexMsgPack(baseDir: string, id: string): Promise<FileStructureType> {
        const inputFile = path.join(baseDir, `${id}.msgpack`);

        const content = await fs.readFile(inputFile).catch(() => {
            throw new Error(`Saved Apex file not found: ${inputFile}`);
        });

        return packr.unpack(content) as FileStructureType<
            { fileType: string } & (
                | JsonType<string>
                | StructureJson<string, Record<string, ConvertKeys | ConvertKeys[]>>
            )
        >;
    }
}
