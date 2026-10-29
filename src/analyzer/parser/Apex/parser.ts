import fs, { mkdir, writeFile } from 'node:fs/promises';
import path from 'path';

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
    regenerateSourceObjects,
    JsonType,
    SourceJson,
    ErrorJson,
    isErrorJson,
} from '../../types';

import { replaceDeclarationRef } from './extractor';

import { ApexParserFactory } from '@apexdevtools/apex-parser';

type ResolvedErrorType = {
    code: string;
    contextType: string;
    context: string;
    errorMessage: string;
};

type SaveFileType = {
    filePath: string;
    resolvedError: ResolvedErrorType[];
} & (
    | {
          dataType: 'error';
          result: ErrorType | ErrorJson;
      }
    | {
          dataType: 'anonymousUnit';
          result: AnonymousUnitJson;
          sourceObjects: SourceJson[];
      }
    | {
          dataType: 'compilationUnit';
          result: CompilationUnitJson;
          sourceObjects: SourceJson[];
      }
    | {
          dataType: 'triggerUnit';
          result: TriggerUnitJson;
          sourceObjects: SourceJson[];
      }
);

type BaseInfo = {
    dataType: string;
    filePath: string;
    unResolvedError: ResolvedErrorType[];
};

type SaveDataInfo = {
    outputPath: URL;
    data: unknown;
};

export class ApexClsParser {
    static async parseApexClass(filePath: string): Promise<SaveFileType> {
        const source = await fs.readFile(filePath, 'utf-8');
        const errorListener = new CommonErrorListener(source);

        const { parser } = ApexParserFactory.createLexerAndParser(source, errorListener);
        const unResolvedError = errorListener.getErrors();

        const unResolvedErrors: ResolvedErrorType[] = unResolvedError.map((error) => ({
            code: error.getCode(),
            contextType: error.getContextType(),
            context: error.getContext(),
            errorMessage: error.getParseErrorMessage(),
        }));

        const unitTypeClass = new UnitVisitor().visit(parser.compilationUnit());

        const unitConvertType = assignMultiClass(unitTypeClass, [
            makeCompilationUnitAssignRule,
            makeTriggerUnitAssignRule,
            makeAnonymousUnitAssignRule,
            makeErrorAssignRule,
        ]);

        if (unitConvertType.type === 'error') {
            return {
                filePath: filePath,
                resolvedError: unResolvedErrors,
                dataType: 'error',
                result: unitConvertType,
            };
        }

        const { result, sourceObjects } = await makeConvertType(unitConvertType);

        if (result.type === 'anonymousUnit') {
            const unit = makeAnonymousUnitJson(result);
            if (isErrorJson(unit)) {
                return {
                    filePath: filePath,
                    resolvedError: unResolvedErrors,
                    dataType: 'error',
                    result: unit,
                };
            }
            return {
                filePath: filePath,
                resolvedError: unResolvedErrors,
                dataType: 'anonymousUnit',
                result: unit,
                sourceObjects: regenerateSourceObjects(sourceObjects, unit),
            };
        } else if (result.type === 'compilationUnit') {
            const unit = makeCompilationUnitJson(result);
            if (isErrorJson(unit)) {
                return {
                    filePath: filePath,
                    resolvedError: unResolvedErrors,
                    dataType: 'error',
                    result: unit,
                };
            }
            return {
                filePath: filePath,
                resolvedError: unResolvedErrors,
                dataType: 'compilationUnit',
                result: unit,
                sourceObjects: regenerateSourceObjects(sourceObjects, unit),
            };
        } else {
            const unit = makeTriggerUnitJson(result);
            if (isErrorJson(unit)) {
                return {
                    filePath: filePath,
                    resolvedError: unResolvedErrors,
                    dataType: 'error',
                    result: unit,
                };
            }
            return {
                filePath: filePath,
                resolvedError: unResolvedErrors,
                dataType: 'triggerUnit',
                result: unit,
                sourceObjects: regenerateSourceObjects(sourceObjects, unit),
            };
        }
    }

    static saveApexFile(baseDir: string, target: SaveFileType): SaveDataInfo[] {
        const jsonBaseName = path.basename(target.filePath).split('.')[0]!;
        const outputDirectory = new URL(path.join(baseDir, jsonBaseName), process.cwd());

        const baseInfo: BaseInfo = {
            dataType: target.dataType,
            filePath: target.filePath,
            unResolvedError: target.resolvedError,
        };

        const baseInfoFile = new URL('./basInfo.json', outputDirectory);

        const saveDataInfo: SaveDataInfo[] = [{ outputPath: baseInfoFile, data: baseInfo }];

        if (target.dataType === 'error') {
            const errorInfoFile = new URL(
                `./${path.basename(target.filePath).split('.')[0]!}.json`,
                outputDirectory,
            );
            saveDataInfo.push({ outputPath: errorInfoFile, data: target.result });
        } else {
            const sourceInfoFile = new URL('./sourceInfo.json', outputDirectory);
            saveDataInfo.push({ outputPath: sourceInfoFile, data: target.sourceObjects });

            if (
                target.result.fileType === 'cls' &&
                (target.result.kind === 'interface' || target.result.kind === 'enum')
            ) {
                const jsonObjectFile = new URL(`./unit.json`, outputDirectory);
                saveDataInfo.push({ outputPath: jsonObjectFile, data: target.result });
            } else {
                const jsonObjectDirectory = new URL(`./result`, outputDirectory);

                const { unit, declarations } = replaceDeclarationRef(target.result);

                const baseUnitFile = new URL(`./unit.json`, jsonObjectDirectory);
                saveDataInfo.push({ outputPath: baseUnitFile, data: unit });

                declarations.forEach((d) => {
                    if (d.declaration.kind === 'class') {
                        const classFile = new URL(
                            `${d.path}/${d.declaration.sourceKeys.base.objectKey}/class.json`,
                            jsonObjectDirectory,
                        );
                        saveDataInfo.push({ outputPath: classFile, data: d.declaration });
                    } else {
                        const declarationFile = new URL(
                            `${d.path}/${'base' in d.declaration.sourceKeys ? d.declaration.sourceKeys.base.objectKey : d.declaration.sourceKeys.objectKey}.json`,
                            jsonObjectDirectory,
                        );
                        saveDataInfo.push({
                            outputPath: declarationFile,
                            data: { ref: d.refPoint, result: d.declaration },
                        });
                    }
                });
            }
        }

        return saveDataInfo;
    }
}
