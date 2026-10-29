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

    static async saveErrors(target: Extract<SaveFileType, { dataType: 'error' }>) {}

    static async saveApexClasses(target: Extract<SaveFileType, { dataType: 'compilationUnit' }>) {}

    static async saveTriggerUnits(target: Extract<SaveFileType, { dataType: 'triggerUnit' }>) {}

    static async saveAnonymousUnits(target: Extract<SaveFileType, { dataType: 'anonymousUnit' }>) {}
}

