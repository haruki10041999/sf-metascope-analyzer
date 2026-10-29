import fs from 'node:fs/promises';
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
    makeTriggerUnitJson,
    makeAnonymousUnitJson,
    makeConvertType,
    regenerateSourceObjects,
    JsonType,
    ErrorCode,
    SourceJson,
    ErrorJson,
    isErrorJson,
} from '../../types';

import { ApexParserFactory } from '@apexdevtools/apex-parser';

type ResolvedErrorType = {
    code: ErrorCode;
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
          result: AnonymousUnitType;
          sourceObjects: SourceJson[];
      }
    | {
          dataType: 'compilationUnit';
          result: CompilationUnitType;
          sourceObjects: SourceJson[];
      }
    | {
          dataType: 'triggerUnit';
          result: TriggerUnitType;
          sourceObjects: SourceJson[];
      }
);

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
                result: unit,
                sourceObjects: regenerateSourceObjects(sourceObjects, unit as JsonType<string>),
            };
        } else if (result.type === 'compilationUnit') {
            const unit = makeCompilationUnitJson(result);
            return {
                filePath: filePath,
                resolvedError: unResolvedErrors,
                result: unit,
                sourceObjects: regenerateSourceObjects(sourceObjects, unit as JsonType<string>),
            };
        } else {
            const unit = makeTriggerUnitJson(result);
            return {
                filePath: filePath,
                resolvedError: unResolvedErrors,
                result: unit,
                sourceObjects: regenerateSourceObjects(sourceObjects, unit as JsonType<string>),
            };
        }
    }

    static async saveApexClasses();

    static async findClsFiles(repogitoryDir: string): Promise<string[]> {
        const clsDir = path.join(repogitoryDir, 'force-app', 'main', 'default', 'classes');

        const result: string[] = [];

        for (const entry of await fs.readdir(clsDir, { withFileTypes: true })) {
            const fullPath = path.join(clsDir, entry.name);

            if (entry.isDirectory()) {
                result.push(...(await this.findClsFiles(fullPath)));
            } else if (entry.isFile() && entry.name.endsWith('.cls')) {
                result.push(fullPath);
            }
        }

        return result;
    }

    static async saveApexClass(clsData: ClsDataType, outputDir: string): Promise<void> {
        if (clsData.value) {
            const resultDir = path.join(outputDir, 'cls');
            await fs.mkdir(resultDir, { recursive: true });
            const resultPath = path.join(
                resultDir,
                path.basename(path.basename(clsData.filePath).replace('.cls', '.json')),
            );

            await fs.writeFile(resultPath, JSON.stringify(clsData.value, null, 2), 'utf-8');
        }

        if (clsData.errorClasses && clsData.errorClasses.length > 0) {
            const failedDir = path.join(outputDir, 'failed');
            await fs.mkdir(failedDir, { recursive: true });
            const failedPath = path.join(
                failedDir,
                path.basename(path.basename(clsData.filePath).replace('.cls', '.json')),
            );
            await fs.writeFile(
                failedPath,
                JSON.stringify(
                    clsData.errorClasses.map((error) => errorToJson(error)),
                    null,
                    2,
                ),
                'utf-8',
            );
        }
    }

    static async saveAllApexClasses(clsDataArray: ClsDataType[], outputDir: string): Promise<void> {
        for (const clsData of clsDataArray) {
            await this.saveApexClass(clsData, outputDir);
        }
    }
}

