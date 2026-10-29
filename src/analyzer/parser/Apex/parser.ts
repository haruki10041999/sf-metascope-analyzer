import fs, { mkdir, writeFile } from 'node:fs/promises';
import path from 'path';
import { pathToFileURL } from 'node:url';

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
} from '../../types';

import {
    ReplacedAnonymousUnit,
    ReplacedCompilationUnit,
    ReplacedDeclarationReference,
    replaceDeclarationRef,
    ReplacedTriggerUnit,
} from './extractor';

import { ApexParserFactory } from '@apexdevtools/apex-parser';

type ResolvedErrorType = {
    code: string;
    contextType: string;
    context: string;
    errorMessage: string;
};

type FileStructureType = {
    filePath: string;
    resolvedError: ResolvedErrorType[];
} & (
    | {
          dataType: 'error';
          result: {
              id: string;
              base: ErrorType | ErrorJson;
              sourceObject?: SourceJson[];
          };
      }
    | {
          dataType: 'enum' | 'interface';
          result: {
              id: string;
              base: CompilationUnitJson;
              sourceObject: SourceJson[];
          };
      }
    | {
          dataType: 'class';
          result: {
              id: string;
              base: ReplacedCompilationUnit;
              declaration: ReplacedDeclarationReference[];
              sourceObject: SourceJson[];
          };
      }
    | {
          dataType: 'trigger';
          result: {
              id: string;
              base: ReplacedTriggerUnit;
              declaration: ReplacedDeclarationReference[];
              sourceObject: SourceJson[];
          };
      }
    | {
          dataType: 'anonymous';
          result: {
              id: string;
              base: ReplacedAnonymousUnit;
              declaration: ReplacedDeclarationReference[];
              sourceObject: SourceJson[];
          };
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
    static async parseApexClass(filePath: string): Promise<FileStructureType> {
        const id = `${path.basename(filePath).split('.')[0]!}_${crypto.randomUUID()}`;

        const source = await fs.readFile(filePath, 'utf-8');
        const errorListener = new CommonErrorListener(source);

        const { parser } = ApexParserFactory.createLexerAndParser(source, errorListener);
        const unResolvedError = errorListener.getErrors();

        const resolvedErrors: ResolvedErrorType[] = unResolvedError.map((error) => ({
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
                resolvedError: resolvedErrors,
                dataType: 'error',
                result: {
                    id: id,
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
                    id: id,
                    base: unit,
                    sourceObject: regenerateSource,
                },
            };
        }

        if (unit.fileType === 'cls' && (unit.kind === 'interface' || unit.kind === 'enum')) {
            unit;
            return {
                filePath: filePath,
                resolvedError: resolvedErrors,
                dataType: unit.kind,
                result: {
                    id: id,
                    base: unit,
                    sourceObject: regenerateSource,
                },
            };
        }

        const { unit: replacedUnit, declarations: extractDeclarations } = replaceDeclarationRef(
            unit,
            id,
        );

        if (replacedUnit.fileType === 'cls') {
            return {
                filePath: filePath,
                resolvedError: resolvedErrors,
                dataType: 'class',
                result: {
                    id: id,
                    base: replacedUnit,
                    declaration: extractDeclarations,
                    sourceObject: regenerateSourceObjects(sourceObjects, unit),
                },
            };
        } else if (replacedUnit.fileType === 'trigger') {
            return {
                filePath: filePath,
                resolvedError: resolvedErrors,
                dataType: 'trigger',
                result: {
                    id: id,
                    base: replacedUnit,
                    declaration: extractDeclarations,
                    sourceObject: regenerateSourceObjects(sourceObjects, unit),
                },
            };
        } else {
            return {
                filePath: filePath,
                resolvedError: resolvedErrors,
                dataType: 'anonymous',
                result: {
                    id: id,
                    base: replacedUnit,
                    declaration: extractDeclarations,
                    sourceObject: regenerateSourceObjects(sourceObjects, unit),
                },
            };
        }
    }

    static saveApexFile(baseDir: string, target: FileStructureType): SaveDataInfo[] {
        const outputDirectory = pathToFileURL(baseDir);

        const baseInfo: BaseInfo = {
            dataType: target.dataType,
            filePath: target.filePath,
            unResolvedError: target.resolvedError,
        };

        const baseInfoFile = new URL(`./${target.result}/basInfo.json`, outputDirectory);

        const saveDataInfo: SaveDataInfo[] = [{ outputPath: baseInfoFile, data: baseInfo }];

        if ('sourceObject' in target.result) {
            const sourceInfoFile = new URL(`./${target.result}/sourceInfo.json`, outputDirectory);
            saveDataInfo.push({ outputPath: sourceInfoFile, data: target.result.sourceObject });
        }

        const baseJsonFile = new URL(`./${target.result}/base.json`, outputDirectory);
        saveDataInfo.push({ outputPath: baseJsonFile, data: target.result });

        if (
            target.dataType === 'class' ||
            target.dataType === 'trigger' ||
            target.dataType === 'anonymous'
        ) {
            target.result.declaration.forEach((d) => {
                if (d.declaration.kind === 'class') {
                    const classFile = new URL(
                        `${d.path}/${d.declaration.sourceKeys.base.objectKey}/class.json`,
                        outputDirectory,
                    );
                    saveDataInfo.push({ outputPath: classFile, data: d.declaration });
                } else {
                    const declarationFile = new URL(
                        `${d.path}/${'base' in d.declaration.sourceKeys ? d.declaration.sourceKeys.base.objectKey : d.declaration.sourceKeys.objectKey}.json`,
                        outputDirectory,
                    );
                    saveDataInfo.push({
                        outputPath: declarationFile,
                        data: { ref: d.refPoint, result: d.declaration },
                    });
                }
            });
        }

        return saveDataInfo;
    }
}
