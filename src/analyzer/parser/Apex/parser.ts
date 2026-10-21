import fs from 'node:fs/promises';
import path from 'path';

import {
    assignMultiClass,
    CompilationUnitType,
    makeCompilationUnitRule,
    TriggerUnitType,
    makeTriggerUnitRule,
    AnonymousUnitType,
    makeAnonymousUnitRule,
    ErrorInfo,
    makeErrorAssignRule,
    UnitVisitor,
    CommonErrorListener,
} from '../../types';

import { ApexParserFactory } from '@apexdevtools/apex-parser';

export class ApexClsParser {
    static async parseApexClass(filePath: string) {
        const source = await fs.readFile(filePath, 'utf-8');
        const errorListener = new CommonErrorListener(source);

        const { parser } = ApexParserFactory.createLexerAndParser(source, errorListener);
        const unResolvedError = errorListener.getErrors();

        const unitTypeClass = new UnitVisitor().visit(parser.compilationUnit());

        const unitConvertType = assignMultiClass(unitTypeClass, [
            makeCompilationUnitRule(),
            makeTriggerUnitRule(),
            makeAnonymousUnitRule(),
            makeErrorAssignRule,
        ]);
    }

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
